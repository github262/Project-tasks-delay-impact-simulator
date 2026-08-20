import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { X, Check, FolderPlus, Calendar, Layers } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => void;
  editingProject?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProject,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [useWorkingDaysOnly, setUseWorkingDaysOnly] = useState(true);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description || '');
      setStartDate(editingProject.startDate);
      setUseWorkingDaysOnly(editingProject.useWorkingDaysOnly);
    } else {
      setName('');
      setDescription('');
      setStartDate('2026-09-01');
      setUseWorkingDaysOnly(true);
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      startDate,
      useWorkingDaysOnly,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {editingProject ? 'Edit Project Settings' : 'Create New Project'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              id="project-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 Mobile App Redesign"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="project-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key project goals, milestones, or notes..."
              rows={2}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Project Start Date
            </label>
            <input
              id="project-start-date-input"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div className="pr-3">
                <span className="text-xs font-semibold text-slate-900 block">5-Day Business Week</span>
                <span className="text-[11px] text-slate-500 block">Skip Saturdays and Sundays when calculating task durations & delays</span>
              </div>
              <input
                id="project-working-days-toggle"
                type="checkbox"
                checked={useWorkingDaysOnly}
                onChange={(e) => setUseWorkingDaysOnly(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-project-submit-btn"
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
