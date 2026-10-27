import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  UserCheck,
  Layers,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { PendingWithDeveloperData, PendingBugItem } from '../types';
import { api } from '../services/api';

interface PendingWithDeveloperSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel?: () => void;
}

export const PendingWithDeveloperSheet: React.FC<PendingWithDeveloperSheetProps> = ({
  onNavigateToSheet1WithFilter,
}) => {
  const [data, setData] = useState<PendingWithDeveloperData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterDeveloper, setFilterDeveloper] = useState<string>('all');
  const [showDetailedList, setShowDetailedList] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPendingData = async () => {
      try {
        const res = await api.getPendingWithDeveloperData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load pending with developer data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPendingData();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('PENDING WITH DEVELOPER — Status breakdown of all active defects');
    lines.push('');
    lines.push('TABLE 1 - PENDING BY DEVELOPER');
    lines.push('Developer,New,Approved,Committed,Total Pending,UI Pending,Functional Pending,Reopened Pending,% of All Pending');
    data.table1.forEach(r => {
      lines.push(`"${r.developer}",${r.newCount},${r.approvedCount},${r.committedCount},${r.totalPending},${r.uiPending},${r.functionalPending},${r.reopenedPending},"${r.pctOfAllPending}"`);
    });

    lines.push('');
    lines.push('TABLE 2 - PENDING BY MODULE');
    lines.push('Module,New,Approved,Committed,Total Pending,UI Pending,Functional Pending,Reopened Pending,% of All Pending');
    data.table2.forEach(r => {
      lines.push(`"${r.module}",${r.newCount},${r.approvedCount},${r.committedCount},${r.totalPending},${r.uiPending},${r.functionalPending},${r.reopenedPending},"${r.pctOfAllPending}"`);
    });

    lines.push('');
    lines.push('TABLE 3 - PENDING: MODULE x DEVELOPER');
    const headerCols = ['Module', ...data.developers, 'Total'];
    lines.push(headerCols.join(','));
    data.table3.forEach(row => {
      const vals = [row.module, ...data.developers.map(d => row[d] || 0), row.total];
      lines.push(vals.join(','));
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet24_Pending_With_Developer_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 24: Pending With Developer...</h3>
        <p className="text-xs text-slate-500 mt-1">Calculating Developer and Module pending queues and age matrices</p>
      </div>
    );
  }

  // Filtered detailed items
  const cleanSearch = searchTerm.replace(/^#/, '').trim().toLowerCase();
  const filteredBugs = data.pendingBugs.filter(b => {
    const matchesSearch = !searchTerm || 
      (cleanSearch && b.id.toString().includes(cleanSearch)) || 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.assigned_to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMod = filterModule === 'all' || b.module.toLowerCase() === filterModule.toLowerCase();
    const matchesDev = filterDeveloper === 'all' || b.assigned_to.toLowerCase() === filterDeveloper.toLowerCase();
    return matchesSearch && matchesMod && matchesDev;
  });

  return (
    <div className="space-y-4 font-sans text-xs select-text">
      {/* Excel Sheet Action Toolbar */}
      <div className="bg-white border border-slate-300 px-4 py-2.5 rounded shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1b365d] text-white font-bold text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Sheet 24: Pending With Developer
          </span>
          <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Total Active Queue: {data.totalPending} Defects
          </span>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-6">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            PENDING WITH DEVELOPER — Status breakdown of all active defects
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">HOW TO READ THIS: </span>
            Table 1 = pending count per developer. Table 2 = pending count per module. Table 3 = Module x Developer matrix. 
            Dev Pending bugs are in States: New, Approved, or Committed.
          </div>
        </div>

        {/* =========================================================================
            TABLE 1: PENDING BY DEVELOPER
            ========================================================================= */}
        <div className="border border-slate-300 bg-white">
          <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-[#2b5b84]" />
              TABLE 1 - PENDING BY DEVELOPER
            </span>
            <span className="text-slate-500 text-[11px] font-normal">
              Click a developer to filter in Sheet 1
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                  <th className="py-1.5 px-3 border border-[#2b5b84]">Developer</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">New</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Approved</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Committed</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right bg-[#234b6d]">Total Pending</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">UI Pending</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Functional Pending</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Reopened Pending</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">% of All Pending</th>
                </tr>
              </thead>
              <tbody>
                {data.table1.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900 bg-[#d9e1f2]">
                      <button
                        type="button"
                        onClick={() => onNavigateToSheet1WithFilter?.('developer', r.developer)}
                        className="hover:underline text-left cursor-pointer hover:text-sky-800 font-semibold"
                        title={`Filter Sheet 1 for ${r.developer}`}
                      >
                        {r.developer}
                      </button>
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.newCount}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.approvedCount}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.committedCount}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900 bg-[#fff2cc]">
                      {r.totalPending}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-sky-800">
                      {r.uiPending}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-indigo-800">
                      {r.functionalPending}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-amber-800">
                      {r.reopenedPending}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono font-semibold text-right text-slate-700">
                      {r.pctOfAllPending}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-[#e7e6e6] font-bold border-t-2 border-slate-400">
                  <td className="py-1.5 px-3 border border-slate-300 text-slate-900">
                    TOTAL
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table1.reduce((sum, r) => sum + r.newCount, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table1.reduce((sum, r) => sum + r.approvedCount, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table1.reduce((sum, r) => sum + r.committedCount, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900 bg-[#fff2cc]">
                    {data.totalPending}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table1.reduce((sum, r) => sum + r.uiPending, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table1.reduce((sum, r) => sum + r.functionalPending, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table1.reduce((sum, r) => sum + r.reopenedPending, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    100.0%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            TABLE 2: PENDING BY MODULE
            ========================================================================= */}
        <div className="border border-slate-300 bg-white">
          <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#2b5b84]" />
              TABLE 2 - PENDING BY MODULE
            </span>
            <span className="text-slate-500 text-[11px] font-normal">
              Click a module to filter in Sheet 1
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                  <th className="py-1.5 px-3 border border-[#2b5b84]">Module</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">New</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Approved</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Committed</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right bg-[#234b6d]">Total Pending</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">UI Pending</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Functional Pending</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Reopened Pending</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-right">% of All Pending</th>
                </tr>
              </thead>
              <tbody>
                {data.table2.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900 bg-[#d9e1f2]">
                      <button
                        type="button"
                        onClick={() => onNavigateToSheet1WithFilter?.('page', r.module)}
                        className="hover:underline text-left cursor-pointer hover:text-sky-800 font-semibold"
                        title={`Filter Sheet 1 for ${r.module}`}
                      >
                        {r.module}
                      </button>
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.newCount}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.approvedCount}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.committedCount}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900 bg-[#fff2cc]">
                      {r.totalPending}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-sky-800">
                      {r.uiPending}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-indigo-800">
                      {r.functionalPending}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-amber-800">
                      {r.reopenedPending}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono font-semibold text-right text-slate-700">
                      {r.pctOfAllPending}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-[#e7e6e6] font-bold border-t-2 border-slate-400">
                  <td className="py-1.5 px-3 border border-slate-300 text-slate-900">
                    TOTAL
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table2.reduce((sum, r) => sum + r.newCount, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table2.reduce((sum, r) => sum + r.approvedCount, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table2.reduce((sum, r) => sum + r.committedCount, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900 bg-[#fff2cc]">
                    {data.totalPending}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table2.reduce((sum, r) => sum + r.uiPending, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table2.reduce((sum, r) => sum + r.functionalPending, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    {data.table2.reduce((sum, r) => sum + r.reopenedPending, 0)}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                    100.0%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            TABLE 3: PENDING: MODULE x DEVELOPER MATRIX
            ========================================================================= */}
        <div className="border border-slate-300 bg-white">
          <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-300">
            TABLE 3 - PENDING: MODULE x DEVELOPER MATRIX
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                  <th className="py-1.5 px-3 border border-[#2b5b84]">Module</th>
                  {data.developers.map((d, i) => (
                    <th key={i} className="py-1.5 px-2 border border-[#2b5b84] text-center text-[11px] whitespace-nowrap">
                      {d}
                    </th>
                  ))}
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-center bg-[#234b6d]">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.table3.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900 bg-[#d9e1f2] whitespace-nowrap">
                      {row.module}
                    </td>
                    {data.developers.map((d, di) => (
                      <td key={di} className="py-1.5 px-2 border border-slate-300 font-mono text-center text-slate-800">
                        {row[d] || 0}
                      </td>
                    ))}
                    <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-center text-slate-900 bg-[#fff2cc]">
                      {row.total}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-[#e7e6e6] font-bold border-t-2 border-slate-400">
                  <td className="py-1.5 px-3 border border-slate-300 text-slate-900">
                    TOTAL
                  </td>
                  {data.developers.map((d, di) => {
                    const colTotal = data.table3.reduce((acc, row) => acc + (row[d] || 0), 0);
                    return (
                      <td key={di} className="py-1.5 px-2 border border-slate-300 font-mono text-center text-slate-900">
                        {colTotal}
                      </td>
                    );
                  })}
                  <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-center text-slate-900 bg-[#fff2cc]">
                    {data.totalPending}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            DETAILED PENDING DEFECTS DRILL-DOWN LOG
            ========================================================================= */}
        <div className="border border-slate-300 bg-white">
          <div 
            onClick={() => setShowDetailedList(!showDetailedList)}
            className="bg-slate-100 px-3 py-2 font-bold text-xs text-slate-800 border-b border-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#2b5b84]" />
              <span>Detailed Pending Bugs Work Queue ({filteredBugs.length} of {data.totalPending})</span>
            </div>
            <button type="button" className="text-slate-500 hover:text-slate-800">
              {showDetailedList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showDetailedList && (
            <div className="p-3 space-y-3">
              {/* Filter Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by ID, title, or assignee..."
                    className="w-full pl-8 pr-3 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-600 font-medium">Module:</label>
                  <select
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none"
                  >
                    <option value="all">All Modules</option>
                    {data.modules.map((m, idx) => (
                      <option key={idx} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-600 font-medium">Developer:</label>
                  <select
                    value={filterDeveloper}
                    onChange={(e) => setFilterDeveloper(e.target.value)}
                    className="py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:outline-none"
                  >
                    <option value="all">All Developers</option>
                    {data.developers.map((d, idx) => (
                      <option key={idx} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table of pending items */}
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                      <th className="py-1.5 px-3 border border-[#2b5b84]">Bug ID</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84]">Module</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84]">Summary / Title</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84]">Developer</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84] text-center">State</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84] text-center">Severity</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84] text-center">Age (Days)</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84] text-center">Age Bucket</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84] text-center">Nature</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84] text-center">Reopened</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBugs.map((b: PendingBugItem, idx: number) => {
                      const isHighCrit = b.severity.toLowerCase().includes('critical') || b.severity.toLowerCase().includes('high');
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-[#1b365d]">
                            {b.id}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-800">
                            {b.module}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 text-slate-700 max-w-md truncate" title={b.title}>
                            {b.title}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-800">
                            {b.assigned_to}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 text-center font-mono">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              {b.state}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 text-center font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isHighCrit ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {b.severity}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 font-mono text-center font-bold text-slate-900">
                            {b.age_days}d
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 text-center font-mono text-[10px]">
                            {b.age_bucket}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 text-center font-mono text-[10px]">
                            <span className={b.bug_nature === 'UI' ? 'text-sky-700 font-bold' : 'text-indigo-700 font-bold'}>
                              {b.bug_nature}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 text-center font-mono text-[10px]">
                            {b.reopened === 'Yes' ? (
                              <span className="font-bold text-rose-600">Yes</span>
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
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
