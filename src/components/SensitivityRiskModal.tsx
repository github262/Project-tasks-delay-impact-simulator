import React, { useMemo } from 'react';
import { Task, Project } from '../types';
import { calculateProjectSensitivity } from '../engine/scheduler';
import { X, Flame, Shield, AlertTriangle, ArrowRight, Play, CheckCircle } from 'lucide-react';

interface SensitivityRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSelectTaskToSimulate: (taskId: string, delayDays: number) => void;
}

export const SensitivityRiskModal: React.FC<SensitivityRiskModalProps> = ({
  isOpen,
  onClose,
  project,
  onSelectTaskToSimulate,
}) => {
  if (!isOpen) return null;

  const sensitivityList = useMemo(() => {
    const list = calculateProjectSensitivity(project.tasks, {
      projectStartDate: project.startDate,
      useWorkingDaysOnly: project.useWorkingDaysOnly,
    });

    // Sort by risk: critical path first, then by highest impact at 7 days
    return list.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return b.impactIfDelayed7Days - a.impactIfDelayed7Days;
    });
  }, [project]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Launch Delay Sensitivity Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Automated risk ranking showing which tasks have the highest leverage over your launch date.
              </p>
            </div>
          </div>
          <button
            id="close-sensitivity-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Task Name</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Available Float</th>
                  <th className="px-4 py-3 text-center">If +3d Delay</th>
                  <th className="px-4 py-3 text-center">If +7d Delay</th>
                  <th className="px-4 py-3 text-center">If +14d Delay</th>
                  <th className="px-4 py-3 text-right">Simulate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sensitivityList.map(item => {
                  return (
                    <tr key={item.taskId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {item.isCritical && <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          <span>{item.taskName}</span>
                        </div>
                        {item.category && (
                          <span className="text-[10px] text-slate-500 block">{item.category} • {item.duration}d duration</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {item.riskLevel === 'critical' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            🔥 Critical Path
                          </span>
                        ) : item.riskLevel === 'high' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ⚠️ High Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🛡️ Buffered / Float
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-700">
                        {item.totalFloat === 0 ? (
                          <span className="text-rose-600 font-bold">0 days (No slack)</span>
                        ) : (
                          <span className="text-emerald-700">+{item.totalFloat} days</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded ${
                          item.impactIfDelayed3Days > 0 ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-400'
                        }`}>
                          {item.impactIfDelayed3Days > 0 ? `+${item.impactIfDelayed3Days}d` : '0d'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded ${
                          item.impactIfDelayed7Days > 0 ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-400'
                        }`}>
                          {item.impactIfDelayed7Days > 0 ? `+${item.impactIfDelayed7Days}d` : '0d'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded ${
                          item.impactIfDelayed14Days > 0 ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-400'
                        }`}>
                          {item.impactIfDelayed14Days > 0 ? `+${item.impactIfDelayed14Days}d` : '0d'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            onSelectTaskToSimulate(item.taskId, 5);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          Test +5d
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
