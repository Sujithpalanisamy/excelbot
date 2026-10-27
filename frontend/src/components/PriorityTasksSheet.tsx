import React, { useState, useEffect } from 'react';
import {
Download, 
  Printer, 
  AlertCircle, 
  Search, 
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import type { PriorityTasksData } from '../types';
import { api } from '../services/api';

interface PriorityTasksSheetProps {
  onDownloadExcel?: () => void;
}

export const PriorityTasksSheet: React.FC<PriorityTasksSheetProps> = ({
}) => {
  const [data, setData] = useState<PriorityTasksData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchTasks = async () => {
      try {
        const res = await api.getPriorityTasksData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load priority tasks:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTasks();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('PRIORITY TASKS — High-Impact Deliverables & Blocking Logic Rework');
    lines.push('');
    lines.push('Task ID,Task Name,Notes / Execution Status');
    
    data.tasks.forEach(t => {
      lines.push(`${t.id},"${(t.taskName || '').replace(/"/g, '""')}","${(t.notes || '').replace(/"/g, '""')}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet16_Priority_Tasks_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 16: Priority Tasks...</h3>
        <p className="text-xs text-slate-500 mt-1">Fetching mission-critical items and blocking technical debts</p>
      </div>
    );
  }

  const doneCount = data.tasks.filter(t => (t.notes || '').toLowerCase().trim() === 'done').length;
  const bkDoneCount = data.tasks.filter(t => (t.notes || '').toLowerCase().includes('bk done')).length;
  const inProgressCount = data.tasks.length - doneCount - bkDoneCount;

  const filteredTasks = data.tasks.filter(t => {
    const matchesSearch = !searchTerm || 
      (t.taskName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const noteLower = (t.notes || '').toLowerCase();
    let matchesStatus = true;
    if (statusFilter === 'done') matchesStatus = noteLower === 'done';
    else if (statusFilter === 'bk_done') matchesStatus = noteLower.includes('bk done');
    else if (statusFilter === 'in_progress') matchesStatus = noteLower !== 'done' && !noteLower.includes('bk done');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Actions */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>SHEET 16: PRIORITY TASKS</span>
          </div>
          <span className="text-xs text-slate-500">
            {data.totalTasks} Mission-Critical Deliverables Tracked
          </span>
        </div>

        <div className="flex items-center gap-2">
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Tasks</span>
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.totalTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">High priority focus items</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Completed (Done)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{doneCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {((doneCount / (data.totalTasks || 1)) * 100).toFixed(0)}% completion rate
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Backend Done (bk done)</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{bkDoneCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">API & DB logic complete</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>In Progress / Rework</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{inProgressCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Active workflows</div>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search task name or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Items ({data.totalTasks})</option>
            <option value="done">Done ({doneCount})</option>
            <option value="bk_done">Backend Done ({bkDoneCount})</option>
            <option value="in_progress">In Progress / Rework ({inProgressCount})</option>
          </select>
        </div>

        {(searchTerm || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Authentic Excel Table */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="bg-[#1b365d] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300" />
            <span>PRIORITY TASKS MATRIX (TASKS: {filteredTasks.length})</span>
          </div>
          <span className="text-[11px] font-normal text-slate-300">
            Critical delivery items and tracking status
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#1B365D] text-white font-bold sticky top-0 z-10 select-none shadow-sm text-[11px]">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#2C4D75] w-16 text-center">S.No</th>
                <th className="py-2.5 px-4 border-r border-[#2C4D75] min-w-[320px]">PRIORITY TASK NAME</th>
                <th className="py-2.5 px-4 w-72">NOTES / EXECUTION STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400 bg-slate-50 italic">
                    No priority tasks match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t, idx) => {
                  const noteLower = (t.notes || '').toLowerCase().trim();
                  const isDone = noteLower === 'done';
                  const isBkDone = noteLower.includes('bk done');

                  return (
                    <tr 
                      key={t.id || idx}
                      className="hover:bg-blue-50/60 transition-colors group text-slate-800 even:bg-slate-50/50"
                    >
                      {/* ID / Row Number */}
                      <td className="py-2 px-3 text-center border-r border-slate-200 font-mono text-slate-500">
                        {t.id}
                      </td>

                      {/* Task Name */}
                      <td className="py-2 px-4 border-r border-slate-200 font-medium text-slate-900">
                        {t.taskName}
                      </td>

                      {/* Notes / Status */}
                      <td className="py-2 px-4">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </span>
                        ) : isBkDone ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{t.notes}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{t.notes || 'In Progress'}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Soft Yellow Total Row */}
            <tfoot className="bg-[#FFF2CC] font-bold text-slate-900 border-t-2 border-slate-400 text-[11px]">
              <tr>
                <td className="py-2.5 px-3 text-center border-r border-amber-300">
                  TOTAL
                </td>
                <td className="py-2.5 px-4 border-r border-amber-300">
                  {filteredTasks.length} Tasks Listed
                </td>
                <td className="py-2.5 px-4 text-emerald-800">
                  {doneCount} Completed ({((doneCount / (data.totalTasks || 1)) * 100).toFixed(0)}%)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
