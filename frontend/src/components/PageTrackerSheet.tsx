import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Layers,
  Search,
  Loader2,
  Filter
} from 'lucide-react';
import type { PageTrackerData } from '../types';
import { api } from '../services/api';
import { Pagination } from './Pagination';

interface PageTrackerSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel?: () => void;
}

export const PageTrackerSheet: React.FC<PageTrackerSheetProps> = ({
  onNavigateToSheet1WithFilter,
}) => {
  const [data, setData] = useState<PageTrackerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterComplexity, setFilterComplexity] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    let isMounted = true;
    const fetchPageTracker = async () => {
      try {
        const res = await api.getPageTrackerData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load page tracker data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPageTracker();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('PAGE TRACKER — Page & Module Delivery Tracking Matrix');
    lines.push('');
    lines.push('Page ID,Module,Release,Page Name,Complexity,UI Dev,API Dev,SP Dev,DB Dev,Binding Dev,QA,Planned Start,Planned End,Actual End,Overall Status,First Pass?,Progress %');
    
    data.pages.forEach(p => {
      lines.push(`${p.pageId},"${p.module}","${p.release}","${p.pageName}","${p.complexity}","${p.uiDev}","${p.apiDev}","${p.spDev}","${p.dbDev}","${p.bindingDev}","${p.qa}","${p.plannedStart}","${p.plannedEnd}","${p.actualEnd}","${p.overallStatus}","${p.firstPass}","${p.progress}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet3_Page_Tracker_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 3: Page Tracker...</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating 250+ HRMS screens, developer assignments, and delivery milestones</p>
      </div>
    );
  }

  const filteredPages = data.pages.filter(p => {
    const matchesSearch = !searchTerm || 
      p.pageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.uiDev.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apiDev.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.qa.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMod = filterModule === 'all' || p.module === filterModule;
    const matchesComp = filterComplexity === 'all' || p.complexity.toLowerCase() === filterComplexity.toLowerCase();

    return matchesSearch && matchesMod && matchesComp;
  });

  const paginatedPages = filteredPages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>SHEET 3: PAGE TRACKER</span>
          </div>
          <span className="text-xs text-slate-500">
            Page & Module Delivery Tracking Matrix
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Pages</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{data.totalPages}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across {data.modules.length} modules</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed Pages</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{data.completedPages}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">{data.avgProgress} completion rate</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Progress</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{data.inProgressPages}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Pending completion</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Modules</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{data.modules.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">EDM, ESS, Leave, Roster</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">First Pass Rate</div>
          <div className="text-xl font-bold text-indigo-700 mt-1">45.7%</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">Pass QA first cycle</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">{data.avgProgress}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Delivery milestone</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Page Name, Module, Developer, QA..."
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Module:</span>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Modules</option>
              {data.modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Complexity:</span>
            <select
              value={filterComplexity}
              onChange={(e) => setFilterComplexity(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Complexities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredPages.length} of {data.totalPages} pages
          </span>
        </div>
      </div>

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            PAGE TRACKER — PAGE & MODULE DELIVERY TRACKING MATRIX
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">INSTRUCTIONS: </span>
            Click on any Page Name to view its defects in Sheet 1: All Bugs. Shows end-to-end task assignment across UI, API, SP, DB, and UI Binding.
          </div>
        </div>

        {/* Excel Table */}
        <div className="border border-slate-300 overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#2b5b84] text-white font-bold uppercase shadow-xs">
                <th className="py-2 px-3 border border-[#2b5b84]">S.No</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Module</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Release</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Page Name</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Complexity</th>
                <th className="py-2 px-3 border border-[#2b5b84]">UI Dev</th>
                <th className="py-2 px-3 border border-[#2b5b84]">API Dev</th>
                <th className="py-2 px-3 border border-[#2b5b84]">SP Dev</th>
                <th className="py-2 px-3 border border-[#2b5b84]">DB Dev</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Binding Dev</th>
                <th className="py-2 px-3 border border-[#2b5b84]">QA</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Start</th>
                <th className="py-2 px-3 border border-[#2b5b84]">End</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Status</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#234b6d]">Progress %</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPages.map((p) => (
                <tr key={p.pageId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-1.5 px-2 border border-slate-300 font-mono text-center text-slate-600 bg-slate-50">
                    {p.pageId}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-semibold text-slate-800 bg-[#d9e1f2]">
                    {p.module}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 font-mono text-[11px] text-slate-600">
                    {p.release}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900">
                    <button
                      type="button"
                      onClick={() => onNavigateToSheet1WithFilter?.('page', p.pageName)}
                      className="hover:underline text-left cursor-pointer hover:text-sky-800 font-semibold"
                      title={`Filter Sheet 1 for ${p.pageName}`}
                    >
                      {p.pageName}
                    </button>
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      p.complexity.toLowerCase() === 'high' ? 'bg-rose-100 text-rose-800' :
                      p.complexity.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {p.complexity}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 text-slate-700">{p.uiDev}</td>
                  <td className="py-1.5 px-2 border border-slate-300 text-slate-700">{p.apiDev}</td>
                  <td className="py-1.5 px-2 border border-slate-300 text-slate-700">{p.spDev}</td>
                  <td className="py-1.5 px-2 border border-slate-300 text-slate-700">{p.dbDev}</td>
                  <td className="py-1.5 px-2 border border-slate-300 text-slate-700">{p.bindingDev}</td>
                  <td className="py-1.5 px-2 border border-slate-300 text-slate-700">{p.qa}</td>
                  <td className="py-1.5 px-2 border border-slate-300 font-mono text-[11px] text-slate-600">{p.plannedStart}</td>
                  <td className="py-1.5 px-2 border border-slate-300 font-mono text-[11px] text-slate-600">{p.plannedEnd}</td>
                  <td className="py-1.5 px-2 border border-slate-300">
                    <span className={`inline-block px-2 py-0.5 text-[11px] rounded font-semibold ${
                      p.overallStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {p.overallStatus}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right font-bold text-slate-900 bg-[#fff2cc]">
                    {p.progress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredPages.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[15, 25, 50, 100]}
        />

      </div>
    </div>
  );
};
