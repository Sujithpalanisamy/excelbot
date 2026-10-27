import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Layers,
  Loader2,
  Sliders,
  ShieldCheck,
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
import type { ModuleQualityData } from '../types';
import { api } from '../services/api';

interface ModuleQualitySheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel?: () => void;
}

export const ModuleQualitySheet: React.FC<ModuleQualitySheetProps> = ({
  onNavigateToSheet1WithFilter,
}) => {
  const [data, setData] = useState<ModuleQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchModuleQuality = async () => {
      try {
        const res = await api.getModuleQualityData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load module quality data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchModuleQuality();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('MODULE QUALITY — Defect Density Matrix Per HRMS Module');
    lines.push('');
    lines.push('Module,Pages,Completed Pages,Average Progress %,Bugs,Critical,High,Medium,Low,Internal Bugs,Module Accuracy %');
    
    data.rows.forEach(r => {
      lines.push(`"${r.module}",${r.pages},${r.completedPages},"${r.averageProgress}",${r.bugs},${r.critical},${r.high},${r.medium},${r.low},${r.internalBugs},"${r.moduleAccuracy}"`);
    });

    lines.push(`"TOTAL",${data.total.pages},${data.total.completedPages},"${data.total.averageProgress}",${data.total.bugs},${data.total.critical},${data.total.high},${data.total.medium},${data.total.low},${data.total.internalBugs},"${data.total.moduleAccuracy}"`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet12_Module_Quality_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 12: Module Quality...</h3>
        <p className="text-xs text-slate-500 mt-1">Calculating Defect Density and Severity-Weighted Module Accuracy</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>SHEET 12: MODULE QUALITY</span>
          </div>
          <span className="text-xs text-slate-500">
            Defect Density & Delivery Accuracy Matrix per HRMS Module
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
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Modules</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{data.rows.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">HRMS core suites</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Pages</div>
          <div className="text-xl font-bold text-indigo-700 mt-1">{data.total.pages}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">{data.total.completedPages} completed</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Delivery</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{data.total.averageProgress}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Completion rate</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Defects</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{data.total.bugs}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Azure & internal bugs</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Critical / High</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{data.total.critical + data.total.high}</div>
          <div className="text-[10px] text-rose-500 mt-0.5">{data.total.critical} crit, {data.total.high} high</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Accuracy</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{data.total.moduleAccuracy}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Weighted defect density</div>
        </div>
      </div>

      {/* Module Defect Volume & Quality Chart */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1b365d]" />
            <span className="font-bold text-slate-800 text-xs">Module Defects vs Accuracy % Matrix</span>
          </div>
          <span className="text-[10px] text-slate-500">Auto-calculated from Module Quality Matrix</span>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.rows.map(r => ({
              module: r.module,
              accuracy: parseFloat(r.moduleAccuracy) || 0,
              bugs: r.bugs,
              pages: r.pages,
              completed: r.completedPages
            }))} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="module" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={30} iconType="rect" />
              <Bar yAxisId="left" dataKey="accuracy" name="Module Accuracy %" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="bugs" name="Total Defects" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="completed" name="Completed Pages" fill="#0284c7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            MODULE QUALITY — DEFECT DENSITY & ACCURACY MATRIX PER HRMS MODULE
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">EXCEL FORMULA SPECIFICATION: </span>
            <code>Module Accuracy % = MAX(0, MIN(1, 1 - ((Critical*10 + High*6 + Medium*3 + Low) / (Pages*5)) / 100))</code>. 
            Penalty weights: Critical = 10, High = 6, Medium = 3, Low = 1 per page delivery capacity.
          </div>
        </div>

        {/* Excel Table */}
        <div className="border border-slate-300 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase">
                <th className="py-2 px-3 border border-[#2b5b84]">Module</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Pages</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Completed Pages</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Average Progress %</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#234b6d]">Bugs</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right text-red-100">Critical</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right text-amber-100">High</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Medium</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Low</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Internal Bugs</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#1b365d]">Module Accuracy %</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, idx) => {
                const accVal = parseFloat(r.moduleAccuracy);
                let accClass = "text-emerald-700 font-bold";
                if (accVal < 80) accClass = "text-rose-700 font-bold bg-rose-50";
                else if (accVal < 90) accClass = "text-amber-700 font-bold bg-amber-50";

                const progressVal = parseFloat(r.averageProgress) || 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 border border-slate-300 font-medium text-slate-900 bg-[#d9e1f2]">
                      <button
                        type="button"
                        onClick={() => onNavigateToSheet1WithFilter?.('module', r.module)}
                        className="hover:underline text-left cursor-pointer hover:text-sky-800 font-semibold"
                        title={`Filter Sheet 1 for ${r.module}`}
                      >
                        {r.module}
                      </button>
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.pages}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.completedPages}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 hidden sm:block overflow-hidden">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, progressVal)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-800">{r.averageProgress}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono text-right font-bold text-slate-900 bg-[#fff2cc]">
                      {r.bugs}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.critical > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-100 px-1 rounded">{r.critical}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.high > 0 ? (
                        <span className="font-bold text-amber-700 bg-amber-100 px-1 rounded">{r.high}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.medium}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.low}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono text-right text-slate-800">
                      {r.internalBugs}
                    </td>
                    <td className={`py-2 px-3 border border-slate-300 font-mono text-right ${accClass}`}>
                      {r.moduleAccuracy}
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
                  {data.total.pages}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-900">
                  {data.total.completedPages}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-blue-900">
                  {data.total.averageProgress}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-900 bg-[#ffe599]">
                  {data.total.bugs}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-rose-700">
                  {data.total.critical}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-amber-700">
                  {data.total.high}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-800">
                  {data.total.medium}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-800">
                  {data.total.low}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-800">
                  {data.total.internalBugs}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-emerald-800 bg-[#e2f0d9]">
                  {data.total.moduleAccuracy}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Formula breakdown and quality index info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-1">
            <div className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              Weight Calculation Model:
            </div>
            <p className="text-slate-600 leading-relaxed">
              Every module starts with a baseline accuracy of 100%. Defect penalty weights are proportional to severity impact:
              <strong> 1 Critical = 10 pts</strong>, <strong>1 High = 6 pts</strong>, <strong>1 Medium = 3 pts</strong>, <strong>1 Low = 1 pt</strong>.
              Penalties are normalized against total page delivery scope (<code>Pages * 5</code> capacity weight).
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded space-y-1">
            <div className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Delivery Threshold Target:
            </div>
            <ul className="text-slate-600 space-y-0.5">
              <li>&bull; <strong className="text-emerald-700">Target Benchmark:</strong> &ge; 90.0% Module Accuracy</li>
              <li>&bull; <strong className="text-amber-700">Warning Zone:</strong> 80.0% - 89.9% (Elevated defect density)</li>
              <li>&bull; <strong className="text-rose-700">Action Required:</strong> &lt; 80.0% (QA Blocker / Stabilization sprint needed)</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
