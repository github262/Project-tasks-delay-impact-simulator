import React from 'react';
import { Project, SavedScenario } from '../types';
import { 
  Sparkles, Folder, Plus, Bookmark, Flame, FileText, Settings, 
  RotateCcw, Check, CalendarDays, ChevronDown
} from 'lucide-react';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';

interface NavbarProps {
  projects: Project[];
  activeProject: Project;
  scenarios: SavedScenario[];
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onEditProject: () => void;
  onLoadTemplate: (template: Project) => void;
  onOpenScenarios: () => void;
  onOpenSensitivity: () => void;
  onOpenImportExport: () => void;
  onToggleWorkingDays: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  activeProject,
  scenarios,
  onSelectProject,
  onNewProject,
  onEditProject,
  onLoadTemplate,
  onOpenScenarios,
  onOpenSensitivity,
  onOpenImportExport,
  onToggleWorkingDays,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Delay Impact Simulator
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 uppercase tracking-wider">
                  What-If Calculator
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                Predict downstream slippage, buffer absorption & final launch movements
              </p>
            </div>
          </div>

          {/* Center: Project Switcher & Template Picker */}
          <div className="flex items-center gap-2">
            
            {/* Project Select Dropdown */}
            <div className="relative flex items-center">
              <Folder className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                id="project-select-dropdown"
                value={activeProject.id}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    onNewProject();
                  } else {
                    onSelectProject(e.target.value);
                  }
                }}
                className="pl-9 pr-8 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none max-w-[200px] sm:max-w-[240px] truncate"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="__NEW__">+ Create New Project...</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Template loader dropdown */}
            <div className="relative group">
              <button
                id="templates-dropdown-btn"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Templates</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 hidden group-hover:block z-50">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Sample Project Templates
                </div>
                {SAMPLE_PROJECTS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onLoadTemplate(t)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 rounded-lg transition-colors block truncate cursor-pointer"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Edit active project settings */}
            <button
              id="edit-project-settings-btn"
              onClick={onEditProject}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Project settings (Start date, calendar mode, description)"
            >
              <Settings className="w-4 h-4" />
            </button>

          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-2">
            
            {/* 5-day vs 7-day calendar toggle */}
            <button
              id="toggle-working-days-btn"
              onClick={onToggleWorkingDays}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                activeProject.useWorkingDaysOnly
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
              title="Toggle between 5-day business week (skip weekends) and 7-day calendar week"
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              <span>{activeProject.useWorkingDaysOnly ? '5d Business' : '7d Calendar'}</span>
            </button>

            {/* Scenarios Button */}
            <button
              id="open-scenarios-btn"
              onClick={onOpenScenarios}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs relative"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Scenarios</span>
              {scenarios.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {scenarios.length}
                </span>
              )}
            </button>

            {/* Import / Export */}
            <button
              id="open-import-export-btn"
              onClick={onOpenImportExport}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Import or Export JSON/CSV"
            >
              <FileText className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
