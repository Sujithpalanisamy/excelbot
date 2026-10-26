import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  ShieldAlert, 
  Download, 
  Activity, 
  Boxes,
  Loader2
} from 'lucide-react';
import type { ReportSummary, BugItem } from '../types';
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
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      try {
        const data = await api.getReportSummary();
        if (isMounted) setSummary(data);
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchReport();
    return () => { isMounted = false; };
  }, [allBugs]);

  const totalBugs = summary?.total_bugs || allBugs.length;
  const openCount = summary?.open_bugs || 0;
  const activeCount = summary?.active_bugs || 0;
  const closedCount = (summary?.closed_bugs || 0) + (summary?.resolved_bugs || 0);
  const criticalCount = summary?.critical_severity_bugs || 0;
  const reopenRate = summary?.reopen_rate_percent ?? 0;
  const uiPercent = summary?.ui_percent ?? 0;
  const functionalPercent = summary?.functional_percent ?? 0;
  const fixRate = summary?.fix_rate_percent ?? 0;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Computing Executive Dashboard Metrics...</h3>
        <p className="text-xs text-slate-400 mt-1">Aggregating live defect status and quality formulas directly from database</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900">
                Sheet 2: Executive Development &amp; QA Quality Dashboard
              </h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Computed Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Exact formula translation from Sheet 2 of the Excel Tracker • Real-time KPIs, Reopen Analysis &amp; Module Health
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onDownloadExcel}
            className="h-9 btn-secondary inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-md shadow-2xs text-slate-700 hover:text-sky-700 hover:border-sky-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Download Full Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total & Fix Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fix Accuracy / Completion</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">{fixRate}%</span>
            <span className="text-xs text-slate-500">({closedCount} of {totalBugs} bugs closed)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, fixRate)}%` }} />
          </div>
        </div>

        {/* Card 2: Reopen Rate % */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reopen Rate</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-display ${reopenRate > 8 ? 'text-rose-700' : reopenRate > 4 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {reopenRate}%
            </span>
            <span className="text-xs text-slate-500">({summary?.reopen_count ?? 0} reworked)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Formula: <code>SUM(Reopens) / Total Bugs</code> (Target &lt; 5%)
          </p>
        </div>

        {/* Card 3: UI vs Functional Ratio */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Defect Classification</span>
            <Boxes className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-xl font-bold font-display text-sky-700">{uiPercent}%</span>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">UI Bugs</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-xl font-bold font-display text-indigo-700">{functionalPercent}%</span>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Functional</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 flex overflow-hidden">
            <div className="bg-sky-500 h-2 transition-all" style={{ width: `${uiPercent}%` }} title={`UI: ${uiPercent}%`} />
            <div className="bg-indigo-500 h-2 transition-all" style={{ width: `${functionalPercent}%` }} title={`Functional: ${functionalPercent}%`} />
          </div>
        </div>

        {/* Card 4: Critical & High Severity */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Critical &amp; High Priority</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-display text-rose-700">
              {criticalCount}
            </span>
            <span className="text-xs text-slate-500">
              ({totalBugs > 0 ? ((criticalCount / totalBugs) * 100).toFixed(1) : 0}% of all defects)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
              P1 Critical: {summary?.priority_breakdown?.['Priority 1'] || 0}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
              P2 High: {summary?.priority_breakdown?.['Priority 2'] || 0}
            </span>
          </div>
        </div>
      </div>

      {/* State & Severity Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* State Breakdown Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold font-display text-slate-900 mb-4 flex items-center justify-between">
            <span>Defect Status Lifecycle Distribution</span>
            <span className="text-xs font-normal text-slate-500">Total: {totalBugs}</span>
          </h3>

          <div className="space-y-3">
            {[
              { label: 'New / Proposed', count: openCount, color: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50' },
              { label: 'Active / Committed', count: activeCount, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Resolved / Fixed', count: summary?.resolved_bugs || 0, color: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50' },
              { label: 'Closed / Verified (Done)', count: summary?.closed_bugs || 0, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
            ].map((item, idx) => {
              const pct = totalBugs > 0 ? ((item.count / totalBugs) * 100).toFixed(1) : '0';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-mono text-slate-600 font-bold">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`${item.color} h-2 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Breakdown Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold font-display text-slate-900 mb-4 flex items-center justify-between">
            <span>Defect Severity Spectrum</span>
            <span className="text-xs font-normal text-slate-500">P1 to P4 Matrix</span>
          </h3>

          <div className="space-y-3">
            {[
              { label: '1 - Critical (Blocker)', count: summary?.severity_breakdown?.['1 - Critical'] || 0, color: 'bg-rose-600' },
              { label: '2 - High', count: summary?.severity_breakdown?.['2 - High'] || 0, color: 'bg-orange-500' },
              { label: '3 - Medium', count: summary?.severity_breakdown?.['3 - Medium'] || 0, color: 'bg-sky-500' },
              { label: '4 - Low', count: summary?.severity_breakdown?.['4 - Low'] || 0, color: 'bg-slate-400' },
            ].map((item, idx) => {
              const pct = totalBugs > 0 ? ((item.count / totalBugs) * 100).toFixed(1) : '0';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-mono text-slate-600 font-bold">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className={`${item.color} h-2 rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Module-Wise Health & Defect Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold font-display text-slate-900">
              Module-Wise Defect Matrix (HRMS Pages)
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated defect volume, open backlog, and critical bug density per application page
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">HRMS Module / Page</th>
                <th className="py-2.5 px-3 text-center">Total Defects</th>
                <th className="py-2.5 px-3 text-center">Open Backlog</th>
                <th className="py-2.5 px-3 text-center">Active Work</th>
                <th className="py-2.5 px-3 text-center">Resolved / Done</th>
                <th className="py-2.5 px-3 text-center">Critical Severity</th>
                <th className="py-2.5 px-4 text-center">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(summary?.page_breakdown || []).map((page, idx) => {
                const isHighCrit = page.critical_bugs > 2;
                const isBacklogHigh = page.open_bugs > 5;
                const statusBadge = isHighCrit ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <ShieldAlert className="w-3 h-3 text-rose-600" /> High Critical
                  </span>
                ) : isBacklogHigh ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> Backlog Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Stable
                  </span>
                );

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      <button
                        type="button"
                        onClick={() => onNavigateToSheet1WithFilter?.('page', page.page_name)}
                        className="text-left font-semibold text-slate-900 hover:text-sky-700 hover:underline cursor-pointer transition-colors"
                        title={`Filter Sheet 1 for ${page.page_name}`}
                      >
                        {page.page_name}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      {page.total_bugs}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-sky-700 font-semibold">
                      {page.open_bugs}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-700 font-semibold">
                      {page.active_bugs}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-semibold">
                      {page.closed_bugs}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {page.critical_bugs > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {page.critical_bugs}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {statusBadge}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
