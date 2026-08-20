export interface Task {
  id: string;
  name: string;
  duration: number; // in days
  dependencies: string[]; // IDs of predecessor tasks
  bufferDays?: number; // explicit buffer/cushion added after or during this task (e.g. 3 days)
  startDate?: string; // explicit base start date for root tasks (YYYY-MM-DD)
  category?: string; // e.g. Design, Engineering, QA, Marketing, Compliance
  owner?: string;
  notes?: string;
}

export type TaskStatus = 'unaffected' | 'delayed' | 'buffered' | 'critical' | 'selected';

export interface CalculatedTask {
  id: string;
  name: string;
  duration: number;
  dependencies: string[];
  bufferDays: number;
  category?: string;
  owner?: string;
  
  // Baseline schedule
  baselineStart: string;
  baselineEnd: string;
  baselineStartDayIndex: number;
  baselineEndDayIndex: number;
  
  // Simulated schedule (with delays applied)
  simulatedStart: string;
  simulatedEnd: string;
  simulatedStartDayIndex: number;
  simulatedEndDayIndex: number;
  
  // Float and Critical Path
  totalFloat: number; // in days
  freeFloat: number; // in days
  isCritical: boolean;
  
  // Simulation impact metrics
  startDelay: number; // days shifted at start
  endDelay: number; // days shifted at finish
  bufferAbsorbed: number; // days of buffer absorbed by this task
  isAffected: boolean;
  isDirectlyDelayed: boolean;
  status: TaskStatus;
}

export interface ImpactChainStep {
  taskId: string;
  taskName: string;
  delayReceived: number;
  bufferAbsorbed: number;
  delayPassedOn: number;
  isCritical: boolean;
  isLaunchMilestone?: boolean;
}

export interface SimulationResult {
  projectId: string;
  targetTaskId: string | null;
  delayDays: number;
  baselineLaunchDate: string;
  simulatedLaunchDate: string;
  launchImpactDays: number;
  totalTasksCount: number;
  affectedTasksCount: number;
  isTargetOnCriticalPath: boolean;
  totalBufferAbsorbed: number;
  criticalPathTaskIds: string[];
  tasks: CalculatedTask[];
  impactChain: ImpactChainStep[];
  projectStartDate: string;
  totalProjectDurationBaseline: number;
  totalProjectDurationSimulated: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  useWorkingDaysOnly: boolean; // 5-day week (Mon-Fri) vs 7-day week
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedScenario {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  targetTaskId: string;
  targetTaskName: string;
  delayDays: number;
  simulatedLaunchDate: string;
  launchImpactDays: number;
  affectedCount: number;
  createdAt: string;
}

export interface TaskSensitivity {
  taskId: string;
  taskName: string;
  category?: string;
  duration: number;
  totalFloat: number;
  isCritical: boolean;
  impactIfDelayed3Days: number;
  impactIfDelayed7Days: number;
  impactIfDelayed14Days: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}
