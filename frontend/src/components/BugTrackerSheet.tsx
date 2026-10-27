import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { BugTrackerItem } from '../types';
import { api } from '../services/api';

interface BugTrackerSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel?: () => void;
}

export const BugTrackerSheet: React.FC<BugTrackerSheetProps> = ({
  onNavigateToSheet1WithFilter,
}) => {
  const [items, setItems] = useState<BugTrackerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSync, setFilterSync] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBugTrackerData();
      setItems(data);
    } catch (err) {
      console.error('Failed to load bug tracker data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = () => {
    const lines: string[] = [];
    lines.push('BUG TRACKER — Comprehensive defect tracking and reconciliation');
    lines.push('Bug ID,Module,Bug Summary,Component,Original Dev,Fix Dev,QA Raised By,Severity,Priority,Date Raised,Date Closed,Status,Released to QA,Reopened?,Root Cause,Azure State,Sync Check,Azure Assignee,Bug Nature,Age Days,Age Bucket,Dev Pending?');
    items.forEach(it => {
      lines.push(`${it.bug_id},"${it.module}","${it.bug_summary.replace(/"/g, '""')}","${it.component}","${it.original_developer}","${it.fix_developer}","${it.qa_raised_by}","${it.severity}","${it.priority}","${it.date_raised}","${it.date_closed}","${it.status}","${it.released_to_qa}","${it.reopened}","${it.root_cause}","${it.azure_state}","${it.sync_check}","${it.azure_assignee}","${it.bug_nature}",${it.age_days},"${it.age_bucket}","${it.dev_pending}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet5_Bug_Tracker_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cleanSearch = searchTerm.replace(/^#/, '').trim().toLowerCase();
  const filtered = items.filter(it => {
    const matchesSearch = !searchTerm || 
      (cleanSearch && it.bug_id.toString().includes(cleanSearch)) || 
      it.bug_summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
      it.original_developer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMod = filterModule === 'all' || it.module.toLowerCase() === filterModule.toLowerCase();
    const matchesStat = filterStatus === 'all' || it.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSync = filterSync === 'all' || it.sync_check === filterSync;
    const matchesAge = filterAge === 'all' || it.age_bucket === filterAge;
    return matchesSearch && matchesMod && matchesStat && matchesSync && matchesAge;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const modules = Array.from(new Set(items.map(i => i.module))).filter(Boolean);
  const statuses = Array.from(new Set(items.map(i => i.status))).filter(Boolean);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 5: Bug Tracker...</h3>
        <p className="text-xs text-slate-500 mt-1">Reconciling live bug statuses with Azure DevOps...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs select-text">
      {/* Top Action Toolbar */}
      <div className="bg-white border border-slate-300 px-4 py-2.5 rounded shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1b365d] text-white font-bold text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Sheet 5: Bug Tracker
          </span>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {items.length} Records
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-semibold text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
            <span>Reload</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-semibold text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-700" />
            <span>Export CSV</span>
          </button>


          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 font-semibold text-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            BUG TRACKER — COMPREHENSIVE DEFECT TRACKING &amp; RECONCILIATION
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">STATUS RECONCILIATION: </span>
            Column AC compares the Bug Tracker status with Azure Import state via INDEX/MATCH. Badges: OK (in sync), Pending (state change pending), or Check (not in Azure).
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50 border border-slate-300 p-2.5 rounded flex items-center justify-between flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search by ID, summary, or developer..."
              className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <label className="text-slate-600 font-medium">Module:</label>
              <select
                value={filterModule}
                onChange={(e) => { setFilterModule(e.target.value); setCurrentPage(1); }}
                className="py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none"
              >
                <option value="all">All Modules</option>
                {modules.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-600 font-medium">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                {statuses.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-600 font-medium">Sync Check:</label>
              <select
                value={filterSync}
                onChange={(e) => { setFilterSync(e.target.value); setCurrentPage(1); }}
                className="py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none font-mono"
              >
                <option value="all">All</option>
                <option value="OK">OK (In Sync)</option>
                <option value="Pending">Pending</option>
                <option value="Check">Check</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-600 font-medium">Age:</label>
              <select
                value={filterAge}
                onChange={(e) => { setFilterAge(e.target.value); setCurrentPage(1); }}
                className="py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none font-mono"
              >
                <option value="all">All Age Buckets</option>
                <option value="0-7 Days">0-7 Days</option>
                <option value="8-15 Days">8-15 Days</option>
                <option value="16-30 Days">16-30 Days</option>
                <option value="31-45 Days">31-45 Days</option>
                <option value="46-60 Days">46-60 Days</option>
                <option value="60+ Days">60+ Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master Bug Tracker Grid */}
        <div className="border border-slate-300 bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#2b5b84] text-white font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2 px-2.5 border border-[#2b5b84] w-14">Bug ID</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] w-24">Module</th>
                <th className="py-2 px-3 border border-[#2b5b84] min-w-[240px]">Bug Summary</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] min-w-[120px]">Fix Developer</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-20">Severity</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-14">Priority</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] text-center w-20">Status</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-20 bg-[#234b6d]">Sync Check</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] text-center w-20 bg-[#234b6d]">Azure State</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-16 bg-[#234b6d]">Nature</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-16 bg-[#234b6d]">Age</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] text-center w-20 bg-[#234b6d]">Age Bucket</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-16 bg-[#234b6d]">Pending?</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((it: BugTrackerItem, idx: number) => {
                const isCrit = it.severity.toLowerCase().includes('critical') || it.severity.toLowerCase().includes('high');
                const isPending = it.dev_pending === 'Yes';
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1 px-2.5 border border-slate-300 font-mono font-bold text-[#1b365d]">
                      {it.bug_id}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 font-semibold text-slate-800">
                      <button
                        type="button"
                        onClick={() => onNavigateToSheet1WithFilter?.('page', it.module)}
                        className="hover:underline text-left cursor-pointer hover:text-sky-800"
                        title={`Filter Sheet 1 for ${it.module}`}
                      >
                        {it.module}
                      </button>
                    </td>
                    <td className="py-1 px-3 border border-slate-300 text-slate-900 max-w-sm truncate" title={it.bug_summary}>
                      {it.bug_summary}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 font-medium text-slate-800">
                      <button
                        type="button"
                        onClick={() => onNavigateToSheet1WithFilter?.('developer', it.fix_developer)}
                        className="hover:underline text-left cursor-pointer hover:text-sky-800"
                        title={`Filter Sheet 1 for ${it.fix_developer}`}
                      >
                        {it.fix_developer}
                      </button>
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isCrit ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {it.severity}
                      </span>
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold text-slate-700">
                      {it.priority}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 text-center font-mono font-semibold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        it.status === 'Done' || it.status === 'Closed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {it.status}
                      </span>
                    </td>

                    {/* Status Reconciliation Columns */}
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold bg-sky-50/40">
                      {it.sync_check === 'OK' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> OK
                        </span>
                      ) : it.sync_check === 'Pending' ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px]">
                          <AlertCircle className="w-3 h-3 text-rose-600" /> Check
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 text-center font-mono text-slate-700 bg-sky-50/40">
                      {it.azure_state}
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold bg-sky-50/40">
                      <span className={it.bug_nature === 'UI' ? 'text-sky-700' : 'text-indigo-700'}>
                        {it.bug_nature}
                      </span>
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold text-slate-900 bg-sky-50/40">
                      {it.age_days}d
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 text-center font-mono text-[10px] bg-sky-50/40">
                      {it.age_bucket}
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold bg-sky-50/40">
                      {isPending ? (
                        <span className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-2 flex-wrap gap-2">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
