import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  History,
  Search,
  Loader2,
  Archive,
  ExternalLink
} from 'lucide-react';
import type { DeploymentHistoryData } from '../types';
import { api } from '../services/api';
import { Pagination } from './Pagination';

interface DeploymentHistorySheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel?: () => void;
}

export const DeploymentHistorySheet: React.FC<DeploymentHistorySheetProps> = ({
  onNavigateToSheet1WithFilter,
}) => {
  const [data, setData] = useState<DeploymentHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterQaStatus, setFilterQaStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const res = await api.getDeploymentHistoryData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load deployment history data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('DEPLOYMENT HISTORY — Historical Deployment Archive & Superseded Records');
    lines.push('');
    lines.push('Type,ID,Item Name,Deployment Date (Superseded),Status,QA Status,QA Assigned,Notes');
    
    data.history.forEach(h => {
      lines.push(`"${h.type}",${h.id},"${(h.itemName || '').replace(/"/g, '""')}","${h.deploymentDate}","${h.status}","${h.qaStatus}","${h.qaAssigned}","${(h.notes || '').replace(/"/g, '""')}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet7_Deployment_History_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 7: Deployment History...</h3>
        <p className="text-xs text-slate-500 mt-1">Reading superseded release records and historical deployment archives</p>
      </div>
    );
  }

  const cleanSearch = searchTerm.replace(/^#/, '').trim().toLowerCase();
  const filteredHistory = data.history.filter(h => {
    const matchesSearch = !searchTerm || 
      (cleanSearch && String(h.id).includes(cleanSearch)) ||
      (h.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.qaAssigned || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || h.type.toLowerCase() === filterType.toLowerCase();
    const matchesQa = filterQaStatus === 'all' || (h.qaStatus || '').toLowerCase().includes(filterQaStatus.toLowerCase());

    return matchesSearch && matchesType && matchesQa;
  });

  const paginatedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const uniqueQaStatuses = Array.from(new Set(data.history.map(h => h.qaStatus).filter(Boolean)));
  const bugCount = data.history.filter(h => h.type.toLowerCase() === 'bug').length;
  const taskCount = data.history.filter(h => h.type.toLowerCase() === 'task').length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>SHEET 7: DEPLOYMENT HISTORY</span>
          </div>
          <span className="text-xs text-slate-500">
            {data.totalItems} Archived Deployment Records Logged
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
            title="Print sheet"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Historical Records</span>
            <Archive className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.totalItems}</div>
          <div className="text-[11px] text-slate-500 mt-1">Superseded sprint builds</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Archived Bugs</span>
            <span className="text-rose-600 font-bold text-xs">BUG</span>
          </div>
          <div className="text-2xl font-bold text-rose-700">{bugCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Prior bug release records</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Archived Tasks</span>
            <span className="text-emerald-600 font-bold text-xs">TASK</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{taskCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Feature / Task release items</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>QA Verified</span>
            <span className="text-blue-600 font-bold text-xs">QA</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {data.history.filter(h => (h.qaStatus || '').toLowerCase().includes('pass') || (h.qaStatus || '').toLowerCase().includes('done')).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Completed QA sign-offs</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, summary, QA, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium whitespace-nowrap">Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="Bug">Bug</option>
            <option value="Task">Task</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium whitespace-nowrap">QA Status:</label>
          <select
            value={filterQaStatus}
            onChange={(e) => setFilterQaStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All QA Statuses</option>
            {uniqueQaStatuses.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {(searchTerm || filterType !== 'all' || filterQaStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterQaStatus('all');
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
            <Archive className="w-4 h-4 text-blue-300" />
            <span>DEPLOYMENT HISTORY ARCHIVE (RECORDS: {filteredHistory.length})</span>
          </div>
          <span className="text-[11px] font-normal text-slate-300">
            Historical deployments superseded by newer builds
          </span>
        </div>

        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#1B365D] text-white font-bold sticky top-0 z-10 select-none shadow-sm text-[11px]">
              <tr>
                <th className="py-2 px-2 border-r border-[#2C4D75] w-16 text-center">TYPE</th>
                <th className="py-2 px-2 border-r border-[#2C4D75] w-20 text-center">ID</th>
                <th className="py-2 px-3 border-r border-[#2C4D75] min-w-[280px]">ITEM NAME / SUMMARY</th>
                <th className="py-2 px-2.5 border-r border-[#2C4D75] w-36 text-center">DEPLOYMENT DATE</th>
                <th className="py-2 px-2.5 border-r border-[#2C4D75] w-24 text-center">STATUS</th>
                <th className="py-2 px-2.5 border-r border-[#2C4D75] w-28 text-center">QA STATUS</th>
                <th className="py-2 px-2.5 border-r border-[#2C4D75] w-32">QA ASSIGNED</th>
                <th className="py-2 px-3 min-w-[200px]">NOTES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 bg-slate-50 italic">
                    No historical records matched your search.
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((h, idx) => {
                  const isBug = h.type.toLowerCase() === 'bug';
                  const isClosed = (h.status || '').toLowerCase().includes('closed');

                  return (
                    <tr 
                      key={`${h.id}-${idx}`}
                      className="hover:bg-blue-50/60 transition-colors group text-slate-700 even:bg-slate-50/50"
                    >
                      {/* Type */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isBug 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {h.type}
                        </span>
                      </td>

                      {/* ID */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-200 font-mono font-semibold">
                        {isBug ? (
                          <button
                            onClick={() => onNavigateToSheet1WithFilter?.('bugId', String(h.id))}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 hover:underline group-hover:font-bold"
                            title={`Drill down Bug ${h.id} in Sheet 1`}
                          >
                            <span>{h.id}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                          </button>
                        ) : (
                          <span className="text-slate-600">{h.id}</span>
                        )}
                      </td>

                      {/* Item Name */}
                      <td className="py-1.5 px-3 border-r border-slate-200 font-medium text-slate-800">
                        <div className="line-clamp-2" title={h.itemName}>
                          {h.itemName || '—'}
                        </div>
                      </td>

                      {/* Deployment Date */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-200 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {h.deploymentDate || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isClosed 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {h.status || 'Archived'}
                        </span>
                      </td>

                      {/* QA Status */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-200">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-medium">
                          {h.qaStatus || '—'}
                        </span>
                      </td>

                      {/* QA Assigned */}
                      <td className="py-1.5 px-2.5 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                        {h.qaAssigned || '—'}
                      </td>

                      {/* Notes */}
                      <td className="py-1.5 px-3 text-slate-600 italic text-[11px]">
                        {h.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Soft Yellow Total Row */}
            <tfoot className="bg-[#FFF2CC] font-bold text-slate-900 border-t-2 border-slate-400 text-[11px]">
              <tr>
                <td colSpan={2} className="py-2 px-3 text-right border-r border-amber-300">
                  TOTAL FILTERED:
                </td>
                <td className="py-2 px-3 border-r border-amber-300 font-mono">
                  {filteredHistory.length} Historical Records
                </td>
                <td colSpan={5} className="py-2 px-3 text-slate-700">
                  Superseded records maintained for audit & traceability
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredHistory.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[15, 25, 50, 100]}
        />
      </div>
    </div>
  );
};
