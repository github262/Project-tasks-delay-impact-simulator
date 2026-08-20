import React from 'react';
import { SavedScenario, SimulationResult, Project } from '../types';
import { formatDisplayDate } from '../engine/dateUtils';
import { X, Play, Trash2, ArrowRight, Bookmark, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: SavedScenario[];
  baselineSimulation: SimulationResult;
  project: Project;
  onLoadScenario: (scenario: SavedScenario) => void;
  onDeleteScenario: (scenarioId: string) => void;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  baselineSimulation,
  project,
  onLoadScenario,
  onDeleteScenario,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Scenario Comparison Matrix
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              ({scenarios.length} saved scenarios)
            </span>
          </div>
          <button
            id="close-scenarios-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Comparison Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Scenario Name</th>
                  <th className="px-4 py-3">Delay Injected</th>
                  <th className="px-4 py-3">Simulated Launch Date</th>
                  <th className="px-4 py-3">Launch Slip</th>
                  <th className="px-4 py-3">Affected Tasks</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                
                {/* 1. Original Baseline Row */}
                <tr className="bg-indigo-50/40">
                  <td className="px-4 py-3.5 font-bold text-indigo-950 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    Original Baseline
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono">0 days</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {formatDisplayDate(baselineSimulation.baselineLaunchDate)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      On Target (0d)
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">0 tasks</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-[11px] text-slate-400 italic">Baseline</span>
                  </td>
                </tr>

                {/* 2. Saved Scenarios Rows */}
                {scenarios.map((sc) => {
                  const isSlipped = sc.launchImpactDays > 0;
                  return (
                    <tr key={sc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span>{sc.name}</span>
                          {sc.description && (
                            <span className="text-[10px] text-slate-500 font-normal">{sc.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {sc.targetTaskName}: +{sc.delayDays}d
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {formatDisplayDate(sc.simulatedLaunchDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isSlipped
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {isSlipped ? `+${sc.launchImpactDays} days` : 'Absorbed (0d)'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {sc.affectedCount} tasks
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`load-scenario-${sc.id}`}
                            onClick={() => {
                              onLoadScenario(sc);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            Apply
                          </button>
                          <button
                            id={`delete-scenario-${sc.id}`}
                            onClick={() => onDeleteScenario(sc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete scenario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              </tbody>
            </table>
          </div>

          {scenarios.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No saved scenarios yet. Use the "Save Scenario" button in the simulator to record test cases!
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
