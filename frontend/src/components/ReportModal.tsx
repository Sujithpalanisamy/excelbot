import React, { useState } from 'react';
import {
  X,
  Layers,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Loader2,
  ChevronDown
} from 'lucide-react';
import type { BugItem } from '../types';
import { HRMS_PAGES } from '../types';
import { api } from '../services/api';

interface ReportModalProps {
  onClose: () => void;
  allBugs: BugItem[];
  onDownloadExcel?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  onClose,
  allBugs,
  onDownloadExcel,
}) => {
  const [selectedPage, setSelectedPage] = useState<string>('Login Page');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Filter bugs for selected page
  const pageBugs = allBugs.filter(b => (b.page_name || '').toLowerCase() === selectedPage.toLowerCase());

  const total = pageBugs.length;
  const openCount = pageBugs.filter(b => ['new', 'proposed', 'to do'].includes((b.state || '').toLowerCase())).length;
  const activeCount = pageBugs.filter(b => ['active', 'in progress', 'committed', 'investigating'].includes((b.state || '').toLowerCase())).length;
  const closedCount = pageBugs.filter(b => ['closed', 'done', 'completed', 'resolved', 'fixed'].includes((b.state || '').toLowerCase())).length;
  const criticalCount = pageBugs.filter(b => {
    const s = (b.severity || '').toLowerCase();
    return s.includes('1') || s.includes('critical') || s.includes('2') || s.includes('high');
  }).length;

  const handleGenerateSheet = async () => {
    setIsGenerating(true);
    setStatusMsg(null);
    try {
      const res = await api.generatePageReport(selectedPage);
      if (res.success) {
        setStatusMsg(`Created worksheet '${selectedPage} Report' in Excel workbook.`);
      } else {
        setStatusMsg(res.message);
      }
    } catch (err: any) {
      setStatusMsg(`Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-2xs" aria-hidden="true">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-base sm:text-lg font-bold font-display text-slate-900">
                Module Quality & Defect Report
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Deep-dive analytics and dedicated Excel worksheet generation for individual application pages
              </p>
            </div>
          </div>

          <button
            id="btn-close-report-modal"
            type="button"
            onClick={onClose}
            aria-label="Close HRMS Page-wise Bug Report modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Module Picker & Action Buttons */}
        <div className="flex items-end justify-between flex-wrap gap-3 mb-4 bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200">
          <div className="w-full sm:w-72">
            <label htmlFor="report-module-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Select Module / Page:
            </label>
            <div className="relative">
              <select
                id="report-module-select"
                name="report_module"
                value={selectedPage}
                onChange={(e) => {
                  setSelectedPage(e.target.value);
                  setStatusMsg(null);
                }}
                className="h-9 w-full px-3 pr-8 text-xs rounded-md bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer shadow-2xs"
              >
                {HRMS_PAGES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-generate-module-sheet"
              type="button"
              onClick={handleGenerateSheet}
              disabled={isGenerating}
              className="h-9 btn-sky inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-md disabled:opacity-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shrink-0"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>Generate Module Sheet</span>
            </button>

            <button
              id="btn-report-download-excel"
              type="button"
              onClick={onDownloadExcel}
              className="h-9 btn-secondary inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>Download Excel</span>
            </button>
          </div>
        </div>

        {/* Status Msg */}
        {statusMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2 mb-3.5" role="status">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Module KPI Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4" aria-label="Module KPI Overview">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Total Bugs</span>
            <span className="text-xl font-bold font-display tabular-nums text-slate-900">{total}</span>
          </div>
          <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block mb-0.5">Open / New</span>
            <span className="text-xl font-bold font-display tabular-nums text-sky-700">{openCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">Active</span>
            <span className="text-xl font-bold font-display tabular-nums text-amber-700">{activeCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-0.5">Critical / High</span>
            <span className="text-xl font-bold font-display tabular-nums text-rose-700">{criticalCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">Closed / Done</span>
            <span className="text-xl font-bold font-display tabular-nums text-emerald-700">{closedCount}</span>
          </div>
        </div>

        {/* Filtered Bugs Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-xs" aria-label={`Work items for ${selectedPage}`}>
            <caption className="sr-only">Detailed bug breakdown for {selectedPage} module</caption>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-display font-semibold uppercase tracking-wider text-[11px]">
                <th scope="col" className="py-2 px-3">ID</th>
                <th scope="col" className="py-2 px-3 min-w-[240px]">Title</th>
                <th scope="col" className="py-2 px-3 text-center">State</th>
                <th scope="col" className="py-2 px-3 text-center">Severity</th>
                <th scope="col" className="py-2 px-3 text-center">Pri</th>
                <th scope="col" className="py-2 px-3">Assignee</th>
                <th scope="col" className="py-2 px-3">Last Synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageBugs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No work items currently classified under <strong>{selectedPage}</strong>.
                  </td>
                </tr>
              ) : (
                pageBugs.map((b, idx) => (
                  <tr
                    key={b.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                  >
                    <th scope="row" className="py-2 px-3 font-mono font-semibold text-sky-700 tabular-nums font-normal text-left">
                      <span className="bg-sky-50 px-2 py-0.5 rounded border border-sky-200/70 text-xs">
                        {b.id}
                      </span>
                    </th>
                    <td className="py-2 px-3 font-medium text-slate-900 line-clamp-1">
                      {b.title}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {b.state}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap font-medium text-slate-700">
                      {b.severity}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-semibold text-slate-700">
                      P{b.priority}
                    </td>
                    <td className="py-2 px-3 text-slate-700 truncate max-w-[120px]">
                      {b.assigned_to || 'Unassigned'}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {b.last_synced || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
