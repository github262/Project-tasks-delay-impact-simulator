import React, { useState, useEffect } from 'react';
import { Task, CalculatedTask } from '../types';
import { X, Check, AlertTriangle, ShieldCheck, Clock, Users, Tag } from 'lucide-react';
import { validateAndTopologicalSort } from '../engine/scheduler';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id'> & { id?: string }) => void;
  editingTask?: CalculatedTask | null;
  allTasks: Task[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  allTasks,
}) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(5);
  const [bufferDays, setBufferDays] = useState(0);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [category, setCategory] = useState('Engineering');
  const [owner, setOwner] = useState('');
  const [notes, setNotes] = useState('');
  const [cycleError, setCycleError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name);
      setDuration(editingTask.duration);
      setBufferDays(editingTask.bufferDays || 0);
      setDependencies(editingTask.dependencies || []);
      setCategory(editingTask.category || 'Engineering');
      setOwner(editingTask.owner || '');
    } else {
      setName('');
      setDuration(5);
      setBufferDays(0);
      setDependencies([]);
      setCategory('Engineering');
      setOwner('');
      setNotes('');
    }
    setCycleError(null);
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  const handleToggleDependency = (depId: string) => {
    const nextDeps = dependencies.includes(depId)
      ? dependencies.filter(id => id !== depId)
      : [...dependencies, depId];

    // Check for circular dependency preview
    const tempTaskId = editingTask ? editingTask.id : 'temp_new_task';
    const otherTasks = allTasks.filter(t => t.id !== tempTaskId);
    const testTasks: Task[] = [
      ...otherTasks,
      {
        id: tempTaskId,
        name: name || 'Testing Task',
        duration,
        dependencies: nextDeps,
        bufferDays,
      }
    ];

    const { hasCycle } = validateAndTopologicalSort(testTasks);
    if (hasCycle) {
      setCycleError('Selecting this dependency would create a circular loop! Dependency rejected.');
      return;
    }

    setCycleError(null);
    setDependencies(nextDeps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingTask?.id,
      name: name.trim(),
      duration: Math.max(1, duration),
      bufferDays: Math.max(0, bufferDays),
      dependencies,
      category: category.trim() || 'General',
      owner: owner.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const availablePredecessors = allTasks.filter(t => t.id !== editingTask?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-900">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h3>
          <button
            id="close-task-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Task Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Name *
            </label>
            <input
              id="task-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Token Migration"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Duration & Buffer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Duration (Days) *
              </label>
              <input
                id="task-duration-input"
                type="number"
                min="1"
                max="365"
                required
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Safety Buffer (Days)
              </label>
              <input
                id="task-buffer-input"
                type="number"
                min="0"
                max="60"
                value={bufferDays}
                onChange={(e) => setBufferDays(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Cushion that absorbs upstream slips
              </span>
            </div>
          </div>

          {/* Category & Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Category
              </label>
              <select
                id="task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Product & Design">Product & Design</option>
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="Engineering">Engineering</option>
                <option value="QA & Security">QA & Security</option>
                <option value="Marketing">Marketing</option>
                <option value="DevOps">DevOps</option>
                <option value="Compliance">Compliance</option>
                <option value="Milestone">Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Owner / Assignee
              </label>
              <input
                id="task-owner-input"
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Predecessor Dependencies */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dependencies / Predecessors (Must finish before this task starts)
            </label>
            
            {cycleError && (
              <div className="mb-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{cycleError}</span>
              </div>
            )}

            {availablePredecessors.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                No other tasks available to depend on.
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                {availablePredecessors.map(task => {
                  const isChecked = dependencies.includes(task.id);
                  return (
                    <label
                      key={task.id}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDependency(task.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate max-w-[280px]">{task.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {task.duration}d
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-task-submit-btn"
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
