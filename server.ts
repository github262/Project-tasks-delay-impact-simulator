import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_PROJECTS } from './src/data/sampleProjects';
import { Project, SavedScenario } from './src/types';
import { calculateScheduleWithSimulation, calculateProjectSensitivity, validateAndTopologicalSort } from './src/engine/scheduler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory persistent state (seeded with rich sample projects)
  let projects: Project[] = [...SAMPLE_PROJECTS];
  let savedScenarios: SavedScenario[] = [
    {
      id: 'sc_ui_slip_5',
      projectId: 'proj_saas_launch',
      name: 'UI Redesign +5 Days Slip',
      description: 'Simulates design tokens taking an extra 5 days',
      targetTaskId: 't_ui_design',
      targetTaskName: 'High-Fidelity UI System & Design Tokens',
      delayDays: 5,
      simulatedLaunchDate: '2026-10-23',
      launchImpactDays: 3,
      affectedCount: 4,
      createdAt: '2026-08-20T00:00:00.000Z'
    },
    {
      id: 'sc_backend_slip_7',
      projectId: 'proj_saas_launch',
      name: 'Backend Webhooks +7 Days Slip',
      description: 'Stripe webhook complexity extends backend sprint',
      targetTaskId: 't_backend_engine',
      targetTaskName: 'Core Business Logic & Payment Webhooks',
      delayDays: 7,
      simulatedLaunchDate: '2026-10-26',
      launchImpactDays: 4,
      affectedCount: 4,
      createdAt: '2026-08-20T00:00:00.000Z'
    }
  ];

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Projects CRUD
  app.get('/api/projects', (req, res) => {
    res.json({ projects });
  });

  app.get('/api/projects/:id', (req, res) => {
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project });
  });

  app.post('/api/projects', (req, res) => {
    const { name, description = '', startDate = new Date().toISOString().split('T')[0], useWorkingDaysOnly = true, tasks = [] } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name,
      description,
      startDate,
      useWorkingDaysOnly,
      tasks: tasks.length > 0 ? tasks : [
        {
          id: `t_${Date.now()}_1`,
          name: 'Kickoff & Initial Planning',
          duration: 5,
          dependencies: [],
          bufferDays: 0,
          category: 'Planning',
          owner: 'Project Lead'
        },
        {
          id: `t_${Date.now()}_2`,
          name: 'Core Execution',
          duration: 10,
          dependencies: [`t_${Date.now()}_1`],
          bufferDays: 2,
          category: 'Execution',
          owner: 'Core Team'
        },
        {
          id: `t_${Date.now()}_3`,
          name: 'Final Launch Milestone',
          duration: 1,
          dependencies: [`t_${Date.now()}_2`],
          bufferDays: 0,
          category: 'Milestone',
          owner: 'All'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(newProject);
    res.status(201).json({ project: newProject });
  });

  app.put('/api/projects/:id', (req, res) => {
    const index = projects.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const current = projects[index];
    const { name, description, startDate, useWorkingDaysOnly, tasks } = req.body;

    // Validate tasks if provided
    if (tasks) {
      const { hasCycle } = validateAndTopologicalSort(tasks);
      if (hasCycle) {
        return res.status(400).json({ error: 'Circular dependency detected in tasks' });
      }
    }

    const updated: Project = {
      ...current,
      name: name ?? current.name,
      description: description ?? current.description,
      startDate: startDate ?? current.startDate,
      useWorkingDaysOnly: useWorkingDaysOnly !== undefined ? useWorkingDaysOnly : current.useWorkingDaysOnly,
      tasks: tasks ?? current.tasks,
      updatedAt: new Date().toISOString()
    };

    projects[index] = updated;
    res.json({ project: updated });
  });

  app.delete('/api/projects/:id', (req, res) => {
    projects = projects.filter(p => p.id !== req.params.id);
    savedScenarios = savedScenarios.filter(s => s.projectId !== req.params.id);
    res.json({ success: true, remaining: projects.length });
  });

  // Calculate & Simulate Scheduling API
  app.post('/api/projects/:id/simulate', (req, res) => {
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { targetTaskId = null, delayDays = 0 } = req.body;
    const result = calculateScheduleWithSimulation(
      project.tasks,
      targetTaskId,
      Number(delayDays) || 0,
      {
        projectStartDate: project.startDate,
        useWorkingDaysOnly: project.useWorkingDaysOnly
      }
    );

    res.json({ result });
  });

  // Sensitivity Risk Matrix API
  app.get('/api/projects/:id/sensitivity', (req, res) => {
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const sensitivity = calculateProjectSensitivity(project.tasks, {
      projectStartDate: project.startDate,
      useWorkingDaysOnly: project.useWorkingDaysOnly
    });

    res.json({ sensitivity });
  });

  // Scenarios CRUD
  app.get('/api/projects/:id/scenarios', (req, res) => {
    const scenarios = savedScenarios.filter(s => s.projectId === req.params.id);
    res.json({ scenarios });
  });

  app.post('/api/projects/:id/scenarios', (req, res) => {
    const { name, description = '', targetTaskId, targetTaskName, delayDays, simulatedLaunchDate, launchImpactDays, affectedCount } = req.body;
    if (!name || !targetTaskId) {
      return res.status(400).json({ error: 'Name and target task are required' });
    }

    const newScenario: SavedScenario = {
      id: `sc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      projectId: req.params.id,
      name,
      description,
      targetTaskId,
      targetTaskName: targetTaskName || 'Selected Task',
      delayDays: Number(delayDays) || 0,
      simulatedLaunchDate: simulatedLaunchDate || '',
      launchImpactDays: Number(launchImpactDays) || 0,
      affectedCount: Number(affectedCount) || 0,
      createdAt: new Date().toISOString()
    };

    savedScenarios.push(newScenario);
    res.status(201).json({ scenario: newScenario });
  });

  app.delete('/api/scenarios/:id', (req, res) => {
    savedScenarios = savedScenarios.filter(s => s.id !== req.params.id);
    res.json({ success: true });
  });

  // General Standalone Calculation API
  app.post('/api/calculate', (req, res) => {
    const { tasks, targetTaskId = null, delayDays = 0, projectStartDate = '2026-09-01', useWorkingDaysOnly = true } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }

    const result = calculateScheduleWithSimulation(tasks, targetTaskId, Number(delayDays) || 0, {
      projectStartDate,
      useWorkingDaysOnly
    });

    res.json({ result });
  });

  // Reset to default sample projects
  app.post('/api/reset-samples', (req, res) => {
    projects = [...SAMPLE_PROJECTS];
    res.json({ success: true, projects });
  });

  // Vite Middleware for development vs Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Delay Impact Simulator running on port ${PORT}`);
  });
}

startServer();
