import React from 'react';
import { ImpactChainStep } from '../types';
import { ArrowRight, ShieldCheck, Flame, Flag, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImpactChainViewProps {
  chain: ImpactChainStep[];
  selectedTaskName?: string;
  delayDays: number;
}

export const ImpactChainView: React.FC<ImpactChainViewProps> = ({
  chain,
  selectedTaskName,
  delayDays,
}) => {
  if (!chain || chain.length === 0 || delayDays === 0) {
    return null;
  }

  const finalStep = chain[chain.length - 1];
  const totalNetSlip = finalStep?.delayPassedOn || 0;

  return (
    <div id="impact-chain-view" className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Downstream Impact Chain
          </span>
          <span className="text-xs text-slate-500 font-normal">
            (Propagation path from slipped task to final launch)
          </span>
        </div>

        <div className="text-xs font-semibold">
          {totalNetSlip === 0 ? (
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Delay 100% absorbed by buffer
            </span>
          ) : totalNetSlip < delayDays ? (
            <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Delay partially absorbed ({delayDays - totalNetSlip}d absorbed)
            </span>
          ) : (
            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Full delay (+{totalNetSlip}d) propagated to Launch
            </span>
          )}
        </div>
      </div>

      {/* Horizontal Breadcrumb Chain */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-thin">
        {chain.map((step, idx) => {
          const isFirst = idx === 0;
          const isLast = step.isLaunchMilestone || idx === chain.length - 1;
          const hasAbsorbed = step.bufferAbsorbed > 0;

          return (
            <React.Fragment key={step.taskId + '-' + idx}>
              
              {/* Step Card */}
              <div
                id={`impact-step-${step.taskId}`}
                className={`flex flex-col shrink-0 rounded-xl px-3.5 py-2.5 border transition-all ${
                  isLast
                    ? step.delayPassedOn > 0
                      ? 'bg-rose-50/90 border-rose-300 text-rose-950 font-bold shadow-xs'
                      : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                    : isFirst
                    ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 font-semibold'
                    : hasAbsorbed
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  {isLast ? (
                    <Flag className={`w-3.5 h-3.5 ${step.delayPassedOn > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
                  ) : isFirst ? (
                    <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
                  ) : step.isCritical ? (
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                  ) : null}
                  <span className="truncate max-w-[180px]">{step.taskName}</span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className={`px-1.5 py-0.5 rounded font-mono font-medium text-[11px] ${
                    isLast
                      ? step.delayPassedOn > 0
                        ? 'bg-rose-200/80 text-rose-900'
                        : 'bg-emerald-200/80 text-emerald-900'
                      : 'bg-white/80 text-slate-700 border border-slate-200'
                  }`}>
                    {step.delayPassedOn > 0 ? `+${step.delayPassedOn}d` : '0d slip'}
                  </span>

                  {hasAbsorbed && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3 text-teal-600" />
                      {step.bufferAbsorbed}d absorbed
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow Connector */}
              {!isLast && (
                <div className="flex items-center shrink-0 text-slate-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}

            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
