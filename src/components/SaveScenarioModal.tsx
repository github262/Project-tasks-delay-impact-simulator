import React, { useState } from 'react';
import { CalculatedTask } from '../types';
import { X, BookmarkPlus, Check } from 'lucide-react';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  selectedTask?: CalculatedTask | null;
  delayDays: number;
  simulatedLaunchDate: string;
  launchImpactDays: number;
}

export const SaveScenarioModal: React.FC<SaveScenarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedTask,
  delayDays,
  simulatedLaunchDate,
  launchImpactDays,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (selectedTask && delayDays > 0) {
      setName(`${selectedTask.name} +${delayDays}d Slip`);
      setDescription(`Testing if ${selectedTask.name} is delayed by ${delayDays} days.`);
    }
  }, [selectedTask, delayDays, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Save Simulation Scenario
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
          
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-950">
            <div className="font-bold flex items-center justify-between">
              <span>Task: {selectedTask?.name}</span>
              <span className="font-mono text-rose-700">+{delayDays} days</span>
            </div>
            <div className="text-[11px] text-indigo-800 mt-1">
              Launch Impact: <span className="font-bold">+{launchImpactDays} days</span> ({simulatedLaunchDate})
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scenario Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design +5 Days Slip"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Hypothesis (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this scenario might happen, mitigation ideas..."
              rows={3}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Save Scenario
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
