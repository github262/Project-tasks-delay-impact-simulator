import React, { useState, useMemo } from 'react';
import { CalculatedTask, SimulationResult } from '../types';
import { formatDisplayDate, formatShortDate, parseISODate, addDays, daysBetween } from '../engine/dateUtils';
import { 
  Flame, Shield, ArrowRight, Flag, Plus, Edit2, Trash2, CheckCircle2,
  ZoomIn, ZoomOut, Filter, Calendar, Clock, Layers, Sparkles
} from 'lucide-react';

interface GanttTimelineProps {
  simulation: SimulationResult;
  selectedTaskId: string | null;
  useWorkingDaysOnly: boolean;
  onSelectTask: (taskId: string) => void;
  onAddTask: () => void;
  onEditTask: (task: CalculatedTask) => void;
  onDeleteTask: (taskId: string) => void;
}

type ZoomLevel = 'days' | 'weeks' | 'months';
type FilterMode = 'all' | 'affected' | 'critical';

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  simulation,
  selectedTaskId,
  useWorkingDaysOnly,
  onSelectTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const [zoom, setZoom] = useState<ZoomLevel>('weeks');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const { tasks, baselineLaunchDate, simulatedLaunchDate, projectStartDate, launchImpactDays, delayDays } = simulation;

  // Filter tasks based on view selection
  const visibleTasks = useMemo(() => {
    if (filter === 'affected') {
      return tasks.filter(t => t.isAffected);
    }
    if (filter === 'critical') {
      return tasks.filter(t => t.isCritical);
    }
    return tasks;
  }, [tasks, filter]);

  // Determine full calendar span (earliest start to latest end + padding)
  const totalDaysSpan = useMemo(() => {
    if (tasks.length === 0) return 30;
    const maxEnd = parseISODate(simulatedLaunchDate) > parseISODate(baselineLaunchDate) 
      ? simulatedLaunchDate 
      : baselineLaunchDate;
    const days = daysBetween(projectStartDate, maxEnd, useWorkingDaysOnly);
    return Math.max(30, days + 10);
  }, [tasks, projectStartDate, baselineLaunchDate, simulatedLaunchDate, useWorkingDaysOnly]);

  // Pixel width per day based on zoom level
  const dayWidth = zoom === 'days' ? 36 : zoom === 'weeks' ? 18 : 8;
  const timelineWidth = Math.max(800, totalDaysSpan * dayWidth);

  // Generate date axis markers
  const dateMarkers = useMemo(() => {
    const markers: { dateStr: string; label: string; offsetPx: number; isMajor: boolean }[] = [];
    const step = zoom === 'days' ? 1 : zoom === 'weeks' ? 7 : 30;

    for (let d = 0; d <= totalDaysSpan; d += step) {
      const curDate = addDays(projectStartDate, d, useWorkingDaysOnly);
      const parsed = parseISODate(curDate);
      
      let label = formatShortDate(curDate);
      if (zoom === 'months') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        label = `${months[parsed.getUTCMonth()]} '${String(parsed.getUTCFullYear()).slice(-2)}`;
      }

      markers.push({
        dateStr: curDate,
        label,
        offsetPx: d * dayWidth,
        isMajor: zoom === 'days' ? d % 7 === 0 : d % (step * 2) === 0,
      });
    }

    return markers;
  }, [projectStartDate, totalDaysSpan, dayWidth, zoom, useWorkingDaysOnly]);

  // Baseline and Simulated Launch positions
  const baselineLaunchOffset = daysBetween(projectStartDate, baselineLaunchDate, useWorkingDaysOnly) * dayWidth;
  const simulatedLaunchOffset = daysBetween(projectStartDate, simulatedLaunchDate, useWorkingDaysOnly) * dayWidth;
  const isDelayed = launchImpactDays > 0;

  return (
    <div id="gantt-timeline-container" className="bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col overflow-hidden">
      
      {/* Header Toolbar */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        
        {/* Left: Section Title & Add Task */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Project Schedule & Timeline
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              ({visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'})
            </span>
          </div>

          <button
            id="add-task-header-btn"
            onClick={onAddTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer ml-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>

        {/* Right: Zoom & Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Filter Pills */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium text-slate-600">
            <button
              id="filter-all-btn"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-slate-900 text-white font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              id="filter-affected-btn"
              onClick={() => setFilter('affected')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filter === 'affected' ? 'bg-amber-600 text-white font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Affected ({tasks.filter(t => t.isAffected).length})
            </button>
            <button
              id="filter-critical-btn"
              onClick={() => setFilter('critical')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filter === 'critical' ? 'bg-rose-600 text-white font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Critical ({tasks.filter(t => t.isCritical).length})
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium text-slate-600">
            <button
              id="zoom-days-btn"
              onClick={() => setZoom('days')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                zoom === 'days' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Days
            </button>
            <button
              id="zoom-weeks-btn"
              onClick={() => setZoom('weeks')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                zoom === 'weeks' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Weeks
            </button>
            <button
              id="zoom-months-btn"
              onClick={() => setZoom('months')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                zoom === 'months' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Months
            </button>
          </div>

        </div>

      </div>

      {/* Legend & Help Bar */}
      <div className="px-5 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded-xs border border-dashed border-slate-400 bg-slate-100"></span>
            <span>Original Baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded-xs bg-indigo-500"></span>
            <span>Selected Slip Origin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded-xs bg-rose-500"></span>
            <span>Delayed Task / Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded-xs bg-teal-500"></span>
            <span>Buffer Absorbed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded-xs bg-emerald-600"></span>
            <span>On Track</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic">
          💡 Click on any task bar to test a delay simulation
        </div>
      </div>

      {/* Main Split Grid: Left (Task details list) + Right (Scrollable Gantt Canvas) */}
      <div className="flex overflow-hidden relative">
        
        {/* Left Columns (Fixed) */}
        <div className="w-64 sm:w-80 md:w-96 shrink-0 border-r border-slate-200 bg-white z-10 shadow-xs">
          
          {/* Left Header */}
          <div className="h-10 px-4 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span>Task Details</span>
            <span>Duration / Float</span>
          </div>

          {/* Task Rows List */}
          <div className="divide-y divide-slate-100">
            {visibleTasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              const isHovered = hoveredTaskId === task.id;

              return (
                <div
                  key={task.id}
                  id={`task-row-${task.id}`}
                  onClick={() => onSelectTask(task.id)}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  className={`h-14 px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                      : isHovered
                      ? 'bg-slate-50'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      {task.isCritical && (
                        <span title="Critical Path (Zero Float)" className="shrink-0 text-rose-500">
                          <Flame className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-indigo-950 font-bold' : 'text-slate-900'
                      }`}>
                        {task.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      {task.category && (
                        <span className="truncate max-w-[90px]">{task.category}</span>
                      )}
                      {task.owner && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[80px]">{task.owner}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-medium text-slate-700">
                        {task.duration}d
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {task.isCritical ? (
                          <span className="text-rose-600 font-bold">0d float</span>
                        ) : (
                          <span>+{task.totalFloat}d float</span>
                        )}
                      </div>
                    </div>

                    {/* Edit/Delete hover triggers */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pl-1">
                      <button
                        id={`edit-task-${task.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(task);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-200 transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        id={`delete-task-${task.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-100 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Final Launch Row on Left */}
            <div className="h-14 px-3 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <Flag className={`w-4 h-4 ${isDelayed ? 'text-rose-600' : 'text-emerald-600'}`} />
                <span>Final Launch Milestone</span>
              </div>
              <span className="font-mono text-[11px] text-slate-600">
                {formatShortDate(simulatedLaunchDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Scrollable Timeline Canvas */}
        <div className="flex-1 overflow-x-auto relative scrollbar-thin bg-slate-50/20">
          <div style={{ width: `${timelineWidth}px` }} className="relative">
            
            {/* Timeline Date Header */}
            <div className="h-10 bg-slate-100/90 border-b border-slate-200 relative flex items-center">
              {dateMarkers.map((m, idx) => (
                <div
                  key={idx}
                  style={{ left: `${m.offsetPx}px` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-center px-1 border-l border-slate-200/80 text-[11px] font-mono text-slate-500 select-none whitespace-nowrap"
                >
                  <span className={m.isMajor ? 'font-bold text-slate-700' : ''}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Background Grid Lines */}
            <div className="absolute top-10 bottom-0 left-0 right-0 pointer-events-none">
              {dateMarkers.map((m, idx) => (
                <div
                  key={idx}
                  style={{ left: `${m.offsetPx}px` }}
                  className={`absolute top-0 bottom-0 border-l ${
                    m.isMajor ? 'border-slate-200/80' : 'border-slate-100'
                  }`}
                />
              ))}

              {/* Baseline Launch Vertical Line */}
              <div
                style={{ left: `${baselineLaunchOffset}px` }}
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-400 z-10 flex flex-col items-center"
              >
                <div className="bg-slate-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap -translate-x-1/2">
                  Baseline Launch
                </div>
              </div>

              {/* Simulated Launch Vertical Line (if shifted) */}
              {isDelayed && (
                <div
                  style={{ left: `${simulatedLaunchOffset}px` }}
                  className="absolute top-0 bottom-0 border-l-2 border-rose-500 z-10 flex flex-col items-center"
                >
                  <div className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap -translate-x-1/2 animate-pulse">
                    Simulated: +{launchImpactDays}d
                  </div>
                </div>
              )}
            </div>

            {/* Task Bars Content */}
            <div className="divide-y divide-slate-100 relative">
              {visibleTasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                const isHovered = hoveredTaskId === task.id;

                // Baseline Bar Geometry
                const bLeft = task.baselineStartDayIndex * dayWidth;
                const bWidth = Math.max(dayWidth, (task.baselineEndDayIndex - task.baselineStartDayIndex) * dayWidth);

                // Simulated Bar Geometry
                const sLeft = task.simulatedStartDayIndex * dayWidth;
                const sWidth = Math.max(dayWidth, (task.simulatedEndDayIndex - task.simulatedStartDayIndex) * dayWidth);

                const hasShifted = task.startDelay > 0 || task.endDelay > 0;
                const hasBufferAbsorbed = task.bufferAbsorbed > 0;

                return (
                  <div
                    key={task.id}
                    id={`gantt-row-${task.id}`}
                    onClick={() => onSelectTask(task.id)}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    className={`h-14 relative flex items-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/40'
                        : isHovered
                        ? 'bg-slate-50/80'
                        : ''
                    }`}
                  >
                    {/* 1. Ghost / Baseline Bar (Semi-transparent / dashed outline) */}
                    {hasShifted && (
                      <div
                        style={{
                          left: `${bLeft}px`,
                          width: `${bWidth}px`,
                        }}
                        className="absolute h-7 rounded-lg border-2 border-dashed border-slate-300 bg-slate-100/60 flex items-center px-2 z-0 opacity-70"
                        title={`Baseline: ${formatShortDate(task.baselineStart)} → ${formatShortDate(task.baselineEnd)}`}
                      >
                        <span className="text-[10px] font-medium text-slate-500 truncate">
                          Baseline: {task.duration}d
                        </span>
                      </div>
                    )}

                    {/* 2. Active Simulated Bar */}
                    <div
                      style={{
                        left: `${sLeft}px`,
                        width: `${sWidth}px`,
                      }}
                      className={`absolute h-8 rounded-lg flex items-center justify-between px-2.5 transition-all shadow-xs z-10 ${
                        isSelected
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1 font-bold'
                          : task.isDirectlyDelayed
                          ? 'bg-indigo-600 text-white font-bold'
                          : task.isCritical && hasShifted
                          ? 'bg-rose-600 text-white font-semibold'
                          : hasShifted
                          ? 'bg-amber-500 text-white font-medium'
                          : hasBufferAbsorbed
                          ? 'bg-teal-600 text-white font-medium'
                          : task.isCritical
                          ? 'bg-slate-800 text-white font-medium'
                          : 'bg-emerald-600 text-white font-medium'
                      }`}
                      title={`${task.name}\nSimulated: ${formatShortDate(task.simulatedStart)} → ${formatShortDate(task.simulatedEnd)}\nFloat: ${task.totalFloat}d`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {task.isCritical && (
                          <Flame className="w-3 h-3 text-rose-200 shrink-0" />
                        )}
                        <span className="text-xs truncate">{task.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {hasBufferAbsorbed && (
                          <span className="bg-teal-800/80 text-[10px] px-1 rounded text-teal-100 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> -{task.bufferAbsorbed}d
                          </span>
                        )}
                        {hasShifted && (
                          <span className="bg-black/20 text-[10px] px-1 rounded font-mono">
                            +{task.endDelay}d
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Buffer Cushion Visual Block (if task has explicit buffer) */}
                    {task.bufferDays > 0 && !hasShifted && (
                      <div
                        style={{
                          left: `${sLeft + sWidth}px`,
                          width: `${task.bufferDays * dayWidth}px`,
                        }}
                        className="absolute h-6 rounded-r-md border border-dashed border-teal-400 bg-teal-50/80 flex items-center px-1 z-5 text-[10px] text-teal-700 font-mono"
                        title={`Buffer Cushion: ${task.bufferDays} days`}
                      >
                        +{task.bufferDays}d buffer
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Final Launch Row on Right Canvas */}
              <div className="h-14 relative flex items-center bg-slate-50/50 border-t-2 border-slate-200">
                {/* Baseline Milestone Flag */}
                <div
                  style={{ left: `${baselineLaunchOffset}px` }}
                  className="absolute flex items-center gap-1.5 -translate-x-1/2 z-20"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xs">
                    <Flag className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Simulated Milestone Flag (if shifted) */}
                {isDelayed && (
                  <div
                    style={{ left: `${simulatedLaunchOffset}px` }}
                    className="absolute flex items-center gap-1.5 -translate-x-1/2 z-20"
                  >
                    <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md animate-bounce">
                      <Flag className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
