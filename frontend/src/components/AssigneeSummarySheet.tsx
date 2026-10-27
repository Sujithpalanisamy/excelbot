import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Users, 
  Search, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import type { AssigneeSummaryData } from '../types';
import { api } from '../services/api';

interface AssigneeSummarySheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel: () => void;
}

export const AssigneeSummarySheet: React.FC<AssigneeSummarySheetProps> = ({
  onNavigateToSheet1WithFilter,
  onDownloadExcel,
}) => {
  const [data, setData] = useState<AssigneeSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchAssigneeData = async () => {
      try {
        const res = await api.getAssigneeSummaryData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load Assignee Summary data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAssigneeData();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('ASSIGNEE SUMMARY — Defect Aggregation by Developer / Assignee');
    lines.push('');
    lines.push('Assigned To,Total Bugs,Open Bugs,Active Bugs,Closed Bugs,Critical / High Severity,% of Total');
    
    data.rows.forEach(r => {
      lines.push(`"${r.assignedTo}",${r.totalBugs},${r.openBugs},${r.activeBugs},${r.closedBugs},${r.criticalHighSeverity},"${r.pctOfTotal}"`);
    });

    lines.push(`"TOTAL",${data.total.totalBugs},${data.total.openBugs},${data.total.activeBugs},${data.total.closedBugs},${data.total.criticalHighSeverity},"${data.total.pctOfTotal}"`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet26_Assignee_Summary_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 26: Assignee Summary...</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating bugs across all engineers and delivery states</p>
      </div>
    );
  }

  const filteredRows = data.rows.filter(r => 
    !searchTerm || r.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span>SHEET 26: ASSIGNEE SUMMARY</span>
          </div>
          <span className="text-xs text-slate-500">
            Defect Volume & State Distribution per Developer / Assignee
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Engineers</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{data.rows.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Assigned developers</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Defects</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{data.total.totalBugs}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across all assignees</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Open Bugs</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{data.total.openBugs}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">New / To Do</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active In Progress</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{data.total.activeBugs}</div>
          <div className="text-[10px] text-blue-500 mt-0.5">Committed & Approved</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Closed Bugs</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{data.total.closedBugs}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Resolved by team</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Critical / High</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{data.total.criticalHighSeverity}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">P1/P2 priorities</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assignee / developer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Clear
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredRows.length} of {data.rows.length} assignees
        </span>
      </div>

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            ASSIGNEE SUMMARY — DEFECT LOAD DISTRIBUTION PER DEVELOPER
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">INSTRUCTIONS: </span>
            Click on any Developer Name to view their filtered defects in Sheet 1: All Bugs.
          </div>
        </div>

        {/* 6-Column Excel Table */}
        <div className="border border-slate-300 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2b5b84] text-white font-bold uppercase">
                <th className="py-2 px-3 border border-[#2b5b84]">Assigned To</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#234b6d]">Total Bugs</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Open Bugs</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Active Bugs</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right text-emerald-100">Closed Bugs</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right text-rose-100">Critical / High Severity</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#1b365d]">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 border border-slate-300 font-medium text-slate-900 bg-[#d9e1f2]">
                    <button
                      type="button"
                      onClick={() => onNavigateToSheet1WithFilter?.('developer', r.assignedTo)}
                      className="hover:underline text-left cursor-pointer hover:text-sky-800 font-semibold flex items-center gap-1.5"
                      title={`Filter Sheet 1 for ${r.assignedTo}`}
                    >
                      <span>{r.assignedTo}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </button>
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right font-bold text-slate-900 bg-[#fff2cc]">
                    {r.totalBugs}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                    {r.openBugs > 0 ? (
                      <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {r.openBugs}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                    {r.activeBugs > 0 ? (
                      <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {r.activeBugs}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                    {r.closedBugs > 0 ? (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {r.closedBugs}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                    {r.criticalHighSeverity > 0 ? (
                      <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                        {r.criticalHighSeverity}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right font-semibold text-slate-700">
                    {r.pctOfTotal}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-[#fff2cc] font-bold border-t-2 border-slate-400">
                <td className="py-2 px-3 border border-slate-400 text-slate-900 uppercase">
                  TOTAL
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-900 bg-[#ffe599]">
                  {data.total.totalBugs}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-amber-900">
                  {data.total.openBugs}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-blue-900">
                  {data.total.activeBugs}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-emerald-900 bg-[#e2f0d9]">
                  {data.total.closedBugs}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-rose-900">
                  {data.total.criticalHighSeverity}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-900 bg-[#ffe599]">
                  100.0%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
