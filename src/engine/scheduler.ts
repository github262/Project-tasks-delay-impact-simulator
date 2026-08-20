import { Task, CalculatedTask, SimulationResult, ImpactChainStep, TaskSensitivity } from '../types';
import { addDays, daysBetween, parseISODate, formatISODate } from './dateUtils';

export interface SchedulerOptions {
  projectStartDate: string;
  useWorkingDaysOnly?: boolean;
}

/**
 * Validates dependencies and checks for cyclic relationships (Kahn's algorithm)
 */
export function validateAndTopologicalSort(tasks: Task[]): { sortedIds: string[]; hasCycle: boolean; cycleNodes?: string[] } {
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>(); // pred -> successors
  const validIds = new Set(tasks.map(t => t.id));

  tasks.forEach(t => {
    inDegree.set(t.id, 0);
    graph.set(t.id, []);
  });

  tasks.forEach(task => {
    task.dependencies.forEach(predId => {
      if (validIds.has(predId)) {
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
        graph.get(predId)?.push(task.id);
      }
    });
  });

  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const sortedIds: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    sortedIds.push(u);

    const neighbors = graph.get(u) || [];
    for (const v of neighbors) {
      const currentInDegree = (inDegree.get(v) || 1) - 1;
      inDegree.set(v, currentInDegree);
      if (currentInDegree === 0) {
        queue.push(v);
      }
    }
  }

  const hasCycle = sortedIds.length !== tasks.length;
  const cycleNodes = hasCycle ? tasks.map(t => t.id).filter(id => !sortedIds.includes(id)) : undefined;

  return { sortedIds, hasCycle, cycleNodes };
}

/**
 * Calculates both the Baseline and Simulated schedules, including CPM Float, Critical Path, and Impact Chain.
 */
