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
  Clock,
  RotateCcw,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import type { BugLifecycleData, BugLifecycleItem } from '../types';
import { api } from '../services/api';

interface BugLifecycleSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel: () => void;
}

export const BugLifecycleSheet: React.FC<BugLifecycleSheetProps> = ({
  onNavigateToSheet1WithFilter,
  onDownloadExcel,
}) => {
  const [data, setData] = useState<BugLifecycleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterReopened, setFilterReopened] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBugLifecycleData();
      setData(res);
    } catch (err) {
      console.error('Failed to load bug lifecycle data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('BUG LIFECYCLE (Auto — fetched from Bug Tracker & Deployment Tracker)');
    lines.push('Bug ID,Module,Severity,Priority,Date Raised,Released to QA,QA Release Date,Reopened?,No. of Reopens,Date Closed,Status,First Deployment Date,Last Deployment Date,Total Deployments,Days Open');
    data.records.forEach(it => {
      lines.push(`${it.bug_id},"${it.module}","${it.severity}","${it.priority}","${it.date_raised}","${it.released_to_qa}","${it.qa_release_date}","${it.reopened}",${it.no_of_reopens},"${it.date_closed}","${it.status}","${it.first_deployment_date}","${it.last_deployment_date}",${it.total_deployments},${it.days_open}`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet8_Bug_Lifecycle_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 8: Bug Lifecycle...</h3>
        <p className="text-xs text-slate-500 mt-1">Calculating lifecycle turnaround duration, deployment milestones, and reopen cycles</p>
      </div>
    );
  }

  const filtered = data.records.filter(it => {
    const matchesSearch = !searchTerm || 
      it.bug_id.toString().includes(searchTerm) || 
      it.module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMod = filterModule === 'all' || it.module.toLowerCase() === filterModule.toLowerCase();
    const matchesStat = filterStatus === 'all' || it.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesReopen = filterReopened === 'all' || it.reopened === filterReopened;
    return matchesSearch && matchesMod && matchesStat && matchesReopen;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const modules = Array.from(new Set(data.records.map(i => i.module))).filter(Boolean);
  const statuses = Array.from(new Set(data.records.map(i => i.status))).filter(Boolean);

  return (
    <div className="space-y-4 font-sans text-xs select-text">
      {/* Top Action Toolbar */}
      <div className="bg-white border border-slate-300 px-4 py-2.5 rounded shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1b365d] text-white font-bold text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Sheet 8: Bug Lifecycle
          </span>
          <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {data.totalBugs} Defects Tracked • End-to-End Cycle Time
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
            onClick={onDownloadExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b365d] hover:bg-[#152a4a] text-white rounded font-semibold text-xs transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Full .xlsx</span>
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

      {/* Lifecycle Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 p-3 rounded">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Average Days Open</span>
            <Clock className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">{data.avgDaysOpen} Days</div>
          <span className="text-[10px] text-slate-500">From creation to verification</span>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">First-Pass Fix Yield</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">{data.firstPassRate}</div>
          <span className="text-[10px] text-slate-500">Passed QA without rework</span>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Reopen Reworks</span>
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700">{data.reopenedCount} Defects</div>
          <span className="text-[10px] text-slate-500">Required repeat testing cycle</span>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Deployments Tracked</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">14 Releases</div>
          <span className="text-[10px] text-slate-500">Production release cycles</span>
        </div>
      </div>

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            BUG LIFECYCLE (AUTO — FETCHED FROM BUG TRACKER &amp; DEPLOYMENT TRACKER)
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">FULLY AUTOMATIC: </span>
            Nothing is entered manually here. Tracks full defect lifecycle from Date Raised to QA Release, Deployment, and Final QA Closure.
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
              placeholder="Search by Bug ID or module..."
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
              <label className="text-slate-600 font-medium">Reopened:</label>
              <select
                value={filterReopened}
                onChange={(e) => { setFilterReopened(e.target.value); setCurrentPage(1); }}
                className="py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none font-mono"
              >
                <option value="all">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* 15-Column Lifecycle Grid Table */}
        <div className="border border-slate-300 bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#2b5b84] text-white font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2 px-2.5 border border-[#2b5b84] w-14">Bug ID</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] w-24">Module</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-20">Severity</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-14">Priority</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] w-24">Date Raised</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-20">Rel to QA</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] w-24">QA Rel Date</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-16">Reopen?</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-16">Reopens</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] w-24">Date Closed</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] text-center w-20">Status</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] w-24 bg-[#234b6d]">First Deploy</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] w-24 bg-[#234b6d]">Last Deploy</th>
                <th className="py-2 px-2 border border-[#2b5b84] text-center w-16 bg-[#234b6d]">Deploys</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] text-right w-20 bg-[#234b6d]">Days Open</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((it: BugLifecycleItem, idx: number) => {
                const isCrit = it.severity.toLowerCase().includes('critical') || it.severity.toLowerCase().includes('high');
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1 px-2.5 border border-slate-300 font-mono font-bold text-[#1b365d]">
                      #{it.bug_id}
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
                    <td className="py-1 px-2.5 border border-slate-300 font-mono text-[10px] text-slate-600">
                      {it.date_raised}
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono text-[10px]">
                      {it.released_to_qa}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 font-mono text-[10px] text-slate-600">
                      {it.qa_release_date || '-'}
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono text-[10px]">
                      {it.reopened === 'Yes' ? (
                        <span className="font-bold text-rose-600">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold text-slate-700">
                      {it.no_of_reopens}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 font-mono text-[10px] text-slate-600">
                      {it.date_closed || '-'}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 text-center font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        it.status === 'Done' || it.status === 'Closed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {it.status}
                      </span>
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 font-mono text-[10px] text-slate-700 bg-sky-50/40">
                      {it.first_deployment_date}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 font-mono text-[10px] text-slate-700 bg-sky-50/40">
                      {it.last_deployment_date}
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold text-slate-800 bg-sky-50/40">
                      {it.total_deployments}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 font-mono font-bold text-right text-slate-900 bg-[#fff2cc]">
                      {it.days_open}d
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
