import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  CalendarRange,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3
} from 'lucide-react';
import type { GanttData } from '../types';
import { api } from '../services/api';
import { Pagination } from './Pagination';

interface GanttSheetProps {
  onDownloadExcel?: () => void;
}

export const GanttSheet: React.FC<GanttSheetProps> = () => {
  const [data, setData] = useState<GanttData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'visual'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    let isMounted = true;
    const fetchGantt = async () => {
      try {
        const res = await api.getGanttData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load Gantt data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchGantt();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('GANTT CHART — Page Development Timeline & Milestone Schedule');
    lines.push('');
    lines.push('Page ID,Module,Page Name,Planned Start,Planned End,Progress %,Status');
    
    data.items.forEach(g => {
      lines.push(`${g.pageId},"${g.module}","${(g.pageName || '').replace(/"/g, '""')}","${g.plannedStart}","${g.plannedEnd}","${g.progress}","${g.status}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet17_Gantt_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 17: Gantt Chart...</h3>
        <p className="text-xs text-slate-500 mt-1">Calculating timeline spans, milestone completions, and delivery progress</p>
      </div>
    );
  }

  const completedPages = data.items.filter(i => i.progress === '100%' || (i.status || '').toLowerCase().includes('done')).length;
  const inProgressPages = data.items.length - completedPages;

  const filteredItems = data.items.filter(item => {
    const matchesSearch = !searchTerm ||
      (item.pageName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.module || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = moduleFilter === 'all' || item.module === moduleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === '100%' ? item.progress === '100%' : item.progress !== '100%');

    return matchesSearch && matchesModule && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Controls */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <CalendarRange className="w-3.5 h-3.5 text-indigo-600" />
            <span>SHEET 17: GANTT CHART</span>
          </div>
          <span className="text-xs text-slate-500">
            {data.items.length} Planned Pages across {data.modules.length} Modules
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Spreadsheet View
            </button>
            <button
              onClick={() => setViewMode('visual')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewMode === 'visual' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline Bars
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Scheduled Pages</span>
            <CalendarRange className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.items.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Planned in Gantt scope</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Completed (100%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{completedPages}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {((completedPages / (data.items.length || 1)) * 100).toFixed(0)}% delivered
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>In Progress Pages</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{inProgressPages}</div>
          <div className="text-[11px] text-slate-500 mt-1">Under development</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Tracked Modules</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">{data.modules.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Distinct functional domains</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search page name or module..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium">Module:</label>
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Modules ({data.modules.length})</option>
            {data.modules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium">Progress:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Progress Levels</option>
            <option value="100%">100% Completed Only</option>
            <option value="in_progress">Under 100% (In Progress)</option>
          </select>
        </div>

        {(searchTerm || moduleFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setModuleFilter('all');
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Content: Spreadsheet View vs Visual Timeline */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
          <div className="bg-[#1b365d] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-indigo-300" />
              <span>GANTT MILESTONE SCHEDULE (PAGES: {filteredItems.length})</span>
            </div>
            <span className="text-[11px] font-normal text-slate-300">
              Excel Sheet 17 — Planned Start & End Dates with Progress Tracking
            </span>
          </div>

          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#1B365D] text-white font-bold sticky top-0 z-10 select-none shadow-sm text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-[#2C4D75] w-20 text-center">PAGE ID</th>
                  <th className="py-2.5 px-3 border-r border-[#2C4D75] w-36">MODULE</th>
                  <th className="py-2.5 px-4 border-r border-[#2C4D75] min-w-[280px]">PAGE NAME</th>
                  <th className="py-2.5 px-3 border-r border-[#2C4D75] w-32 text-center">PLANNED START</th>
                  <th className="py-2.5 px-3 border-r border-[#2C4D75] w-32 text-center">PLANNED END</th>
                  <th className="py-2.5 px-4 border-r border-[#2C4D75] w-48 text-center">PROGRESS %</th>
                  <th className="py-2.5 px-3 w-28 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 bg-slate-50 italic">
                      No Gantt items match your search.
                    </td>
                  </tr>
                ) : (
                  filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((g, idx) => {
                    const pctNum = parseInt(g.progress) || (g.progress === '100%' ? 100 : 0);
                    const isDone = pctNum === 100 || (g.status || '').toLowerCase().includes('done');

                    return (
                      <tr 
                        key={g.pageId || idx}
                        className="hover:bg-blue-50/60 transition-colors group text-slate-800 even:bg-slate-50/50"
                      >
                        {/* Page ID */}
                        <td className="py-2 px-3 text-center border-r border-slate-200 font-mono text-slate-600 font-semibold">
                          {g.pageId}
                        </td>

                        {/* Module */}
                        <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                            {g.module}
                          </span>
                        </td>

                        {/* Page Name */}
                        <td className="py-2 px-4 border-r border-slate-200 font-medium text-slate-900">
                          {g.pageName}
                        </td>

                        {/* Planned Start */}
                        <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {g.plannedStart || '—'}
                        </td>

                        {/* Planned End */}
                        <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {g.plannedEnd || '—'}
                        </td>

                        {/* Progress Bar in Cell */}
                        <td className="py-2 px-4 border-r border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  isDone ? 'bg-emerald-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.min(pctNum, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-slate-700 text-[11px] font-semibold w-10 text-right">
                              {g.progress || `${pctNum}%`}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isDone 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {g.status || (isDone ? 'Done' : 'Active')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Soft Yellow Total Row */}
              <tfoot className="bg-[#FFF2CC] font-bold text-slate-900 border-t-2 border-slate-400 text-[11px]">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-right border-r border-amber-300">
                    TOTAL FILTERED:
                  </td>
                  <td className="py-2.5 px-4 border-r border-amber-300">
                    {filteredItems.length} Pages Scheduled
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-center border-r border-amber-300 text-slate-700">
                    Baseline Milestones
                  </td>
                  <td colSpan={2} className="py-2.5 px-4 text-emerald-800">
                    {completedPages} Pages 100% Completed
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      ) : (
        /* Visual Timeline View */
        <div className="bg-white border border-slate-300 rounded p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>GANTT SPRINT TIMELINE REPRESENTATION</span>
            </span>
            <span className="text-slate-500">Sorted by Planned Timeline</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-2">
            {filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(item => {
              const pct = parseInt(item.progress) || (item.progress === '100%' ? 100 : 0);
              const isDone = pct === 100;

              return (
                <div key={item.pageId} className="p-3 bg-slate-50 border border-slate-200 rounded hover:border-blue-400 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-600">Page {item.pageId}</span>
                      <span className="font-semibold text-slate-900">{item.pageName}</span>
                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        {item.module}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {item.plannedStart} → {item.plannedEnd}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.progress}
                      </span>
                    </div>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-blue-600'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}
    </div>
  );
};