export function calculateScheduleWithSimulation(
  tasks: Task[],
  targetTaskId: string | null = null,
  delayDays: number = 0,
  options: SchedulerOptions
): SimulationResult {
  const { projectStartDate, useWorkingDaysOnly = false } = options;

  if (tasks.length === 0) {
    return {
      projectId: 'default',
      targetTaskId: null,
      delayDays: 0,
      baselineLaunchDate: projectStartDate,
      simulatedLaunchDate: projectStartDate,
      launchImpactDays: 0,
      totalTasksCount: 0,
      affectedTasksCount: 0,
      isTargetOnCriticalPath: false,
      totalBufferAbsorbed: 0,
      criticalPathTaskIds: [],
      tasks: [],
      impactChain: [],
      projectStartDate,
      totalProjectDurationBaseline: 0,
      totalProjectDurationSimulated: 0,
    };
  }

  const { sortedIds, hasCycle } = validateAndTopologicalSort(tasks);
  
  // If there is a cycle, handle gracefully by falling back to raw list order
  const taskMap = new Map<string, Task>(tasks.map(t => [t.id, t]));
  const order = hasCycle ? tasks.map(t => t.id) : sortedIds;

  // Build adjacency maps
  const successorsMap = new Map<string, string[]>();
  const predecessorsMap = new Map<string, string[]>();
  
  tasks.forEach(t => {
    successorsMap.set(t.id, []);
    predecessorsMap.set(t.id, [...t.dependencies.filter(id => taskMap.has(id))]);
  });

  tasks.forEach(t => {
    t.dependencies.forEach(predId => {
      if (taskMap.has(predId)) {
        successorsMap.get(predId)?.push(t.id);
      }
    });
  });

  // --- 1. BASELINE FORWARD PASS ---
  const baselineStart = new Map<string, string>();
  const baselineEnd = new Map<string, string>();

  order.forEach(id => {
    const task = taskMap.get(id)!;
    const preds = predecessorsMap.get(id) || [];

    let start = task.startDate || projectStartDate;

    if (preds.length > 0) {
      let maxPredEnd = projectStartDate;
      preds.forEach(pId => {
        const pEnd = baselineEnd.get(pId) || projectStartDate;
        if (parseISODate(pEnd) > parseISODate(maxPredEnd)) {
          maxPredEnd = pEnd;
        }
      });
      // Start is immediately at or after the max predecessor end
      start = maxPredEnd;
    }

    const duration = Math.max(1, task.duration || 1);
    const end = addDays(start, duration, useWorkingDaysOnly);
    baselineStart.set(id, start);
    baselineEnd.set(id, end);
  });

  // Project baseline completion date is the max of all task finish dates
  let baselineLaunchDate = projectStartDate;
  baselineEnd.forEach(end => {
    if (parseISODate(end) > parseISODate(baselineLaunchDate)) {
      baselineLaunchDate = end;
    }
  });

  // --- 2. BASELINE BACKWARD PASS (Critical Path & Float) ---
  const latestFinish = new Map<string, string>();
  const latestStart = new Map<string, string>();
  const totalFloat = new Map<string, number>();

  // Reverse topological order
  const reverseOrder = [...order].reverse();

  reverseOrder.forEach(id => {
    const task = taskMap.get(id)!;
    const succs = successorsMap.get(id) || [];

    let lf = baselineLaunchDate;

    if (succs.length > 0) {
      let minSuccStart = baselineLaunchDate;
      succs.forEach(sId => {
        const sLs = latestStart.get(sId) || baselineLaunchDate;
        if (parseISODate(sLs) < parseISODate(minSuccStart)) {
          minSuccStart = sLs;
        }
      });
      lf = minSuccStart;
    }

    const duration = Math.max(1, task.duration || 1);
    const ls = addDays(lf, -duration, useWorkingDaysOnly);
    latestFinish.set(id, lf);
    latestStart.set(id, ls);

    const es = baselineStart.get(id)!;
    const floatDays = Math.max(0, daysBetween(es, ls, useWorkingDaysOnly));
    totalFloat.set(id, floatDays);
  });

  const criticalPathTaskIds = tasks
    .filter(t => (totalFloat.get(t.id) || 0) === 0)
    .map(t => t.id);

  // --- 3. SIMULATED FORWARD PASS (With Delays & Buffer Absorption) ---
  const simulatedStart = new Map<string, string>();
  const simulatedEnd = new Map<string, string>();
  const bufferAbsorbedMap = new Map<string, number>();
  const delayReceivedMap = new Map<string, number>();
  const delayPassedMap = new Map<string, number>();

  // Initialize
  tasks.forEach(t => {
    bufferAbsorbedMap.set(t.id, 0);
    delayReceivedMap.set(t.id, 0);
    delayPassedMap.set(t.id, 0);
  });

  order.forEach(id => {
    const task = taskMap.get(id)!;
    const preds = predecessorsMap.get(id) || [];
    const baseStart = baselineStart.get(id)!;
    const baseEnd = baselineEnd.get(id)!;

    let simStart = baseStart;
    let receivedDelay = 0;

    if (preds.length > 0) {
      let maxPredSimEnd = projectStartDate;
      
      preds.forEach(pId => {
        const pSimEnd = simulatedEnd.get(pId) || projectStartDate;
        if (parseISODate(pSimEnd) > parseISODate(maxPredSimEnd)) {
          maxPredSimEnd = pSimEnd;
        }
      });

      // The simulated start will be pushed if predecessor simulated end is later than baseline start
      if (parseISODate(maxPredSimEnd) > parseISODate(baseStart)) {
        simStart = maxPredSimEnd;
        receivedDelay = daysBetween(baseStart, simStart, useWorkingDaysOnly);
      }
    }

    delayReceivedMap.set(id, receivedDelay);

    // Apply direct delay if this is the target task
    const isDirectTarget = targetTaskId === id;
    const directExtraDays = isDirectTarget ? Math.max(0, delayDays) : 0;
    
    // Check available buffer/float on this task to absorb delay
    const taskBuffer = Math.max(0, task.bufferDays || 0);
    let absorbed = 0;
    let netAdditionalDelay = directExtraDays;

    if (taskBuffer > 0 && directExtraDays > 0) {
      absorbed = Math.min(taskBuffer, directExtraDays);
      netAdditionalDelay = directExtraDays - absorbed;
    } else if (taskBuffer > 0 && receivedDelay > 0 && !isDirectTarget) {
      // If task has explicit buffer and receives upstream delay, it can absorb some of it
      absorbed = Math.min(taskBuffer, receivedDelay);
    }

    bufferAbsorbedMap.set(id, absorbed);

    const baseDuration = Math.max(1, task.duration || 1);
    // Total simulated duration considering direct delay and absorbed buffer
    const effectiveDuration = baseDuration + netAdditionalDelay - (isDirectTarget ? 0 : absorbed);
    const simEnd = addDays(simStart, Math.max(1, effectiveDuration), useWorkingDaysOnly);

    simulatedStart.set(id, simStart);
    simulatedEnd.set(id, simEnd);

    const endShift = Math.max(0, daysBetween(baseEnd, simEnd, useWorkingDaysOnly));
    delayPassedMap.set(id, endShift);
  });

  // Simulated launch date
  let simulatedLaunchDate = projectStartDate;
  simulatedEnd.forEach(end => {
    if (parseISODate(end) > parseISODate(simulatedLaunchDate)) {
      simulatedLaunchDate = end;
    }
  });

  const launchImpactDays = Math.max(0, daysBetween(baselineLaunchDate, simulatedLaunchDate, useWorkingDaysOnly));

  // --- 4. ASSEMBLE CALCULATED TASKS ---
  const calculatedTasks: CalculatedTask[] = tasks.map(task => {
    const bStart = baselineStart.get(task.id) || projectStartDate;
    const bEnd = baselineEnd.get(task.id) || projectStartDate;
    const sStart = simulatedStart.get(task.id) || projectStartDate;
    const sEnd = simulatedEnd.get(task.id) || projectStartDate;

    const startDelay = Math.max(0, daysBetween(bStart, sStart, useWorkingDaysOnly));
    const endDelay = Math.max(0, daysBetween(bEnd, sEnd, useWorkingDaysOnly));
    const isDirect = targetTaskId === task.id && delayDays > 0;
    const isAffected = startDelay > 0 || endDelay > 0 || isDirect;
    const isCritical = (totalFloat.get(task.id) || 0) === 0;
    const absorbed = bufferAbsorbedMap.get(task.id) || 0;

    let status: CalculatedTask['status'] = 'unaffected';
    if (isDirect) {
      status = 'selected';
    } else if (absorbed > 0) {
      status = 'buffered';
    } else if (endDelay > 0 && isCritical) {
      status = 'critical';
    } else if (endDelay > 0 || startDelay > 0) {
      status = 'delayed';
    } else if (isCritical) {
      status = 'critical';
    }

    const bStartIdx = daysBetween(projectStartDate, bStart, useWorkingDaysOnly);
    const bEndIdx = daysBetween(projectStartDate, bEnd, useWorkingDaysOnly);
    const sStartIdx = daysBetween(projectStartDate, sStart, useWorkingDaysOnly);
    const sEndIdx = daysBetween(projectStartDate, sEnd, useWorkingDaysOnly);

    return {
      id: task.id,
      name: task.name,
      duration: task.duration,
      dependencies: task.dependencies,
      bufferDays: task.bufferDays || 0,
      category: task.category,
      owner: task.owner,
      baselineStart: bStart,
      baselineEnd: bEnd,
      baselineStartDayIndex: bStartIdx,
      baselineEndDayIndex: bEndIdx,
      simulatedStart: sStart,
      simulatedEnd: sEnd,
      simulatedStartDayIndex: sStartIdx,
      simulatedEndDayIndex: sEndIdx,
      totalFloat: totalFloat.get(task.id) || 0,
      freeFloat: 0, // secondary metric
      isCritical,
      startDelay,
      endDelay,
      bufferAbsorbed: absorbed,
      isAffected,
      isDirectlyDelayed: isDirect,
      status,
    };
  });

  // --- 5. BUILD HUMAN-READABLE IMPACT CHAIN ---
  const impactChain: ImpactChainStep[] = [];
  if (targetTaskId && delayDays > 0) {
    const targetTask = taskMap.get(targetTaskId);
    if (targetTask) {
      // Step 1: Target task
      const targetAbsorbed = bufferAbsorbedMap.get(targetTaskId) || 0;
      const targetPassed = delayPassedMap.get(targetTaskId) || delayDays;
      impactChain.push({
        taskId: targetTaskId,
        taskName: targetTask.name,
        delayReceived: delayDays,
        bufferAbsorbed: targetAbsorbed,
        delayPassedOn: targetPassed,
        isCritical: (totalFloat.get(targetTaskId) || 0) === 0,
      });

      // Find primary downstream propagation path
      let currentId = targetTaskId;
      const visited = new Set<string>([targetTaskId]);

      while (true) {
        const succs = successorsMap.get(currentId) || [];
        if (succs.length === 0) break;

        // Choose the successor that received the highest delay and/or is critical
        let worstSuccId: string | null = null;
        let maxDelay = -1;

        succs.forEach(sId => {
          if (!visited.has(sId)) {
            const shift = delayPassedMap.get(sId) || 0;
            const isCrit = (totalFloat.get(sId) || 0) === 0;
            const weight = shift + (isCrit ? 1000 : 0);
            if (weight > maxDelay) {
              maxDelay = weight;
              worstSuccId = sId;
            }
          }
        });

        if (!worstSuccId || (delayPassedMap.get(worstSuccId) === 0 && (delayReceivedMap.get(worstSuccId) === 0))) {
          break;
        }

        visited.add(worstSuccId);
        const succTask = taskMap.get(worstSuccId)!;
        const sReceived = delayReceivedMap.get(worstSuccId) || 0;
        const sAbsorbed = bufferAbsorbedMap.get(worstSuccId) || 0;
        const sPassed = delayPassedMap.get(worstSuccId) || 0;

        impactChain.push({
          taskId: worstSuccId,
          taskName: succTask.name,
          delayReceived: sReceived,
          bufferAbsorbed: sAbsorbed,
          delayPassedOn: sPassed,
          isCritical: (totalFloat.get(worstSuccId) || 0) === 0,
        });

        currentId = worstSuccId;
      }

      // Final Milestone step
      impactChain.push({
        taskId: 'launch_milestone',
        taskName: 'Final Project Launch',
        delayReceived: launchImpactDays,
        bufferAbsorbed: 0,
        delayPassedOn: launchImpactDays,
        isCritical: true,
        isLaunchMilestone: true,
      });
    }
  }

  const affectedCount = calculatedTasks.filter(t => t.isAffected).length;
  const isTargetCrit = targetTaskId ? (totalFloat.get(targetTaskId) || 0) === 0 : false;
  let totalBufferAbsorbed = 0;
  bufferAbsorbedMap.forEach(abs => { totalBufferAbsorbed += abs; });

  const totalProjectDurationBaseline = daysBetween(projectStartDate, baselineLaunchDate, useWorkingDaysOnly);
  const totalProjectDurationSimulated = daysBetween(projectStartDate, simulatedLaunchDate, useWorkingDaysOnly);

  return {
    projectId: 'active_project',
    targetTaskId,
    delayDays,
    baselineLaunchDate,
    simulatedLaunchDate,
    launchImpactDays,
    totalTasksCount: tasks.length,
    affectedTasksCount: affectedCount,
    isTargetOnCriticalPath: isTargetCrit,
    totalBufferAbsorbed,
    criticalPathTaskIds,
    tasks: calculatedTasks,
    impactChain,
    projectStartDate,
    totalProjectDurationBaseline,
    totalProjectDurationSimulated,
  };
}

