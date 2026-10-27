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
  Filter
} from 'lucide-react';
import type { AzureImportItem } from '../types';
import { api } from '../services/api';

interface AzureImportSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel: () => void;
}

export const AzureImportSheet: React.FC<AzureImportSheetProps> = ({
  onNavigateToSheet1WithFilter,
  onDownloadExcel,
}) => {
  const [items, setItems] = useState<AzureImportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterNature, setFilterNature] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAzureImportData();
      setItems(data);
    } catch (err) {
      console.error('Failed to load azure import data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = () => {
    const lines: string[] = [];
    lines.push('AZURE REPORT IMPORT — paste Azure DevOps work items here');
    lines.push('ID,Work Item Type,Title,Assigned To,State,Tags,Created Date,Assignee (clean),Developer,Module,Bug Nature,Status Group,Pending?,Reopened?,In Bug Tracker?,Search text');
    items.forEach(it => {
      lines.push(`${it.id},"${it.work_item_type}","${it.title.replace(/"/g, '""')}","${it.assigned_to}","${it.state}","${it.tags}","${it.created_date}","${it.assignee_clean}","${it.developer}","${it.module}","${it.bug_nature}","${it.status_group}","${it.is_pending}","${it.is_reopened}","${it.in_bug_tracker}","${it.search_text}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet4_Azure_Import_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter items
  const cleanSearch = searchTerm.replace(/^#/, '').trim().toLowerCase();
  const filtered = items.filter(it => {
    const matchesSearch = !searchTerm || 
      (cleanSearch && it.id.toString().includes(cleanSearch)) || 
      it.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      it.assignee_clean.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.tags.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMod = filterModule === 'all' || it.module.toLowerCase() === filterModule.toLowerCase();
    const matchesState = filterState === 'all' || it.state.toLowerCase() === filterState.toLowerCase();
    const matchesNature = filterNature === 'all' || it.bug_nature.toLowerCase() === filterNature.toLowerCase();
    return matchesSearch && matchesMod && matchesState && matchesNature;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const modules = Array.from(new Set(items.map(i => i.module))).filter(Boolean);
  const states = Array.from(new Set(items.map(i => i.state))).filter(Boolean);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 4: Azure Import...</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating raw Azure DevOps work items and evaluating calculated columns H:P</p>
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
            Sheet 4: Azure Import
          </span>
          <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {items.length} Total Azure Records • Columns A:P
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-semibold text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
            <span>Reload Live</span>
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

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            AZURE REPORT IMPORT — PASTE AZURE DEVOPS WORK ITEMS HERE
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">EVERY TIME: </span>
            open the downloaded CSV or Excel from Azure DevOps, copy rows, and paste them here. Columns A-G are raw Azure fields; Columns H-P are automatically calculated.
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
              placeholder="Search by ID, title, tags, or assignee..."
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
              <label className="text-slate-600 font-medium">State:</label>
              <select
                value={filterState}
                onChange={(e) => { setFilterState(e.target.value); setCurrentPage(1); }}
                className="py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none"
              >
                <option value="all">All States</option>
                {states.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-slate-600 font-medium">Nature:</label>
              <select
                value={filterNature}
                onChange={(e) => { setFilterNature(e.target.value); setCurrentPage(1); }}
                className="py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none"
              >
                <option value="all">All</option>
                <option value="UI">UI</option>
                <option value="Functional">Functional</option>
              </select>
            </div>
          </div>
        </div>

        {/* 16-Column Excel Grid Table */}
        <div className="border border-slate-300 bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#2b5b84] text-white font-bold uppercase tracking-wider text-[10px]">
                {/* Raw Azure Fields (A-G) */}
                <th className="py-2 px-2.5 border border-[#2b5b84] w-14">A: ID</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] w-20">B: Type</th>
                <th className="py-2 px-3 border border-[#2b5b84] min-w-[260px]">C: Title</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] min-w-[140px]">D: Assigned To</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] text-center w-20">E: State</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] min-w-[100px]">F: Tags</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] w-28">G: Created Date</th>
                
                {/* Calculated Fields (H-P) */}
                <th className="py-2 px-2.5 border border-[#2b5b84] bg-[#234b6d] min-w-[120px]">H: Clean Name</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] bg-[#234b6d] min-w-[110px]">I: Developer</th>
                <th className="py-2 px-2.5 border border-[#2b5b84] bg-[#234b6d] w-24">J: Module</th>
                <th className="py-2 px-2 border border-[#2b5b84] bg-[#234b6d] text-center w-16">K: Nature</th>
                <th className="py-2 px-2 border border-[#2b5b84] bg-[#234b6d] text-center w-20">L: Status Grp</th>
                <th className="py-2 px-2 border border-[#2b5b84] bg-[#234b6d] text-center w-16">M: Pending?</th>
                <th className="py-2 px-2 border border-[#2b5b84] bg-[#234b6d] text-center w-16">N: Reopen?</th>
                <th className="py-2 px-2 border border-[#2b5b84] bg-[#234b6d] text-center w-20">O: In Tracker</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((it: AzureImportItem, idx: number) => {
                const isPending = it.is_pending === 'Yes';
                const isReopened = it.is_reopened === 'Yes';
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1 px-2.5 border border-slate-300 font-mono font-bold text-[#1b365d]">
                      #{it.id}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 text-slate-600">
                      {it.work_item_type}
                    </td>
                    <td className="py-1 px-3 border border-slate-300 text-slate-900 max-w-sm truncate" title={it.title}>
                      {it.title}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 text-slate-700 truncate max-w-[140px]" title={it.assigned_to}>
                      {it.assigned_to}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 text-center font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        it.state === 'Done' || it.state === 'Closed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {it.state}
                      </span>
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 text-slate-500 truncate max-w-[100px]" title={it.tags}>
                      {it.tags || '-'}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 font-mono text-[10px] text-slate-600">
                      {it.created_date.slice(0, 10)}
                    </td>

                    {/* Calculated Columns */}
                    <td className="py-1 px-2.5 border border-slate-300 font-medium text-slate-900 bg-sky-50/40">
                      <button
                        type="button"
                        onClick={() => onNavigateToSheet1WithFilter?.('developer', it.assignee_clean)}
                        className="hover:underline text-left cursor-pointer hover:text-sky-800"
                        title={`Filter Sheet 1 for ${it.assignee_clean}`}
                      >
                        {it.assignee_clean}
                      </button>
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 text-slate-800 bg-sky-50/40">
                      {it.developer}
                    </td>
                    <td className="py-1 px-2.5 border border-slate-300 font-semibold text-slate-800 bg-sky-50/40">
                      <button
                        type="button"
                        onClick={() => onNavigateToSheet1WithFilter?.('page', it.module)}
                        className="hover:underline text-left cursor-pointer hover:text-sky-800"
                        title={`Filter Sheet 1 for ${it.module}`}
                      >
                        {it.module}
                      </button>
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold bg-sky-50/40">
                      <span className={it.bug_nature === 'UI' ? 'text-sky-700' : 'text-indigo-700'}>
                        {it.bug_nature}
                      </span>
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono text-[10px] bg-sky-50/40">
                      {it.status_group}
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold bg-sky-50/40">
                      {isPending ? (
                        <span className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono font-bold bg-sky-50/40">
                      {isReopened ? (
                        <span className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-1 px-2 border border-slate-300 text-center font-mono text-emerald-700 font-bold bg-sky-50/40">
                      {it.in_bug_tracker}
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
