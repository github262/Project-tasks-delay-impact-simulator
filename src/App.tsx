import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Project, Task, CalculatedTask, SavedScenario, SimulationResult } from './types';
import { SAMPLE_PROJECTS } from './data/sampleProjects';
import { calculateScheduleWithSimulation, validateAndTopologicalSort } from './engine/scheduler';
import { Navbar } from './components/Navbar';
import { TopKpiSummary } from './components/TopKpiSummary';
import { WhatIfSimulatorBar } from './components/WhatIfSimulatorBar';
import { ImpactChainView } from './components/ImpactChainView';
import { GanttTimeline } from './components/GanttTimeline';
import { TaskModal } from './components/TaskModal';
import { ProjectModal } from './components/ProjectModal';
import { ScenarioComparisonModal } from './components/ScenarioComparisonModal';
import { SensitivityRiskModal } from './components/SensitivityRiskModal';
import { ImportExportModal } from './components/ImportExportModal';
import { SaveScenarioModal } from './components/SaveScenarioModal';
import confetti from 'canvas-confetti';

export default function App() {
  // --- Persistent & Local State ---
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('project_simulator_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SAMPLE_PROJECTS;
  });
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || SAMPLE_PROJECTS[0].id;
  });
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => {
    try {
      const saved = localStorage.getItem('project_simulator_scenarios');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  
  // Interactive Simulation State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [delayDays, setDelayDays] = useState<number>(0);

  // Modals & Drawers State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CalculatedTask | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isScenariosModalOpen, setIsScenariosModalOpen] = useState(false);
  const [isSensitivityModalOpen, setIsSensitivityModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [isSaveScenarioModalOpen, setIsSaveScenarioModalOpen] = useState(false);

  // Active Project Reference
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECTS[0];
  }, [projects, activeProjectId]);

  // Sync projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('project_simulator_projects', JSON.stringify(projects));
    } catch {}
  }, [projects]);

  // Sync scenarios to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('project_simulator_scenarios', JSON.stringify(scenarios));
    } catch {}
  }, [scenarios]);

  // Fetch projects from API on initial load (if server available)
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
          setActiveProjectId(data.projects[0].id);
        }
      })
      .catch(err => console.log('Using local project storage:', err));
  }, []);

  // Fetch scenarios for active project (if server available)
  useEffect(() => {
    if (!activeProject?.id) return;
    fetch(`/api/projects/${activeProject.id}/scenarios`)
      .then(res => res.json())
      .then(data => {
        if (data.scenarios && data.scenarios.length > 0) {
          setScenarios(data.scenarios);
        }
      })
      .catch(err => console.log('Scenarios local fallback:', err));
  }, [activeProject?.id]);

  // Set default selected task when project changes
  useEffect(() => {
    if (activeProject && activeProject.tasks.length > 0) {
      // Pick the first non-milestone or critical task
      const defaultTask = activeProject.tasks.find(t => t.dependencies.length > 0) || activeProject.tasks[0];
      setSelectedTaskId(defaultTask.id);
      setDelayDays(0);
    }
  }, [activeProject?.id]);

  // --- Real-Time Scheduling & Simulation Engine ---
  const simulation: SimulationResult = useMemo(() => {
    if (!activeProject) {
      return calculateScheduleWithSimulation([], null, 0, {
        projectStartDate: '2026-09-01',
        useWorkingDaysOnly: true,
      });
    }

    return calculateScheduleWithSimulation(
      activeProject.tasks,
      selectedTaskId,
      delayDays,
      {
        projectStartDate: activeProject.startDate,
        useWorkingDaysOnly: activeProject.useWorkingDaysOnly,
      }
    );
  }, [activeProject, selectedTaskId, delayDays]);

  // Baseline simulation without any delay (for comparisons)
  const baselineSimulation: SimulationResult = useMemo(() => {
    if (!activeProject) return simulation;
    return calculateScheduleWithSimulation(
      activeProject.tasks,
      null,
      0,
      {
        projectStartDate: activeProject.startDate,
        useWorkingDaysOnly: activeProject.useWorkingDaysOnly,
      }
    );
  }, [activeProject]);

  // Trigger celebratory confetti when a slip is 100% absorbed by available buffer
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0d9488', '#059669', '#6366f1'],
    });
  }, []);

  // Handle delay change
  const handleDelayChange = (days: number) => {
    const nextDays = Math.max(0, days);
    setDelayDays(nextDays);

    // If delay is absorbed, fire micro confetti
    if (nextDays > 0 && selectedTaskId) {
      const testResult = calculateScheduleWithSimulation(
        activeProject.tasks,
        selectedTaskId,
        nextDays,
        {
          projectStartDate: activeProject.startDate,
          useWorkingDaysOnly: activeProject.useWorkingDaysOnly,
        }
      );
      if (testResult.launchImpactDays === 0 && testResult.totalBufferAbsorbed > 0) {
        triggerConfetti();
      }
    }
  };

  // Reset simulation back to baseline
  const handleResetSimulation = () => {
    setDelayDays(0);
  };

  // Select a task for delay testing
  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (delayDays === 0) {
      setDelayDays(5); // Default to +5 days to immediately show simulation
    }
  };

  // --- Task CRUD Operations ---
  const handleSaveTask = (taskData: Omit<Task, 'id'> & { id?: string }) => {
    let updatedTasks: Task[];

    if (taskData.id) {
      // Editing existing task
      updatedTasks = activeProject.tasks.map(t => (t.id === taskData.id ? { ...t, ...taskData, id: taskData.id! } : t));
    } else {
      // Creating new task
      const newTask: Task = {
        ...taskData,
        id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      };
      updatedTasks = [...activeProject.tasks, newTask];
    }

    const updatedProject: Project = {
      ...activeProject,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    };

    setProjects(prev => prev.map(p => (p.id === updatedProject.id ? updatedProject : p)));

    // Save to backend
    fetch(`/api/projects/${activeProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    }).catch(err => console.log('Local save sync:', err));
  };

  const handleDeleteTask = (taskId: string) => {
    // Remove task and clean up dependencies in remaining tasks
    const updatedTasks = activeProject.tasks
      .filter(t => t.id !== taskId)
      .map(t => ({
        ...t,
        dependencies: t.dependencies.filter(d => d !== taskId),
      }));

    const updatedProject: Project = {
      ...activeProject,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    };

    setProjects(prev => prev.map(p => (p.id === updatedProject.id ? updatedProject : p)));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(updatedTasks[0]?.id || null);
      setDelayDays(0);
    }

    fetch(`/api/projects/${activeProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    }).catch(err => console.log('Local delete sync:', err));
  };

  // --- Project CRUD & Switching ---
  const handleCreateOrUpdateProject = (projectData: Partial<Project>) => {
    if (isProjectModalOpen && activeProject) {
      // Update active project
      const updated: Project = {
        ...activeProject,
        ...projectData,
        updatedAt: new Date().toISOString(),
      };
      setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));

      fetch(`/api/projects/${activeProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(err => console.log('Local update sync:', err));
    }
  };

  const handleCreateNewProject = () => {
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: 'New Custom Project Plan',
      description: 'Custom project schedule with dependencies & buffers',
      startDate: new Date().toISOString().split('T')[0],
      useWorkingDaysOnly: true,
      tasks: [
        {
          id: `t_${Date.now()}_1`,
          name: 'Requirements & Scope',
          duration: 5,
          dependencies: [],
          bufferDays: 0,
          category: 'Planning',
          owner: 'Product Lead',
        },
        {
          id: `t_${Date.now()}_2`,
          name: 'Sprint 1 Development',
          duration: 10,
          dependencies: [`t_${Date.now()}_1`],
          bufferDays: 2,
          category: 'Engineering',
          owner: 'Engineering Team',
        },
        {
          id: `t_${Date.now()}_3`,
          name: 'QA & Staging Verification',
          duration: 5,
          dependencies: [`t_${Date.now()}_2`],
          bufferDays: 3,
          category: 'QA',
          owner: 'QA Lead',
        },
        {
          id: `t_${Date.now()}_4`,
          name: 'Public Release',
          duration: 1,
          dependencies: [`t_${Date.now()}_3`],
          bufferDays: 0,
          category: 'Milestone',
          owner: 'All',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(newProj.id);
    setSelectedTaskId(newProj.tasks[1].id);
    setDelayDays(3);

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProj),
    }).catch(err => console.log('Local new project sync:', err));
  };

  const handleLoadTemplate = (template: Project) => {
    const cloned: Project = {
      ...template,
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects(prev => [...prev, cloned]);
    setActiveProjectId(cloned.id);
    setSelectedTaskId(cloned.tasks[1]?.id || cloned.tasks[0]?.id || null);
    setDelayDays(5);
  };

  const handleToggleWorkingDays = () => {
    const updated: Project = {
      ...activeProject,
      useWorkingDaysOnly: !activeProject.useWorkingDaysOnly,
      updatedAt: new Date().toISOString(),
    };
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));

    fetch(`/api/projects/${activeProject.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(err => console.log('Working days toggle sync:', err));
  };

  // --- Scenario Management ---
  const handleSaveScenario = (name: string, description: string) => {
    if (!selectedTaskId) return;
    const targetTask = activeProject.tasks.find(t => t.id === selectedTaskId);

    const newScenario: SavedScenario = {
      id: `sc_${Date.now()}`,
      projectId: activeProject.id,
      name,
      description,
      targetTaskId: selectedTaskId,
      targetTaskName: targetTask?.name || 'Task',
      delayDays,
      simulatedLaunchDate: simulation.simulatedLaunchDate,
      launchImpactDays: simulation.launchImpactDays,
      affectedCount: simulation.affectedTasksCount,
      createdAt: new Date().toISOString(),
    };

    setScenarios(prev => [...prev, newScenario]);

    fetch(`/api/projects/${activeProject.id}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newScenario),
    }).catch(err => console.log('Scenario save sync:', err));
  };

  const handleLoadSavedScenario = (sc: SavedScenario) => {
    setSelectedTaskId(sc.targetTaskId);
    setDelayDays(sc.delayDays);
  };

  const handleDeleteScenario = (scenarioId: string) => {
    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
    fetch(`/api/scenarios/${scenarioId}`, { method: 'DELETE' }).catch(err => console.log('Delete scenario sync:', err));
  };

  // --- Import / Export Handlers ---
  const handleImportProject = (importedData: Partial<Project>) => {
    if (importedData.tasks && Array.isArray(importedData.tasks)) {
      const { hasCycle } = validateAndTopologicalSort(importedData.tasks);
      if (hasCycle) {
        alert('Cannot import project: circular dependency cycle detected.');
        return;
      }

      const updated: Project = {
        ...activeProject,
        ...importedData,
        updatedAt: new Date().toISOString(),
      };

      setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      setSelectedTaskId(updated.tasks[0]?.id || null);
      setDelayDays(0);
    }
  };

  const selectedCalculatedTask = simulation.tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        projects={projects}
        activeProject={activeProject}
        scenarios={scenarios}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setDelayDays(0);
        }}
        onNewProject={handleCreateNewProject}
        onEditProject={() => setIsProjectModalOpen(true)}
        onLoadTemplate={handleLoadTemplate}
        onOpenScenarios={() => setIsScenariosModalOpen(true)}
        onOpenSensitivity={() => setIsSensitivityModalOpen(true)}
        onOpenImportExport={() => setIsImportExportModalOpen(true)}
        onToggleWorkingDays={handleToggleWorkingDays}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 flex-1 flex flex-col">
        
        {/* Top-Level KPI Summary Card */}
        <TopKpiSummary
          simulation={simulation}
          onReset={handleResetSimulation}
          onSaveScenario={() => setIsSaveScenarioModalOpen(true)}
        />

        {/* What-If Simulation Calculator Bar */}
        <WhatIfSimulatorBar
          tasks={simulation.tasks}
          selectedTaskId={selectedTaskId}
          delayDays={delayDays}
          onSelectTask={handleSelectTask}
          onChangeDelay={handleDelayChange}
          onReset={handleResetSimulation}
          onOpenSensitivity={() => setIsSensitivityModalOpen(true)}
        />

        {/* Downstream Impact Chain (Breadcrumb visualization) */}
        {delayDays > 0 && selectedTaskId && (
          <ImpactChainView
            chain={simulation.impactChain}
            selectedTaskName={selectedCalculatedTask?.name}
            delayDays={delayDays}
          />
        )}

        {/* Main Gantt Timeline Workspace */}
        <div className="flex-1">
          <GanttTimeline
            simulation={simulation}
            selectedTaskId={selectedTaskId}
            useWorkingDaysOnly={activeProject.useWorkingDaysOnly}
            onSelectTask={handleSelectTask}
            onAddTask={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Project Delay Impact Simulator • CPM Critical Path & Float Scheduling Engine
          </span>
          <span className="text-slate-400">
            {activeProject.name} • {activeProject.tasks.length} tasks • {activeProject.useWorkingDaysOnly ? '5-Day Business Calendar' : '7-Day Calendar'}
          </span>
        </div>
      </footer>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        allTasks={activeProject.tasks}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleCreateOrUpdateProject}
        editingProject={activeProject}
      />

      <ScenarioComparisonModal
        isOpen={isScenariosModalOpen}
        onClose={() => setIsScenariosModalOpen(false)}
        scenarios={scenarios}
        baselineSimulation={baselineSimulation}
        project={activeProject}
        onLoadScenario={handleLoadSavedScenario}
        onDeleteScenario={handleDeleteScenario}
      />

      <SensitivityRiskModal
        isOpen={isSensitivityModalOpen}
        onClose={() => setIsSensitivityModalOpen(false)}
        project={activeProject}
        onSelectTaskToSimulate={(taskId, days) => {
          setSelectedTaskId(taskId);
          setDelayDays(days);
        }}
      />

      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        project={activeProject}
        simulation={simulation}
        onImportProject={handleImportProject}
      />

      <SaveScenarioModal
        isOpen={isSaveScenarioModalOpen}
        onClose={() => setIsSaveScenarioModalOpen(false)}
        onSave={handleSaveScenario}
        selectedTask={selectedCalculatedTask}
        delayDays={delayDays}
        simulatedLaunchDate={simulation.simulatedLaunchDate}
        launchImpactDays={simulation.launchImpactDays}
      />

    </div>
  );
}