/**
 * Computes risk sensitivity for every task to highlight launch vulnerabilities
 */
export function calculateProjectSensitivity(tasks: Task[], options: SchedulerOptions): TaskSensitivity[] {
  if (tasks.length === 0) return [];

  const baseResult = calculateScheduleWithSimulation(tasks, null, 0, options);
  
  return tasks.map(task => {
    const calcTask = baseResult.tasks.find(t => t.id === task.id);
    const totalFloat = calcTask?.totalFloat || 0;
    const isCritical = calcTask?.isCritical || false;

    // Test simulated delays: +3 days, +7 days, +14 days
    const res3 = calculateScheduleWithSimulation(tasks, task.id, 3, options);
    const res7 = calculateScheduleWithSimulation(tasks, task.id, 7, options);
    const res14 = calculateScheduleWithSimulation(tasks, task.id, 14, options);

    let riskLevel: TaskSensitivity['riskLevel'] = 'low';
    if (isCritical) {
      riskLevel = 'critical';
    } else if (res3.launchImpactDays > 0) {
      riskLevel = 'high';
    } else if (res7.launchImpactDays > 0) {
      riskLevel = 'medium';
    }

    return {
      taskId: task.id,
      taskName: task.name,
      category: task.category,
      duration: task.duration,
      totalFloat,
      isCritical,
      impactIfDelayed3Days: res3.launchImpactDays,
      impactIfDelayed7Days: res7.launchImpactDays,
      impactIfDelayed14Days: res14.launchImpactDays,
      riskLevel,
    };
  });
}
