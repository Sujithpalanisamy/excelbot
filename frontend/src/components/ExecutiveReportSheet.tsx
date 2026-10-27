import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar,
  Search
} from 'lucide-react';
import type { BugItem } from '../types';

interface ExecutiveReportSheetProps {
  allBugs: BugItem[];
  onDownloadExcel: () => void;
}

export const ExecutiveReportSheet: React.FC<ExecutiveReportSheetProps> = ({
  allBugs,
  onDownloadExcel,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  const totalBugs = allBugs.length;
  const newCount = allBugs.filter(b => ['new', 'proposed', 'to do'].includes((b.state || '').toLowerCase())).length;
  const activeCount = allBugs.filter(b => ['active', 'committed', 'in progress', 'investigating', 'approved'].includes((b.state || '').toLowerCase())).length;
  const resolvedCount = allBugs.filter(b => ['resolved', 'fixed'].includes((b.state || '').toLowerCase())).length;
  const closedCount = allBugs.filter(b => ['closed', 'done', 'completed'].includes((b.state || '').toLowerCase())).length;

  const critCount = allBugs.filter(b => String(b.severity || '').toLowerCase().includes('1') || String(b.severity || '').toLowerCase().includes('critical')).length;
  const highCount = allBugs.filter(b => String(b.severity || '').toLowerCase().includes('2') || String(b.severity || '').toLowerCase().includes('high')).length;
  const medCount = allBugs.filter(b => String(b.severity || '').toLowerCase().includes('3') || String(b.severity || '').toLowerCase().includes('medium')).length;
  const lowCount = allBugs.filter(b => String(b.severity || '').toLowerCase().includes('4') || String(b.severity || '').toLowerCase().includes('low')).length;

  const filteredBugs = allBugs.filter(b => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      b.id.toString().includes(q) ||
      (b.title || '').toLowerCase().includes(q) ||
      (b.page_name || '').toLowerCase().includes(q) ||
      (b.assigned_to || '').toLowerCase().includes(q) ||
      (b.state || '').toLowerCase().includes(q)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ['Bug ID', 'Title', 'Module / Page', 'State', 'Severity', 'Priority', 'Assigned To', 'Reporter', 'Created Date'];
    const rows = filteredBugs.map(b => [
      b.id,
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${(b.page_name || '').replace(/"/g, '""')}"`,
      b.state,
      b.severity,
      b.priority ?? '',
      `"${(b.assigned_to || '').replace(/"/g, '""')}"`,
      `"${(b.reporter || '').replace(/"/g, '""')}"`,
      b.created_date || '',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sheet27_Executive_QA_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 print:p-0 print:m-0">
      {/* Header Banner - Screen Only */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900">
                Sheet 27: Executive QA Summary Report
              </h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Ready for Management Review
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Exact replica of Sheet 27 • Printable executive report with state distribution, severity breakdown, and work items listing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onDownloadExcel}
            className="h-9 btn-secondary inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-md shadow-2xs text-slate-700 hover:text-sky-700 hover:border-sky-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Full Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="h-9 btn-secondary inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-md shadow-2xs text-slate-700 hover:text-sky-700 hover:border-sky-300 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / Save as PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-9 btn-secondary inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-md shadow-2xs text-slate-700 hover:text-sky-700 hover:border-sky-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Export Report (.csv)</span>
          </button>
        </div>
      </div>

      {/* Formal Printable Document Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-4 flex items-start justify-between flex-wrap gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-sky-700 uppercase font-mono block mb-1">
              PEOPLEWORKS™ HRMS PLATFORM • QA ACCURACY AUDIT
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
              Azure DevOps Bug Assistant - Executive QA Report
            </h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-sans">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Report Generated: <strong>{new Date().toLocaleString()}</strong>
              </span>
              <span>•</span>
              <span>
                Total Bugs Analyzed: <strong className="text-slate-900 font-mono">{totalBugs}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Distribution Summary Tables (Side by Side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* State Distribution Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
              State Distribution
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-4 text-slate-700 font-medium">New / Proposed</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-sky-700">{newCount}</td>
                  <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">{totalBugs > 0 ? ((newCount / totalBugs) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-700 font-medium">Active / Committed</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-amber-700">{activeCount}</td>
                  <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">{totalBugs > 0 ? ((activeCount / totalBugs) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-700 font-medium">Resolved / Fixed</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-teal-700">{resolvedCount}</td>
                  <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">{totalBugs > 0 ? ((resolvedCount / totalBugs) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-700 font-medium">Closed / Verified (Done)</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700">{closedCount}</td>
                  <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">{totalBugs > 0 ? ((closedCount / totalBugs) * 100).toFixed(1) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Severity Distribution Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700">
              Severity Distribution
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-4 text-slate-700 font-medium">1 - Critical (Blocker)</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-rose-700">{critCount}</td>
                  <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">{totalBugs > 0 ? ((critCount / totalBugs) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-700 font-medium">2 - High</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-orange-700">{highCount}</td>
                  <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">{totalBugs > 0 ? ((highCount / totalBugs) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-700 font-medium">3 - Medium</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-sky-700">{medCount}</td>
                  <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">{totalBugs > 0 ? ((medCount / totalBugs) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-700 font-medium">4 - Low</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-slate-600">{lowCount}</td>
                  <td className="py-2 px-4 text-right text-slate-500 font-mono text-[11px]">{totalBugs > 0 ? ((lowCount / totalBugs) * 100).toFixed(1) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Work Items Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-sm font-display text-slate-900 uppercase tracking-wide">
              Detailed Work Items Listing ({filteredBugs.length} Items)
            </h3>

            <div className="relative w-64 print:hidden">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter report rows..."
                className="h-8 w-full pl-8 pr-2.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3 w-16">ID</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3 w-48">Module / Page</th>
                  <th className="py-2 px-3 text-center w-24">State</th>
                  <th className="py-2 px-3 text-center w-24">Severity</th>
                  <th className="py-2 px-3 text-center w-14">Pri</th>
                  <th className="py-2 px-3 w-36">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBugs.slice(0, 100).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-mono font-semibold text-sky-700">
                      {b.id}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-900 max-w-sm truncate">
                      {b.title}
                    </td>
                    <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">
                      {b.page_name || 'Unclassified'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {b.state}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        String(b.severity).includes('1') || String(b.severity).toLowerCase().includes('critical')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : String(b.severity).includes('2') || String(b.severity).toLowerCase().includes('high')
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {b.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-semibold">
                      P{b.priority}
                    </td>
                    <td className="py-2 px-3 text-slate-700 truncate max-w-[140px]">
                      {b.assigned_to || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBugs.length > 100 && (
            <p className="text-xs text-slate-400 text-right print:hidden">
              Showing first 100 of {filteredBugs.length} work items. Click "Export Report (.csv)" for the full dataset.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
