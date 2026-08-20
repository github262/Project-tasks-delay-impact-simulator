import React from 'react';
import { SimulationResult } from '../types';
import { formatDisplayDate } from '../engine/dateUtils';
import { Calendar, AlertTriangle, ShieldCheck, ArrowRight, RotateCcw, Flame, CheckCircle2, BookmarkPlus } from 'lucide-react';

interface TopKpiSummaryProps {
  simulation: SimulationResult;
  onReset: () => void;
  onSaveScenario: () => void;
}

export const TopKpiSummary: React.FC<TopKpiSummaryProps> = ({
  simulation,
  onReset,
  onSaveScenario,
}) => {
  const {
    baselineLaunchDate,
    simulatedLaunchDate,
    launchImpactDays,
    totalTasksCount,
    affectedTasksCount,
    isTargetOnCriticalPath,
    totalBufferAbsorbed,
    targetTaskId,
    delayDays,
  } = simulation;

  const isDelayed = launchImpactDays > 0;
  const isSimulationActive = targetTaskId !== null && delayDays > 0;
  const isFullyAbsorbed = isSimulationActive && launchImpactDays === 0 && totalBufferAbsorbed > 0;

  return (
    <div id="top-kpi-summary" className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Launch Date Movement Block */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${
            isDelayed
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : isFullyAbsorbed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-indigo-50 border-indigo-200 text-indigo-600'
          }`}>
            <Calendar className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Final Launch Impact
              </span>
              {isSimulationActive && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isDelayed
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isDelayed ? `+${launchImpactDays} days slip` : 'Zero launch slip'}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {formatDisplayDate(simulatedLaunchDate)}
              </div>

              {isSimulationActive && simulatedLaunchDate !== baselineLaunchDate && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                  <span className="line-through text-slate-400">{formatDisplayDate(baselineLaunchDate)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-rose-600 font-semibold">
                    +{launchImpactDays} days
                  </span>
                </div>
              )}

              {!isSimulationActive && (
                <span className="text-xs text-slate-600 font-normal">
                  Baseline schedule on track
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          {/* Affected Tasks Metric */}
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3">
            <div className="text-xs text-slate-600 font-medium flex items-center justify-between">
              <span>Affected Tasks</span>
              <span className="text-[10px] text-slate-600">of {totalTasksCount}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-bold ${affectedTasksCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {affectedTasksCount}
              </span>
              <span className="text-xs text-slate-600">
                ({Math.round((affectedTasksCount / (totalTasksCount || 1)) * 100)}%)
              </span>
            </div>
          </div>

          {/* Buffer Absorbed Metric */}
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3">
            <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Buffer Cushion</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-xl font-bold ${totalBufferAbsorbed > 0 ? 'text-teal-700' : 'text-slate-700'}`}>
                {totalBufferAbsorbed}
              </span>
              <span className="text-xs text-slate-600">days absorbed</span>
            </div>
          </div>

          {/* Critical Path Status */}
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Critical Path</span>
            </div>
            <div className="mt-1 text-sm font-semibold flex items-center gap-1.5">
              {isSimulationActive ? (
                isTargetOnCriticalPath ? (
                  <span className="text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> High Risk (0 Float)
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Protected by Float
                  </span>
                )
              ) : (
                <span className="text-slate-600 font-medium">
                  {simulation.criticalPathTaskIds.length} critical tasks
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Action Controls */}
        {isSimulationActive && (
          <div className="flex items-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-4">
            <button
              id="save-scenario-btn"
              onClick={onSaveScenario}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Save current simulation as scenario"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-slate-600" />
              Save Scenario
            </button>
            <button
              id="reset-simulation-btn"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-rose-200/60"
              title="Reset simulation to original baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
