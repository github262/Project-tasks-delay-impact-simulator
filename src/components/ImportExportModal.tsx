import React, { useState } from 'react';
import { Project, SimulationResult } from '../types';
import { X, Download, Upload, FileText, Check, AlertCircle } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  simulation: SimulationResult;
  onImportProject: (importedData: Partial<Project>) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  project,
  simulation,
  onImportProject,
}) => {
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}_plan.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['id', 'name', 'duration', 'bufferDays', 'dependencies', 'category', 'owner'];
    const rows = project.tasks.map(t => [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      t.duration,
      t.bufferDays || 0,
      `"${t.dependencies.join(';')}"`,
      `"${t.category || ''}"`,
      `"${t.owner || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `${project.name.toLowerCase().replace(/\s+/g, '_')}_tasks.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleProcessImport = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!importText.trim()) {
      setErrorMsg('Please paste JSON or CSV text to import.');
      return;
    }

    try {
      if (importFormat === 'json') {
        const parsed = JSON.parse(importText);
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
          throw new Error('Invalid format: JSON must contain a "tasks" array.');
        }
        onImportProject(parsed);
        setSuccessMsg('Project successfully imported from JSON!');
        setTimeout(() => onClose(), 1000);
      } else {
        // Parse CSV
        const lines = importText.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('CSV must contain a header row and at least one task row.');
        }
        const tasks = lines.slice(1).map((line, idx) => {
          const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
          return {
            id: cols[0] || `t_imported_${idx}`,
            name: cols[1] || `Task ${idx + 1}`,
            duration: Math.max(1, parseInt(cols[2]) || 5),
            bufferDays: Math.max(0, parseInt(cols[3]) || 0),
            dependencies: cols[4] ? cols[4].split(';').filter(Boolean) : [],
            category: cols[5] || 'General',
            owner: cols[6] || undefined,
          };
        });

        onImportProject({ tasks });
        setSuccessMsg(`Imported ${tasks.length} tasks from CSV!`);
        setTimeout(() => onClose(), 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse import content.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Import & Export Project Plan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Export Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-indigo-600" />
              Export Current Project & Baseline
            </h4>
            <p className="text-xs text-slate-500">
              Download your schedule, dependencies, and buffers to share or open in other tools.
            </p>
            <div className="flex items-center gap-3">
              <button
                id="export-json-btn"
                onClick={handleExportJSON}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON Plan
              </button>
              <button
                id="export-csv-btn"
                onClick={handleExportCSV}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export Tasks CSV
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-600" />
                Import Project or Spreadsheet Data
              </h4>
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setImportFormat('json')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer font-medium ${
                    importFormat === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setImportFormat('csv')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer font-medium ${
                    importFormat === 'csv' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={importFormat === 'json' ? 'Paste project JSON here...' : 'id,name,duration,bufferDays,dependencies,category,owner\nt1,UI Design,8,2,,Design,Marcus\nt2,Backend API,10,0,t1,Engineering,Devon'}
              rows={6}
              className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              id="submit-import-btn"
              onClick={handleProcessImport}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Apply Import
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
