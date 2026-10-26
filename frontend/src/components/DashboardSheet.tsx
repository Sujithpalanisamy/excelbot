import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import type { DashboardExcelData, BugItem } from '../types';
import { api } from '../services/api';

interface DashboardSheetProps {
  allBugs: BugItem[];
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel: () => void;
}

export const DashboardSheet: React.FC<DashboardSheetProps> = ({
  allBugs,
  onNavigateToSheet1WithFilter,
  onDownloadExcel,
}) => {
  const [data, setData] = useState<DashboardExcelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'excel' | 'live'>('excel');
  const [asOfDate, setAsOfDate] = useState('26-Oct-2026');

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        const res = await api.getDashboardExcelData();
        if (isMounted) {
          setData(res);
          if (res.asOfDate) setAsOfDate(res.asOfDate);
        }
      } catch (err) {
        console.error('Failed to load excel dashboard data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, [allBugs]);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('PROJECT DEVELOPMENT & QA QUALITY DASHBOARD');
    lines.push('');
    lines.push('Project KPI,Value,Meaning,,Quality KPI,Value,Meaning');
    
    const maxKpiRows = Math.max(data.projectKpis.length, data.qualityKpis.length);
    for (let i = 0; i < maxKpiRows; i++) {
      const p = data.projectKpis[i] || { label: '', value: '', meaning: '' };
      const q = data.qualityKpis[i] || { label: '', value: '', meaning: '' };
      lines.push(`"${p.label}","${p.value}","${p.meaning}",,"${q.label}","${q.value}","${q.meaning}"`);
    }

    lines.push('');
    lines.push('Bug Status,Count,,Severity,Count');
    const maxStatusRows = Math.max(data.bugStatus.length, data.severity.length);
    for (let i = 0; i < maxStatusRows; i++) {
      const s = data.bugStatus[i] || { status: '', count: '' };
      const v = data.severity[i] || { severity: '', count: '' };
      lines.push(`"${s.status}","${s.count}",,"${v.severity}","${v.count}"`);
    }

    lines.push('');
    lines.push('Developer,Dev Accuracy %,Fix Accuracy %,Final Score %,,Module,Progress %,Accuracy %');
    const maxDevRows = Math.max(data.developerScorecard.length, data.moduleQuality.length);
    for (let i = 0; i < maxDevRows; i++) {
      const d = data.developerScorecard[i] || { developer: '', devAccuracy: '', fixAccuracy: '', finalScore: '' };
      const m = data.moduleQuality[i] || { module: '', progress: '', accuracy: '' };
      lines.push(`"${d.developer}","${d.devAccuracy}","${d.fixAccuracy}","${d.finalScore}",,"${m.module}","${m.progress}","${m.accuracy}"`);
    }

    lines.push('');
    lines.push('DEPLOYMENT TRACKER - DEPLOYMENT ANALYTICS');
    lines.push('Deployment Date,Bugs Deployed,Tasks Deployed,Total (Bugs + Tasks)');
    data.deploymentSummary.dates.forEach(row => {
      lines.push(`"${row.date}",${row.bugsDeployed},${row.tasksDeployed},${row.total}`);
    });
    lines.push(`"Total",${data.deploymentSummary.total.bugsDeployed},${data.deploymentSummary.total.tasksDeployed},${data.deploymentSummary.total.total}`);

    lines.push('');
    lines.push('AGEING & CATEGORY TABLES (Dev pending bugs only)');
    lines.push(`"As-of date:",${asOfDate}`);
    lines.push('Developer,0-7 Days,8-15 Days,16-30 Days,31-45 Days,46-60 Days,60+ Days,Total');
    data.devAgeingMatrix.rows.forEach(r => {
      lines.push(`"${r.developer}",${r.d0_7},${r.d8_15},${r.d16_30},${r.d31_45},${r.d46_60},${r.d60_plus},${r.total}`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet2_Dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Rendering Exact Sheet 2 Dashboard...</h3>
        <p className="text-xs text-slate-500 mt-1">Replicating Excel formulas, cell grids, and exact color palettes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs select-text">
      {/* Excel Sheet Action Toolbar */}
      <div className="bg-white border border-slate-300 px-4 py-2.5 rounded shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1b365d] text-white font-bold text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Sheet 2: Dashboard
            </span>
            <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Excel Grid: A1:H110
            </span>
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex items-center rounded border border-slate-300 p-0.5 bg-slate-100">
            <button
              type="button"
              onClick={() => setViewMode('excel')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                viewMode === 'excel'
                  ? 'bg-white text-[#1b365d] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Excel Exact Baseline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('live')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                viewMode === 'live'
                  ? 'bg-white text-[#1b365d] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Synced Azure DB
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 font-semibold text-xs transition-colors"
            title="Export exact CSV format matching Sheet 2"
          >
            <Download className="w-3.5 h-3.5 text-slate-700" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onDownloadExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b365d] hover:bg-[#152a4a] text-white rounded font-semibold text-xs transition-colors shadow-2xs"
            title="Download full 27-sheet Excel workbook"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Full .xlsx</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 font-semibold text-xs transition-colors"
            title="Print sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Spreadsheet Grid Container */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-6">

        {/* =========================================================================
            SECTION 1: PROJECT DEVELOPMENT & QA QUALITY DASHBOARD
            ========================================================================= */}
        <div>
          {/* Banner 1 (Row 1) */}
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            PROJECT DEVELOPMENT &amp; QA QUALITY DASHBOARD
          </div>

          {/* Row 3 to 12: Project KPI & Quality KPI Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
            {/* Left Table: Project KPI (Cols A, B, C) */}
            <div className="border border-slate-300 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                    <th className="py-1.5 px-3 border border-[#2b5b84] w-44">Project KPI</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right w-24">Value</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84]">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projectKpis.map((kpi, idx) => {
                    const displayVal = viewMode === 'live' && kpi.liveValue !== undefined ? kpi.liveValue : kpi.value;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-1.5 px-3 border border-slate-300 bg-[#d9e1f2] font-semibold text-slate-900">
                          {kpi.label}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900 relative">
                          {kpi.isProgress ? (
                            <div className="relative w-full h-full flex items-center justify-end">
                              <div 
                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-fuchsia-600 to-purple-600 opacity-60 rounded-xs"
                                style={{ width: `${kpi.progressPercent}%` }}
                              />
                              <span className="relative z-10 font-bold">{displayVal}</span>
                            </div>
                          ) : (
                            displayVal
                          )}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 text-slate-600 text-[11px]">
                          {kpi.meaning}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Right Table: Quality KPI (Cols E, F, G) */}
            <div className="border border-slate-300 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                    <th className="py-1.5 px-3 border border-[#2b5b84] w-52">Quality KPI</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right w-24">Value</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84]">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {data.qualityKpis.map((kpi, idx) => {
                    const displayVal = viewMode === 'live' && kpi.liveValue !== undefined ? kpi.liveValue : kpi.value;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-1.5 px-3 border border-slate-300 bg-[#d9e1f2] font-semibold text-slate-900">
                          {kpi.label}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900">
                          {displayVal}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 text-slate-600 text-[11px]">
                          {kpi.meaning}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 14 to 19: Bug Status & Severity Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Left: Bug Status (Cols A, B) */}
            <div className="border border-slate-300 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                    <th className="py-1.5 px-3 border border-[#2b5b84]">Bug Status</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right w-36">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bugStatus.map((row, idx) => {
                    const countVal = viewMode === 'live' && row.liveCount !== undefined ? row.liveCount : row.count;
                    const isTotal = row.isTotal || row.status === 'Total';
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-50 transition-colors ${isTotal ? 'bg-slate-100 font-bold border-t-2 border-slate-400' : ''}`}
                      >
                        <td className="py-1.5 px-3 border border-slate-300 text-slate-800">
                          {row.status}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900">
                          {countVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Right: Severity (Cols D, E) */}
            <div className="border border-slate-300 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                    <th className="py-1.5 px-3 border border-[#2b5b84]">Severity</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right w-36">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.severity.map((row, idx) => {
                    const countVal = viewMode === 'live' && row.liveCount !== undefined ? row.liveCount : row.count;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-3 border border-slate-300 text-slate-800">
                          {row.severity}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900">
                          {countVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 21 to 31: Developer Scorecard & Module Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Left: Developer Scorecard (Cols A, B, C, D) */}
            <div className="border border-slate-300 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                    <th className="py-1.5 px-3 border border-[#2b5b84]">Developer</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Dev Accuracy %</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Fix Accuracy %</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Final Score %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.developerScorecard.map((dev, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => onNavigateToSheet1WithFilter?.('developer', dev.developer)}
                          className="hover:underline text-left cursor-pointer hover:text-sky-800"
                          title={`View bugs assigned to ${dev.developer}`}
                        >
                          {dev.developer}
                        </button>
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                        {dev.devAccuracy}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                        {dev.fixAccuracy}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900">
                        {dev.finalScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right: Module Quality (Cols F, G, H) */}
            <div className="border border-slate-300 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                    <th className="py-1.5 px-3 border border-[#2b5b84]">Module</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Progress %</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Accuracy %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.moduleQuality.map((mod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => onNavigateToSheet1WithFilter?.('page', mod.module)}
                          className="hover:underline text-left cursor-pointer hover:text-sky-800"
                          title={`View bugs in module ${mod.module}`}
                        >
                          {mod.module}
                        </button>
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                        {mod.progress}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900">
                        {mod.accuracy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: DEPLOYMENT TRACKER — DEPLOYMENT ANALYTICS (Rows 40-76)
            ========================================================================= */}
        <div className="pt-4 border-t-2 border-slate-300">
          {/* Banner 2 (Row 40) */}
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            DEPLOYMENT TRACKER — DEPLOYMENT ANALYTICS
          </div>

          {/* Subtitle / How to read (Row 41) */}
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2.5 text-[11px] text-slate-600 italic">
            <span className="font-bold uppercase tracking-wider not-italic text-slate-700">HOW TO READ THIS: </span>
            each row is one real deployment date . &quot;Bugs Deployed&quot; / &quot;Tasks Deployed&quot; = how many went out that day. 
            The QA Status chart shows, of all bugs deployed so far, how many are Closed (verified fixed), Reopened (failed retest), or still Pending QA (not yet retested).
          </div>

          {/* Tables layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
            {/* Table 1: Deployment Summary — By Date (Cols A-D, spans 2 cols on lg) */}
            <div className="lg:col-span-2 border border-slate-300 bg-white">
              <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-300">
                Deployment Summary — By Date
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                    <th className="py-1.5 px-3 border border-[#2b5b84]">Deployment Date</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Bugs Deployed</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Tasks Deployed</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Total (Bugs + Tasks)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deploymentSummary.dates.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-1 px-3 border border-slate-300 font-mono text-slate-800">
                        {row.date}
                      </td>
                      <td className="py-1 px-3 border border-slate-300 font-mono text-right text-slate-800">
                        {row.bugsDeployed}
                      </td>
                      <td className="py-1 px-3 border border-slate-300 font-mono text-right text-slate-800">
                        {row.tasksDeployed}
                      </td>
                      <td className="py-1 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row (Row 62) */}
                  <tr className="bg-[#e7e6e6] font-bold border-t-2 border-slate-400">
                    <td className="py-1.5 px-3 border border-slate-300 text-slate-900">
                      Total
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                      {data.deploymentSummary.total.bugsDeployed}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                      {data.deploymentSummary.total.tasksDeployed}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-900">
                      {data.deploymentSummary.total.total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column: QA Status & Priority Tables */}
            <div className="space-y-4">
              {/* Table 2: Bug QA Status (All Deployed Bugs) (Row 64) */}
              <div className="border border-slate-300 bg-white">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-300">
                  Bug QA Status (All Deployed Bugs)
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                      <th className="py-1.5 px-3 border border-[#2b5b84]">QA Status</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bugQaStatus.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-800">
                          {row.status}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900">
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table 3: Bug Priority (Deployed Bugs Only) (Row 70) */}
              <div className="border border-slate-300 bg-white">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-300">
                  Bug Priority (Deployed Bugs Only)
                </div>
                <div className="bg-slate-50 px-3 py-1 text-[10px] text-slate-500 italic border-b border-slate-200">
                  P1 = most urgent, P4 = least. Deployed bugs only, not the whole Bug Tracker backlog.
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                      <th className="py-1.5 px-3 border border-[#2b5b84]">Priority</th>
                      <th className="py-1.5 px-3 border border-[#2b5b84] text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bugPriority.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-800">
                          {row.priority}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900">
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3: AGEING & CATEGORY TABLES (Rows 77-110)
            ========================================================================= */}
        <div className="pt-4 border-t-2 border-slate-300">
          {/* Banner 3 (Row 77) */}
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            AGEING &amp; CATEGORY TABLES (Dev pending bugs only: Azure State = New / Approved / Committed)
          </div>

          {/* Subtitle (Row 78) */}
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic flex items-center justify-between flex-wrap gap-2">
            <span>
              Ageing is measured from &apos;Date Raised&apos; on the Bug Tracker to the as of date below. Type a date in B75, or enter =TODAY() to keep it always current.
            </span>
            <div className="inline-flex items-center gap-1.5 not-italic">
              <span className="font-bold text-slate-700">As-of date:</span>
              <input 
                type="text" 
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="bg-[#fff2cc] border border-amber-300 px-2.5 py-0.5 rounded font-mono font-bold text-slate-900 text-xs text-center w-28 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Table 1: Development Team Ageing Matrix (Dev Pending Bugs Only) (Row 82) */}
          <div className="border border-slate-300 bg-white mt-4">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-300">
              Development Team Ageing Matrix (Dev Pending Bugs Only)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                    <th className="py-1.5 px-3 border border-[#2b5b84]">Developer</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-center">0-7 Days</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-center">8-15 Days</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-center">16-30 Days</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-center">31-45 Days</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-center">46-60 Days</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-center">60+ Days</th>
                    <th className="py-1.5 px-3 border border-[#2b5b84] text-center bg-[#244b6e]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.devAgeingMatrix.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900">
                        {row.developer}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d0_7}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d8_15}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d16_30}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d31_45}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d46_60}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d60_plus}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-center text-slate-900 bg-[#fff2cc]">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row (Row 91) */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td className="py-1.5 px-3 border border-slate-300 text-slate-900">
                      Total
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.devAgeingMatrix.total.d0_7}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.devAgeingMatrix.total.d8_15}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.devAgeingMatrix.total.d16_30}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.devAgeingMatrix.total.d31_45}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.devAgeingMatrix.total.d46_60}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.devAgeingMatrix.total.d60_plus}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900 bg-[#fff2cc]">
                      {data.devAgeingMatrix.total.total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Module Ageing Matrix (Dev Pending Bugs Only) (Row 94) */}
          <div className="border border-slate-300 bg-white mt-4">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-300">
              Module Ageing Matrix (Dev Pending Bugs Only)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#3b703e] text-white font-bold text-xs uppercase">
                    <th className="py-1.5 px-3 border border-[#3b703e]">Module</th>
                    <th className="py-1.5 px-3 border border-[#3b703e] text-center">0-7 Days</th>
                    <th className="py-1.5 px-3 border border-[#3b703e] text-center">8-15 Days</th>
                    <th className="py-1.5 px-3 border border-[#3b703e] text-center">16-30 Days</th>
                    <th className="py-1.5 px-3 border border-[#3b703e] text-center">31-45 Days</th>
                    <th className="py-1.5 px-3 border border-[#3b703e] text-center">46-60 Days</th>
                    <th className="py-1.5 px-3 border border-[#3b703e] text-center">60+ Days</th>
                    <th className="py-1.5 px-3 border border-[#3b703e] text-center bg-[#2f5932]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.moduleAgeingMatrix.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900">
                        {row.module}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d0_7}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d8_15}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d16_30}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d31_45}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d46_60}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                        {row.d60_plus}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-center text-slate-900">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row (Row 101) */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                    <td className="py-1.5 px-3 border border-slate-300 text-slate-900">
                      Total
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.moduleAgeingMatrix.total.d0_7}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.moduleAgeingMatrix.total.d8_15}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.moduleAgeingMatrix.total.d16_30}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.moduleAgeingMatrix.total.d31_45}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.moduleAgeingMatrix.total.d46_60}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.moduleAgeingMatrix.total.d60_plus}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                      {data.moduleAgeingMatrix.total.total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: Bugs Category (Dev Pending Bugs Only) (Row 103) */}
          <div className="border border-slate-300 bg-white mt-4 max-w-xl">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-xs text-slate-800 border-b border-slate-300">
              Bugs Category (Dev Pending Bugs Only)
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                  <th className="py-1.5 px-3 border border-[#2b5b84]">Module</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-center">UI Bugs</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-center">Functional Bugs</th>
                  <th className="py-1.5 px-3 border border-[#2b5b84] text-center">Total Bugs</th>
                </tr>
              </thead>
              <tbody>
                {data.bugsCategory.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900">
                      {row.module}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                      {row.uiBugs}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-800">
                      {row.functionalBugs}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-center text-slate-900">
                      {row.totalBugs}
                    </td>
                  </tr>
                ))}
                {/* Total Row (Row 110) */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td className="py-1.5 px-3 border border-slate-300 text-slate-900">
                    Total
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                    {data.bugsCategory.total.uiBugs}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                    {data.bugsCategory.total.functionalBugs}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-center text-slate-900">
                    {data.bugsCategory.total.totalBugs}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};
