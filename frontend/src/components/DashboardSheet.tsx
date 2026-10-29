import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  Loader2,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertCircle,
  Plus
} from 'lucide-react';
import { AddDeploymentModal } from './AddDeploymentModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import type { DashboardExcelData, BugItem } from '../types';
import { api } from '../services/api';
import { Pagination } from './Pagination';

interface DashboardSheetProps {
  allBugs: BugItem[];
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  New: '#0284c7',
  Committed: '#f59e0b',
  Done: '#10b981',
  Total: '#1b365d'
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#3b82f6'
};

const QA_STATUS_COLORS: Record<string, string> = {
  Closed: '#10b981',
  Reopened: '#ef4444',
  'Pending QA': '#f59e0b'
};

const PRIORITY_COLORS: Record<string, string> = {
  P1: '#ef4444',
  P2: '#f97316',
  P3: '#3b82f6',
  P4: '#94a3b8'
};

const AGING_COLORS = {
  d0_7: '#10b981',
  d8_15: '#84cc16',
  d16_30: '#eab308',
  d31_45: '#f97316',
  d46_60: '#ef4444',
  d60_plus: '#991b1b'
};

export const DashboardSheet: React.FC<DashboardSheetProps> = ({
  allBugs,
  onNavigateToSheet1WithFilter,
}) => {
  const [data, setData] = useState<DashboardExcelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState('26-Oct-2026');
  const [showCharts, setShowCharts] = useState(true);
  const [showDailyTable, setShowDailyTable] = useState(false);
  const [dailyPage, setDailyPage] = useState<number>(1);
  const [dailyPageSize, setDailyPageSize] = useState<number>(15);
  const [isAddDeploymentOpen, setIsAddDeploymentOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const res = await api.getDashboardExcelData();
      setData(res);
      if (res.asOfDate) setAsOfDate(res.asOfDate);
    } catch (err) {
      console.error('Failed to load excel dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, allBugs]);

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
        <h3 className="font-bold text-slate-800 text-sm">Loading Project & QA Quality Dashboard...</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating live defect metrics, scorecard analytics, and release summaries</p>
      </div>
    );
  }

  // Chart data preppers
  const bugStatusPieData = data.bugStatus
    .filter(s => s.status !== 'Total')
    .map(s => ({
      name: s.status,
      value: s.liveCount !== undefined ? s.liveCount : s.count,
      color: STATUS_COLORS[s.status] || '#64748b'
    }));

  const severityBarData = data.severity.map(s => ({
    name: s.severity,
    count: s.liveCount !== undefined ? s.liveCount : s.count,
    fill: SEVERITY_COLORS[s.severity] || '#64748b'
  }));

  const devScoreChartData = data.developerScorecard.map(d => ({
    developer: d.developer,
    devAccuracy: parseFloat(d.devAccuracy) || 0,
    fixAccuracy: parseFloat(d.fixAccuracy) || 0,
    finalScore: parseFloat(d.finalScore) || 0
  }));

  const moduleQualityChartData = data.moduleQuality.map(m => ({
    module: m.module,
    progress: parseFloat(m.progress) || 0,
    accuracy: parseFloat(m.accuracy) || 0
  }));

  const deploymentDatesData = data.deploymentSummary.dates.map(d => ({
    date: d.date.replace(/-\d{4}$/, ''),
    bugs: d.bugsDeployed,
    tasks: d.tasksDeployed,
    total: d.total
  }));

  const bugQaStatusPieData = data.bugQaStatus.map(q => ({
    name: q.status,
    value: q.count,
    color: QA_STATUS_COLORS[q.status] || '#64748b'
  }));

  const bugPriorityBarData = data.bugPriority.map(p => ({
    priority: p.priority,
    count: p.count,
    fill: PRIORITY_COLORS[p.priority] || '#64748b'
  }));

  const devAgingData = data.devAgeingMatrix.rows.map(r => ({
    developer: r.developer,
    '0-7 Days': r.d0_7,
    '8-15 Days': r.d8_15,
    '16-30 Days': r.d16_30,
    '31-45 Days': r.d31_45,
    '46-60 Days': r.d46_60,
    '60+ Days': r.d60_plus
  }));

  const moduleAgingData = data.moduleAgeingMatrix.rows.map(r => ({
    module: r.module,
    '0-7 Days': r.d0_7,
    '8-15 Days': r.d8_15,
    '16-30 Days': r.d16_30,
    '31-45 Days': r.d31_45,
    '46-60 Days': r.d46_60,
    '60+ Days': r.d60_plus
  }));

  const uiVsFunctionalData = data.bugsCategory.rows.map(r => ({
    module: r.module,
    'UI Bugs': r.uiBugs,
    'Functional Bugs': r.functionalBugs,
    'Total Bugs': r.totalBugs
  }));

  const dailyTimelineData = (data.dailyTimeline || []).map(t => ({
    date: t.date.slice(5),
    raised: t.raised,
    reopened: t.reopened,
    closed: t.closed,
    pending: t.pending
  }));

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
          </div>

          {/* Visual Graphs Toggle */}
          <button
            type="button"
            onClick={() => setShowCharts(!showCharts)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
              showCharts
                ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
            <span>{showCharts ? 'Visual Charts (Visible)' : 'Show Charts'}</span>
          </button>
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
                    const displayVal = kpi.liveValue !== undefined ? kpi.liveValue : kpi.value;
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
                    const displayVal = kpi.liveValue !== undefined ? kpi.liveValue : kpi.value;
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
                    const countVal = row.liveCount !== undefined ? row.liveCount : row.count;
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
                    const countVal = row.liveCount !== undefined ? row.liveCount : row.count;
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

          {/* =========================================================================
              CHARTS 1 & 2: BUG STATUS & BUG SEVERITY GRAPHS (From Excel xl/charts/chart1.xml & chart2.xml)
              ========================================================================= */}
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {/* Chart 1: Bug Status (Donut / Pie) */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <PieIcon className="w-3.5 h-3.5 text-[#1b365d]" />
                    <span>Chart 1: Bug Status Distribution (Excel: $A$15:$B$17)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Pie Chart</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bugStatusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {bugStatusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} Bugs`, 'Count']} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Bug Severity (Bar/Column) */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <BarChart3 className="w-3.5 h-3.5 text-[#1b365d]" />
                    <span>Chart 2: Bug Severity (Excel: $D$15:$E$18)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Clustered Column</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityBarData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: any) => [`${value} Bugs`, 'Count']} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {severityBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Row 21 to 31: Developer Scorecard & Module Quality Tables */}
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

          {/* =========================================================================
              CHARTS 3 & 4: DEVELOPER ACCURACY & MODULE QUALITY (Excel: chart3.xml & chart4.xml)
              ========================================================================= */}
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {/* Chart 3: Developer Accuracy (Clustered Column) */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <BarChart3 className="w-3.5 h-3.5 text-[#1b365d]" />
                    <span>Chart 3: Developer Accuracy % vs Fix Accuracy % (Excel: $A$22:$D$31)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Multi-Bar Series</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={devScoreChartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="developer" angle={-25} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => [`${value}%`]} />
                      <Legend verticalAlign="top" height={30} iconType="rect" />
                      <Bar dataKey="devAccuracy" name="Dev Accuracy %" fill="#1b365d" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="fixAccuracy" name="Fix Accuracy %" fill="#0284c7" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="finalScore" name="Final Score %" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Module Progress & Quality (Clustered Column) */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <BarChart3 className="w-3.5 h-3.5 text-[#1b365d]" />
                    <span>Chart 4: Module Progress &amp; Quality (Excel: $F$22:$H$25)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Progress vs Accuracy</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleQualityChartData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="module" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => [`${value}%`]} />
                      <Legend verticalAlign="top" height={30} iconType="rect" />
                      <Bar dataKey="progress" name="Progress %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="accuracy" name="Accuracy %" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
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
              <div className="bg-slate-100 px-3 py-2 font-bold text-xs text-slate-800 border-b border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Deployment Summary — By Date</span>
                  <span className="text-[10px] bg-sky-100 text-[#1b365d] px-2 py-0.5 rounded font-normal">
                    Auto-Synced Azure + Manual Releases
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDeploymentOpen(true)}
                  className="px-2.5 py-1 bg-[#1b365d] hover:bg-[#234575] text-white text-[11px] font-semibold rounded flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Manually log a new deployment or release build"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Deployment
                </button>
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

          {/* =========================================================================
              CHARTS 5, 6, 7 & 8: DEPLOYMENT TIMELINE & QA STATUS CHARTS (Excel: chart5, 6, 7, 8)
              ========================================================================= */}
          {showCharts && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Chart 5: Bugs Deployed by Date */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="font-bold text-slate-800 text-xs truncate">
                    Chart 5: Bugs Deployed by Date
                  </div>
                  <span className="text-[10px] text-slate-400">Column</span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deploymentDatesData} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" tick={{ fontSize: 9 }} interval={1} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(value: any) => [`${value} Bugs`, 'Bugs Deployed']} />
                      <Bar dataKey="bugs" fill="#0284c7" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 6: Tasks Deployed by Date */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="font-bold text-slate-800 text-xs truncate">
                    Chart 6: Tasks Deployed by Date
                  </div>
                  <span className="text-[10px] text-slate-400">Column</span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deploymentDatesData} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" tick={{ fontSize: 9 }} interval={1} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(value: any) => [`${value} Tasks`, 'Tasks Deployed']} />
                      <Bar dataKey="tasks" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 7: Bug QA Status (Donut) */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="font-bold text-slate-800 text-xs truncate">
                    Chart 7: Bug QA Status
                  </div>
                  <span className="text-[10px] text-slate-400">Pie</span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bugQaStatusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        paddingAngle={3}
                      >
                        {bugQaStatusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} Bugs`, 'Count']} />
                      <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 8: Bug Priority Distribution */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="font-bold text-slate-800 text-xs truncate">
                    Chart 8: Bug Priority (P1-P4)
                  </div>
                  <span className="text-[10px] text-slate-400">Column</span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bugPriorityBarData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="priority" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => [`${value} Bugs`, 'Count']} />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {bugPriorityBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
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

          {/* =========================================================================
              CHART 9: DEVELOPMENT TEAM AGEING MATRIX (Excel: chart9.xml)
              ========================================================================= */}
          {showCharts && (
            <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs mt-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Clock className="w-3.5 h-3.5 text-[#1b365d]" />
                  <span>Chart 9: Development Team Ageing Matrix (Excel: $A$84:$H$90)</span>
                </div>
                <span className="text-[10px] text-slate-400">Stacked Horizontal Bar</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={devAgingData} layout="vertical" margin={{ top: 10, right: 20, left: 50, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="developer" type="category" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={30} iconType="rect" wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="0-7 Days" stackId="a" fill={AGING_COLORS.d0_7} />
                    <Bar dataKey="8-15 Days" stackId="a" fill={AGING_COLORS.d8_15} />
                    <Bar dataKey="16-30 Days" stackId="a" fill={AGING_COLORS.d16_30} />
                    <Bar dataKey="31-45 Days" stackId="a" fill={AGING_COLORS.d31_45} />
                    <Bar dataKey="46-60 Days" stackId="a" fill={AGING_COLORS.d46_60} />
                    <Bar dataKey="60+ Days" stackId="a" fill={AGING_COLORS.d60_plus} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

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

          {/* Table 3: Bugs Category (Dev Pending Bugs Only) (Row 103) & Charts 10 and 11 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Table 3 */}
            <div className="border border-slate-300 bg-white">
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

            {/* Chart 11: UI vs Functional Bugs by Module (Excel: chart11.xml) */}
            {showCharts && (
              <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <Layers className="w-3.5 h-3.5 text-[#1b365d]" />
                    <span>Chart 11: UI vs Functional Bugs by Module (Excel: $A$106:$D$110)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Clustered Column</span>
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={uiVsFunctionalData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="module" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={25} iconType="rect" wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="UI Bugs" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Functional Bugs" fill="#0284c7" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Chart 10: Module Ageing Matrix (Excel: chart10.xml) */}
          {showCharts && (
            <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs mt-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Clock className="w-3.5 h-3.5 text-[#3b703e]" />
                  <span>Chart 10: Module Ageing Matrix (Excel: $B$96:$H$101)</span>
                </div>
                <span className="text-[10px] text-slate-400">Stacked Column</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleAgingData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="module" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={30} iconType="rect" wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="0-7 Days" stackId="b" fill={AGING_COLORS.d0_7} />
                    <Bar dataKey="8-15 Days" stackId="b" fill={AGING_COLORS.d8_15} />
                    <Bar dataKey="16-30 Days" stackId="b" fill={AGING_COLORS.d16_30} />
                    <Bar dataKey="31-45 Days" stackId="b" fill={AGING_COLORS.d31_45} />
                    <Bar dataKey="46-60 Days" stackId="b" fill={AGING_COLORS.d46_60} />
                    <Bar dataKey="60+ Days" stackId="b" fill={AGING_COLORS.d60_plus} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>

        {/* =========================================================================
            SECTION 4: DAILY BUG INFLOW/OUTFLOW TIMELINE & RELEASE HIGHLIGHTS (Rows 135-209)
            ========================================================================= */}
        <div className="pt-4 border-t-2 border-slate-300">
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            DAILY BUG INFLOW &amp; OUTFLOW TIMELINE &amp; RELEASE STATS (Rows 135–209)
          </div>

          {/* KPI Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>P1 Critical Issues</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="font-mono text-xl font-bold text-slate-900">{data.p1Issues?.totalBugs || 169}</span>
                <span className="text-[11px] text-slate-500">Total P1</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-200 font-mono">
                <span className="text-emerald-700 font-semibold">{data.p1Issues?.fixed || 154} Fixed</span>
                <span className="text-rose-700 font-semibold">{data.p1Issues?.pending || 15} Pending</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                <span>15th Oct Release</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="font-mono text-xl font-bold text-slate-900">{data.oct15Release?.totalBugs || 60}</span>
                <span className="text-[11px] text-slate-500">Release Bugs</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-200 font-mono">
                <span className="text-emerald-700 font-semibold">{data.oct15Release?.closed || 47} Closed</span>
                <span className="text-amber-700 font-semibold">{data.oct15Release?.reopened || 7} Reopened</span>
                <span className="text-rose-700 font-semibold">{data.oct15Release?.pending || 6} Pending</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending from QA</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="font-mono text-xl font-bold text-amber-700">{data.quickStats?.pendingFromQa || 131}</span>
                <span className="text-[11px] text-slate-500">Bugs in QA queue</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                Awaiting validation after developer deployment
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pending from Dev</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="font-mono text-xl font-bold text-indigo-700">{data.quickStats?.pendingFromDev || 108}</span>
                <span className="text-[11px] text-slate-500">Bugs in Dev queue</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                Active &amp; committed bugs currently under fix
              </div>
            </div>
          </div>

          {/* Daily Inflow & Outflow Trend Area Chart */}
          {dailyTimelineData.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-2xs mt-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <TrendingUp className="w-3.5 h-3.5 text-[#1b365d]" />
                  <span>Daily Inflow &amp; Outflow Trend (July 14 – Oct 21)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDailyTable(!showDailyTable)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900"
                >
                  <span>{showDailyTable ? 'Hide Daily Table' : 'Show 73-Day Log Table'}</span>
                  {showDailyTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTimelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={5} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={30} iconType="rect" wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="raised" name="Raised Bugs" stroke="#0284c7" fill="#e0f2fe" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="closed" name="Closed Bugs" stroke="#10b981" fill="#d1fae5" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="pending" name="Pending Bugs" stroke="#f59e0b" fill="#fef3c7" fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Collapsible Daily Table */}
              {showDailyTable && (
                <div className="mt-4 border border-slate-200 rounded overflow-x-auto max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-[#2b5b84] text-white">
                      <tr>
                        <th className="py-1.5 px-3">Date</th>
                        <th className="py-1.5 px-3 text-right">Raised Bugs</th>
                        <th className="py-1.5 px-3 text-right">Re-Opened</th>
                        <th className="py-1.5 px-3 text-right">Closed Bugs</th>
                        <th className="py-1.5 px-3 text-right">Pending Bugs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.dailyTimeline || [])
                        .slice((dailyPage - 1) * dailyPageSize, dailyPage * dailyPageSize)
                        .map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 border-b border-slate-200">
                            <td className="py-1 px-3 font-mono font-medium">{row.date}</td>
                            <td className="py-1 px-3 font-mono text-right text-sky-800">{row.raised}</td>
                            <td className="py-1 px-3 font-mono text-right text-rose-700">{row.reopened}</td>
                            <td className="py-1 px-3 font-mono text-right text-emerald-700">{row.closed}</td>
                            <td className="py-1 px-3 font-mono text-right text-amber-700 font-bold">{row.pending}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={dailyPage}
                    totalItems={(data.dailyTimeline || []).length}
                    pageSize={dailyPageSize}
                    onPageChange={setDailyPage}
                    onPageSizeChange={(newSize) => {
                      setDailyPageSize(newSize);
                      setDailyPage(1);
                    }}
                    pageSizeOptions={[10, 15, 25, 50]}
                  />
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <AddDeploymentModal
        isOpen={isAddDeploymentOpen}
        onClose={() => setIsAddDeploymentOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};
