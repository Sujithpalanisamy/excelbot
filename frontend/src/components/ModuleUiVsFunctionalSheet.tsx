import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Layout, 
  Cpu, 
  Loader2,
  PieChart
} from 'lucide-react';
import type { ModuleUiVsFunctionalData } from '../types';
import { api } from '../services/api';

interface ModuleUiVsFunctionalSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel: () => void;
}

export const ModuleUiVsFunctionalSheet: React.FC<ModuleUiVsFunctionalSheetProps> = ({
  onNavigateToSheet1WithFilter,
  onDownloadExcel,
}) => {
  const [data, setData] = useState<ModuleUiVsFunctionalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await api.getModuleUiVsFunctionalData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load Module UI vs Functional data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('MODULE UI VS FUNCTIONAL — Defect Distribution & Resolution Breakdown');
    lines.push('');
    lines.push('Module,UI - Total,Functional - Total,All Bugs,UI - Pending,Functional - Pending,Pending Total,UI - Closed,Functional - Closed,Closed Total,UI % of Module');
    
    data.rows.forEach(r => {
      lines.push(`"${r.module}",${r.uiTotal},${r.functionalTotal},${r.allBugs},${r.uiPending},${r.functionalPending},${r.pendingTotal},${r.uiClosed},${r.functionalClosed},${r.closedTotal},"${r.uiPctOfModule}"`);
    });

    lines.push(`"TOTAL",${data.total.uiTotal},${data.total.functionalTotal},${data.total.allBugs},${data.total.uiPending},${data.total.functionalPending},${data.total.pendingTotal},${data.total.uiClosed},${data.total.functionalClosed},${data.total.closedTotal},"${data.total.uiPctOfModule}"`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet23_Module_UI_vs_Functional_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 23: Module UI vs Functional...</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating UI / Design vs Functional / Backend Defect Ratios</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5 text-purple-600" />
            <span>SHEET 23: MODULE UI VS FUNCTIONAL</span>
          </div>
          <span className="text-xs text-slate-500">
            UI / CSS vs Functional Defect Ratios across HRMS Modules
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
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Defects</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{data.total.allBugs}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All modules</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Layout className="w-3 h-3 text-purple-600" />
            UI Defects
          </div>
          <div className="text-xl font-bold text-purple-700 mt-1">{data.total.uiTotal}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">{data.total.uiPctOfModule} of total</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3 text-blue-600" />
            Functional
          </div>
          <div className="text-xl font-bold text-blue-700 mt-1">{data.total.functionalTotal}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">
            {data.total.allBugs > 0 ? ((data.total.functionalTotal / data.total.allBugs) * 100).toFixed(1) + '%' : '0%'} of total
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Pending</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{data.total.pendingTotal}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">{data.total.uiPending} UI, {data.total.functionalPending} Func</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Closed</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{data.total.closedTotal}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">{data.total.uiClosed} UI, {data.total.functionalClosed} Func</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Closure Ratio</div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            {data.total.allBugs > 0 ? ((data.total.closedTotal / data.total.allBugs) * 100).toFixed(1) + '%' : '0%'}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Resolved vs all bugs</div>
        </div>
      </div>

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            MODULE UI VS FUNCTIONAL — DEFECT BREAKDOWN & RESOLUTION STATUS
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">SHEET DESCRIPTION: </span>
            Compares layout & UI styling defects vs functional business logic defects. 
            Identifies frontend vs backend workload distribution across core HRMS modules.
          </div>
        </div>

        {/* 11-Column Excel Table */}
        <div className="border border-slate-300 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2b5b84] text-white font-bold uppercase">
                <th rowSpan={2} className="py-2 px-3 border border-[#2b5b84] align-middle">Module</th>
                <th colSpan={3} className="py-1 px-3 border border-[#2b5b84] text-center bg-[#234b6d]">Total Bugs</th>
                <th colSpan={3} className="py-1 px-3 border border-[#2b5b84] text-center bg-[#b8860b]">Pending Defects</th>
                <th colSpan={3} className="py-1 px-3 border border-[#2b5b84] text-center bg-[#2e7d32]">Closed Defects</th>
                <th rowSpan={2} className="py-2 px-3 border border-[#2b5b84] text-right align-middle bg-[#1b365d]">UI % of Module</th>
              </tr>
              <tr className="bg-[#356f9e] text-white font-semibold uppercase text-[11px]">
                <th className="py-1 px-2.5 border border-[#2b5b84] text-right">UI</th>
                <th className="py-1 px-2.5 border border-[#2b5b84] text-right">Functional</th>
                <th className="py-1 px-2.5 border border-[#2b5b84] text-right bg-[#234b6d]">All Bugs</th>

                <th className="py-1 px-2.5 border border-[#2b5b84] text-right">UI</th>
                <th className="py-1 px-2.5 border border-[#2b5b84] text-right">Functional</th>
                <th className="py-1 px-2.5 border border-[#2b5b84] text-right bg-[#b8860b]">Pending Total</th>

                <th className="py-1 px-2.5 border border-[#2b5b84] text-right">UI</th>
                <th className="py-1 px-2.5 border border-[#2b5b84] text-right">Functional</th>
                <th className="py-1 px-2.5 border border-[#2b5b84] text-right bg-[#2e7d32]">Closed Total</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, idx) => (
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
                  
                  {/* Total columns */}
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono text-right text-purple-700 font-medium">
                    {r.uiTotal}
                  </td>
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono text-right text-blue-700 font-medium">
                    {r.functionalTotal}
                  </td>
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono text-right font-bold text-slate-900 bg-[#f1f5f9]">
                    {r.allBugs}
                  </td>

                  {/* Pending columns */}
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono text-right text-slate-800">
                    {r.uiPending}
                  </td>
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono text-right text-slate-800">
                    {r.functionalPending}
                  </td>
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono text-right font-bold text-amber-900 bg-[#fff2cc]">
                    {r.pendingTotal}
                  </td>

                  {/* Closed columns */}
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono text-right text-slate-800">
                    {r.uiClosed}
                  </td>
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono text-right text-slate-800">
                    {r.functionalClosed}
                  </td>
                  <td className="py-1.5 px-2.5 border border-slate-300 font-mono text-right font-bold text-emerald-900 bg-[#e2f0d9]">
                    {r.closedTotal}
                  </td>

                  {/* UI % */}
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right font-semibold text-slate-800">
                    {r.uiPctOfModule}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-[#fff2cc] font-bold border-t-2 border-slate-400">
                <td className="py-2 px-3 border border-slate-400 text-slate-900 uppercase">
                  TOTAL
                </td>
                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-purple-900">
                  {data.total.uiTotal}
                </td>
                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-blue-900">
                  {data.total.functionalTotal}
                </td>
                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-slate-900 bg-[#ffe599]">
                  {data.total.allBugs}
                </td>

                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-amber-900">
                  {data.total.uiPending}
                </td>
                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-amber-900">
                  {data.total.functionalPending}
                </td>
                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-amber-900 bg-[#ffe599]">
                  {data.total.pendingTotal}
                </td>

                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-emerald-900">
                  {data.total.uiClosed}
                </td>
                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-emerald-900">
                  {data.total.functionalClosed}
                </td>
                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-emerald-900 bg-[#d9ead3]">
                  {data.total.closedTotal}
                </td>

                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-900 bg-[#ffe599]">
                  {data.total.uiPctOfModule}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Visual Distribution Chart */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded space-y-3">
          <div className="font-semibold text-slate-800 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <PieChart className="w-3.5 h-3.5 text-purple-600" />
              Module Defect Composition (UI vs Functional)
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-purple-500 rounded-sm"></span> UI Defects
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Functional Defects
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {data.rows.map(r => {
              const uiVal = parseFloat(r.uiPctOfModule) || 0;
              const funcVal = 100 - uiVal;

              return (
                <div key={r.module} className="flex items-center gap-3 text-xs">
                  <span className="w-24 font-medium text-slate-700 truncate">{r.module}</span>
                  <div className="flex-1 bg-slate-200 h-3 rounded-sm overflow-hidden flex">
                    <div 
                      className="bg-purple-500 h-full transition-all" 
                      style={{ width: `${uiVal}%` }} 
                      title={`UI: ${r.uiTotal} (${uiVal.toFixed(1)}%)`}
                    />
                    <div 
                      className="bg-blue-500 h-full transition-all" 
                      style={{ width: `${funcVal}%` }} 
                      title={`Functional: ${r.functionalTotal} (${funcVal.toFixed(1)}%)`}
                    />
                  </div>
                  <span className="w-20 text-right font-mono text-[11px] text-slate-500">
                    {r.uiTotal} UI / {r.functionalTotal} F
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
