import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import type { ReopenAnalysisData } from '../types';
import { api } from '../services/api';

interface ReopenAnalysisSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel: () => void;
}

export const ReopenAnalysisSheet: React.FC<ReopenAnalysisSheetProps> = ({
  onNavigateToSheet1WithFilter,
  onDownloadExcel,
}) => {
  const [data, setData] = useState<ReopenAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReopenData = async () => {
      try {
        const res = await api.getReopenAnalysisData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load reopen analysis data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchReopenData();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('REOPEN ANALYSIS — Fix Accuracy & Rework Ratio Per Developer');
    lines.push('');
    lines.push('Fix Developer,Bugs Assigned,Closed Bugs,Reopened Count,Rework %,Critical Reopens,Fix Accuracy %,Action Required');
    
    data.rows.forEach(r => {
      lines.push(`"${r.developer}",${r.bugsAssigned},${r.closedBugs},${r.reopenedCount},"${r.reworkPct}",${r.criticalReopens},"${r.fixAccuracyPct}","${r.actionRequired}"`);
    });

    lines.push(`"TOTAL",${data.totalAssigned},${data.totalClosed},${data.totalReopened},"${data.totalReworkPct}",${data.totalCritReopens},"${data.totalFixAccuracy}",""`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet10_Reopen_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 10: Reopen Analysis...</h3>
        <p className="text-xs text-slate-500 mt-1">Calculating Developer Rework Rates and Fix Accuracy Percentages</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>SHEET 10: REOPEN ANALYSIS</span>
          </div>
          <span className="text-xs text-slate-500">
            Fix Accuracy & Rework Ratio Per Developer
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
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Assigned</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{data.totalAssigned}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all developers</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Closed</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{data.totalClosed}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Resolved defects</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reopened Count</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{data.totalReopened}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">Returned by QA</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Critical Reopens</div>
          <div className="text-xl font-bold text-red-700 mt-1">{data.totalCritReopens}</div>
          <div className="text-[10px] text-red-500 mt-0.5">High / Critical severity</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Rework %</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{data.totalReworkPct}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Target &lt; 5.0%</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fix Accuracy %</div>
          <div className="text-xl font-bold text-indigo-700 mt-1">{data.totalFixAccuracy}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">1st pass fix rate</div>
        </div>
      </div>

      {/* Fix Accuracy & Rework Ratio Chart */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1b365d]" />
            <span className="font-bold text-slate-800 text-xs">Developer Fix Accuracy % vs Rework Rate %</span>
          </div>
          <span className="text-[10px] text-slate-500">Auto-calculated from Reopen Analysis Matrix</span>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.rows.map(r => ({
              developer: r.developer,
              fixAccuracy: parseFloat(r.fixAccuracyPct) || 0,
              rework: parseFloat(r.reworkPct) || 0,
              reopened: r.reopenedCount
            }))} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="developer" angle={-25} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: any) => [`${value}%`]} />
              <Legend verticalAlign="top" height={30} iconType="rect" />
              <Bar dataKey="fixAccuracy" name="Fix Accuracy %" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="rework" name="Rework %" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            REOPEN ANALYSIS — FIX ACCURACY & REWORK RATIO PER DEVELOPER
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">FORMULA LOGIC: </span>
            Rework % = Reopened Count / Bugs Assigned. Fix Accuracy % = MAX(0, 1 - Rework %). 
            Action Required is automatically evaluated from Fix Accuracy (≥95%: Stable, ≥85%: Monitor, &lt;85%: Code Review Required).
          </div>
        </div>

        {/* Excel Table */}
        <div className="border border-slate-300 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                <th className="py-2 px-3 border border-[#2b5b84]">Fix Developer</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Bugs Assigned</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Closed Bugs</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Reopened Count</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Rework %</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Critical Reopens</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#234b6d]">Fix Accuracy %</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-center">Action Required</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, idx) => {
                const accVal = parseFloat(r.fixAccuracyPct);
                let accClass = "text-emerald-700 font-bold";
                if (accVal < 85) accClass = "text-rose-700 font-bold bg-rose-50";
                else if (accVal < 95) accClass = "text-amber-700 font-bold bg-amber-50";

                let actionBadge = "bg-slate-100 text-slate-600 border-slate-200";
                let actionIcon = null;
                if (r.actionRequired.includes('Stable')) {
                  actionBadge = "bg-emerald-50 text-emerald-800 border-emerald-300";
                  actionIcon = <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1" />;
                } else if (r.actionRequired.includes('Monitor')) {
                  actionBadge = "bg-amber-50 text-amber-800 border-amber-300";
                  actionIcon = <AlertTriangle className="w-3 h-3 text-amber-600 inline mr-1" />;
                } else if (r.actionRequired.includes('Review')) {
                  actionBadge = "bg-rose-50 text-rose-800 border-rose-300";
                  actionIcon = <ShieldAlert className="w-3 h-3 text-rose-600 inline mr-1" />;
                }

                return (
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
                      {r.bugsAssigned}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.closedBugs}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.reopenedCount > 0 ? (
                        <span className="font-bold text-rose-600">{r.reopenedCount}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.reworkPct}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.criticalReopens > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-100 px-1 rounded">{r.criticalReopens}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className={`py-1.5 px-3 border border-slate-300 font-mono text-right ${accClass}`}>
                      {r.fixAccuracyPct}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 text-center">
                      <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border font-medium ${actionBadge}`}>
                        {actionIcon}
                        {r.actionRequired}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-[#fff2cc] font-bold border-t-2 border-slate-400">
                <td className="py-2 px-3 border border-slate-400 text-slate-900 uppercase">
                  TOTAL / AVERAGE
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-900">
                  {data.totalAssigned}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-900">
                  {data.totalClosed}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-rose-700">
                  {data.totalReopened}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-amber-800">
                  {data.totalReworkPct}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-red-800">
                  {data.totalCritReopens}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-emerald-800 bg-[#ffe599]">
                  {data.totalFixAccuracy}
                </td>
                <td className="py-2 px-3 border border-slate-400 text-center text-xs text-slate-700 italic">
                  Overall Target: 95%+
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend / Guidance Footer */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">Quality Thresholds:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span><strong>Fix Quality High (Stable):</strong> Accuracy &ge; 95%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span><strong>Monitor (Moderate Rework):</strong> Accuracy between 85% - 94.9%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span><strong>Code Review Required:</strong> Accuracy &lt; 85%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
