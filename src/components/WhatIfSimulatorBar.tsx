import React from 'react';
import { CalculatedTask } from '../types';
import { Sparkles, Sliders, RotateCcw, ArrowRight, Shield, Flame, Plus, Minus, Info } from 'lucide-react';

interface WhatIfSimulatorBarProps {
  tasks: CalculatedTask[];
  selectedTaskId: string | null;
  delayDays: number;
  onSelectTask: (taskId: string) => void;
  onChangeDelay: (days: number) => void;
  onReset: () => void;
  onOpenSensitivity: () => void;
}

export const WhatIfSimulatorBar: React.FC<WhatIfSimulatorBarProps> = ({
  tasks,
  selectedTaskId,
  delayDays,
  onSelectTask,
  onChangeDelay,
  onReset,
  onOpenSensitivity,
}) => {
  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const quickDelays = [1, 3, 5, 7, 10, 14, 21];

  return (
    <div id="what-if-simulator-bar" className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
      
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span>What Happens If...</span>
              <span className="text-xs font-normal text-indigo-300/80 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                Interactive Slippage Calculator
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any project task and inject a delay to see downstream propagation and launch date shift in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-sensitivity-matrix-btn"
            onClick={onOpenSensitivity}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-700/50 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            Launch Risk Matrix
          </button>
          {delayDays > 0 && (
            <button
              id="reset-delay-btn"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Delay
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Controls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 items-center">
        
        {/* Task Selector */}
        <div className="lg:col-span-5">
          <label htmlFor="task-select" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span>1. Choose Task to Delay</span>
            {selectedTask && (
              <span className="text-[11px] text-indigo-300 font-normal">
                Duration: {selectedTask.duration}d {selectedTask.bufferDays > 0 ? `| Buffer: ${selectedTask.bufferDays}d` : ''}
              </span>
            )}
          </label>
          <div className="relative">
            <select
              id="task-select"
              value={selectedTaskId || ''}
              onChange={(e) => onSelectTask(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer font-medium"
            >
              <option value="" disabled>-- Select a task to simulate delay --</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.name} ({task.duration}d) {task.isCritical ? '🔥 Critical Path' : task.bufferDays > 0 ? `🛡️ ${task.bufferDays}d buffer` : `(Float: ${task.totalFloat}d)`}
                </option>
              ))}
            </select>
          </div>

          {selectedTask && (
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
              {selectedTask.isCritical ? (
                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                  <Flame className="w-3 h-3 text-rose-400" /> On Critical Path: any slip directly delays final launch!
                </span>
              ) : selectedTask.totalFloat > 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <Shield className="w-3 h-3 text-emerald-400" /> Has {selectedTask.totalFloat} days float before impacting launch
                </span>
              ) : (
                <span className="text-slate-400">Owner: {selectedTask.owner || 'Unassigned'}</span>
              )}
            </div>
          )}
        </div>

        {/* Delay Amount Controller */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">2. Introduce Delay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold px-2.5 py-0.5 rounded-lg border ${
                delayDays > 0
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                +{delayDays} {delayDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>

          {/* Stepper + Slider */}
          <div className="flex items-center gap-3">
            <button
              id="delay-minus-btn"
              onClick={() => onChangeDelay(Math.max(0, delayDays - 1))}
              disabled={!selectedTaskId || delayDays <= 0}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Decrease delay by 1 day"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              id="delay-slider"
              type="range"
              min="0"
              max="45"
              step="1"
              value={delayDays}
              disabled={!selectedTaskId}
              onChange={(e) => onChangeDelay(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-2 cursor-pointer disabled:opacity-40"
            />

            <button
              id="delay-plus-btn"
              onClick={() => onChangeDelay(delayDays + 1)}
              disabled={!selectedTaskId}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300 transition-colors cursor-pointer shrink-0"
              title="Increase delay by 1 day"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
            {quickDelays.map(days => (
              <button
                key={days}
                id={`preset-${days}d-btn`}
                onClick={() => onChangeDelay(days)}
                disabled={!selectedTaskId}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  delayDays === days
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
                }`}
              >
                +{days}d
              </button>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
