import React, { useState, useEffect } from 'react';
import {
Download, 
  Printer, 
  ListFilter, 
  Search, 
  Loader2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import type { ListsData } from '../types';
import { api } from '../services/api';

interface ListsSheetProps {
  onDownloadExcel?: () => void;
}

export const ListsSheet: React.FC<ListsSheetProps> = ({
}) => {
  const [data, setData] = useState<ListsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchLists = async () => {
      try {
        const res = await api.getListsData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load lists data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLists();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('MASTER LISTS & DATA VALIDATION DICTIONARIES');
    lines.push('');
    lines.push('Category,Values');
    lines.push(`"Complexity","${data.complexities.join('; ')}"`);
    lines.push(`"Page Status","${data.pageStatuses.join('; ')}"`);
    lines.push(`"Severity","${data.severities.join('; ')}"`);
    lines.push(`"Priority","${data.priorities.join('; ')}"`);
    lines.push(`"Bug Status","${data.bugStatuses.join('; ')}"`);
    lines.push(`"Root Cause","${data.rootCauses.join('; ')}"`);
    lines.push(`"Component","${data.components.join('; ')}"`);
    lines.push(`"Bug Type","${data.bugTypes.join('; ')}"`);
    lines.push(`"Developer","${data.developers.join('; ')}"`);
    lines.push(`"QA Team","${data.qaTeam.join('; ')}"`);
    lines.push(`"Sprints","${data.sprints.join('; ')}"`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet14_Lists_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 14: Lists...</h3>
        <p className="text-xs text-slate-500 mt-1">Reading master dropdown lists and data validation rules</p>
      </div>
    );
  }

  // Calculate max length to render exact spreadsheet columns
  const maxRows = Math.max(
    data.complexities.length,
    data.pageStatuses.length,
    data.severities.length,
    data.priorities.length,
    data.bugStatuses.length,
    data.rootCauses.length,
    data.components.length,
    data.bugTypes.length,
    data.developers.length,
    data.qaTeam.length,
    data.sprints.length
  );

  const columns = [
    { title: 'Complexity', values: data.complexities, color: 'text-slate-800' },
    { title: 'Page Status', values: data.pageStatuses, color: 'text-blue-700' },
    { title: 'Severity', values: data.severities, color: 'text-rose-700' },
    { title: 'Priority', values: data.priorities, color: 'text-amber-700' },
    { title: 'Bug Status', values: data.bugStatuses, color: 'text-emerald-700' },
    { title: 'Root Cause', values: data.rootCauses, color: 'text-slate-700' },
    { title: 'Component', values: data.components, color: 'text-indigo-700' },
    { title: 'Bug Type', values: data.bugTypes, color: 'text-slate-800' },
    { title: 'Developer', values: data.developers, color: 'text-purple-700 font-semibold' },
    { title: 'QA Team', values: data.qaTeam, color: 'text-teal-700 font-semibold' },
    { title: 'Sprint', values: data.sprints, color: 'text-blue-600' }
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-blue-600" />
            <span>SHEET 14: MASTER LISTS</span>
          </div>
          <span className="text-xs text-slate-500">
            Dropdown Dictionaries & Data Validation Tables
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Validation Lists</span>
            <ListFilter className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">11</div>
          <div className="text-[11px] text-slate-500 mt-1">Master enum dictionaries</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Active Developers</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{data.developers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Recognized development resources</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>QA Engineers</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">{data.qaTeam.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Quality validation team</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Active Sprints</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{data.sprints.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Release sprint iterations</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search any master value (e.g. Critical, KiranKumar, Sprint 4)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-blue-500"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Authentic Multi-Column Spreadsheet Table */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="bg-[#1b365d] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-300" />
            <span>EXCEL SHEET 14 — MASTER DATA VALIDATION DICTIONARIES</span>
          </div>
          <span className="text-[11px] font-normal text-slate-300">
            Source dropdowns for Bug Tracker, Page Tracker, and Scorecards
          </span>
        </div>

        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#1B365D] text-white font-bold sticky top-0 z-10 select-none shadow-sm text-[11px]">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="py-2.5 px-3 border-r border-[#2C4D75] whitespace-nowrap">
                    {col.title.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Array.from({ length: maxRows }).map((_, rIdx) => (
                <tr 
                  key={rIdx}
                  className="hover:bg-blue-50/60 transition-colors group text-slate-700 even:bg-slate-50/50"
                >
                  {columns.map((col, cIdx) => {
                    const val = col.values[rIdx] || '';
                    const isMatched = searchTerm && val.toLowerCase().includes(searchTerm.toLowerCase());

                    return (
                      <td 
                        key={cIdx} 
                        className={`py-2 px-3 border-r border-slate-200 whitespace-nowrap ${
                          isMatched ? 'bg-amber-100 font-bold' : ''
                        }`}
                      >
                        {val ? (
                          <span className={col.color}>{val}</span>
                        ) : (
                          <span className="text-slate-300 text-[10px]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {/* Soft Yellow Total Row */}
            <tfoot className="bg-[#FFF2CC] font-bold text-slate-900 border-t-2 border-slate-400 text-[11px]">
              <tr>
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="py-2 px-3 border-r border-amber-300">
                    {col.values.length} items
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
