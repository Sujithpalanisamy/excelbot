import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  UserCheck,
  Loader2,
  Code2,
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
import type { DeveloperScorecardData } from '../types';
import { api } from '../services/api';
import { Pagination } from './Pagination';

interface DeveloperScorecardSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel?: () => void;
}

export const DeveloperScorecardSheet: React.FC<DeveloperScorecardSheetProps> = ({
  onNavigateToSheet1WithFilter,
}) => {
  const [data, setData] = useState<DeveloperScorecardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    let isMounted = true;
    const fetchScorecard = async () => {
      try {
        const res = await api.getDeveloperScorecardData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load developer scorecard data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchScorecard();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('DEVELOPER RESOURCE ACCURACY SCORECARD — Fix Accuracy & Delivery Performance');
    lines.push('');
    lines.push('Developer,UI Assigned,API Assigned,SP Assigned,DB Assigned,Binding Assigned,Components Completed,Original Bugs,Critical,High,Medium,Low,Development Accuracy %,Fix Bugs Assigned,Fix Reopens,Fix Accuracy %,Final Score %');
    
    data.rows.forEach(r => {
      lines.push(`"${r.developer}",${r.uiAssigned},${r.apiAssigned},${r.spAssigned},${r.dbAssigned},${r.bindingAssigned},${r.componentsCompleted},${r.originalBugs},${r.critical},${r.high},${r.medium},${r.low},"${r.developmentAccuracy}",${r.fixBugsAssigned},${r.fixReopens},"${r.fixAccuracy}","${r.finalScore}"`);
    });

    lines.push(`"TOTAL / AVERAGE",${data.total.uiAssigned},${data.total.apiAssigned},${data.total.spAssigned},${data.total.dbAssigned},${data.total.bindingAssigned},${data.total.componentsCompleted},${data.total.originalBugs},${data.total.critical},${data.total.high},${data.total.medium},${data.total.low},"${data.total.developmentAccuracy}",${data.total.fixBugsAssigned},${data.total.fixReopens},"${data.total.fixAccuracy}","${data.total.finalScore}"`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet9_Developer_Scorecard_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 9: Developer Scorecard...</h3>
        <p className="text-xs text-slate-500 mt-1">Evaluating Development Accuracy, Fix Quality, and Composite Performance Scores</p>
      </div>
    );
  }

  const paginatedRows = data.rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>SHEET 9: DEVELOPER SCORECARD</span>
          </div>
          <span className="text-xs text-slate-500">
            Resource Delivery Accuracy, Bug Fix Turnaround, and Composite Score %
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
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Engineers</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{data.rows.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Core developers</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{data.total.componentsCompleted}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">UI, API, DB & SPs</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dev Accuracy</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{data.total.developmentAccuracy}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Defect penalty weighted</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fix Bugs Assigned</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{data.total.fixBugsAssigned}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{data.total.fixReopens} total reopens</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fix Accuracy</div>
          <div className="text-xl font-bold text-indigo-700 mt-1">{data.total.fixAccuracy}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">First-pass resolution</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall Final Score</div>
          <div className="text-xl font-bold text-[#1b365d] mt-1">{data.total.finalScore}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">70% Dev + 30% Fix</div>
        </div>
      </div>

      {/* Developer Accuracy & Fix Quality Comparison Chart */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1b365d]" />
            <span className="font-bold text-slate-800 text-xs">Developer Accuracy % &amp; Fix Quality Comparison</span>
          </div>
          <span className="text-[10px] text-slate-500">Auto-calculated from Page &amp; Bug Trackers</span>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.rows.map(r => ({
              developer: r.developer,
              devAccuracy: parseFloat(r.developmentAccuracy) || 0,
              fixAccuracy: parseFloat(r.fixAccuracy) || 0,
              finalScore: parseFloat(r.finalScore) || 0
            }))} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
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

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            DEVELOPER RESOURCE ACCURACY SCORECARD — FIX ACCURACY & DELIVERY PERFORMANCE
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">FORMULA BREAKDOWN: </span>
            <code>Development Accuracy % = MAX(0, MIN(1, 1 - ((Critical*10 + High*6 + Medium*3 + Low) / Components Completed) / 100))</code>. 
            <code>Fix Accuracy % = MAX(0, 1 - Fix Reopens / Fix Bugs Assigned)</code>. 
            <code>Final Score % = 70% Development Accuracy + 30% Fix Accuracy</code>.
          </div>
        </div>

        {/* 17-Column Excel Table */}
        <div className="border border-slate-300 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2b5b84] text-white font-bold uppercase">
                <th rowSpan={2} className="py-2 px-3 border border-[#2b5b84] align-middle">Developer</th>
                <th colSpan={6} className="py-1 px-3 border border-[#2b5b84] text-center bg-[#234b6d]">Page Tracker Assignments</th>
                <th colSpan={5} className="py-1 px-3 border border-[#2b5b84] text-center bg-[#8b0000]">Original Development Defects</th>
                <th rowSpan={2} className="py-2 px-3 border border-[#2b5b84] text-right align-middle bg-[#1b365d]">Dev Acc %</th>
                <th colSpan={3} className="py-1 px-3 border border-[#2b5b84] text-center bg-[#2e7d32]">Bug Fix Quality</th>
                <th rowSpan={2} className="py-2 px-3 border border-[#2b5b84] text-right align-middle bg-[#0b2046]">Final Score %</th>
              </tr>
              <tr className="bg-[#356f9e] text-white font-semibold uppercase text-[11px]">
                <th className="py-1 px-2 border border-[#2b5b84] text-right">UI</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right">API</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right">SP</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right">DB</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right">Binding</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right bg-[#234b6d]">Completed</th>

                <th className="py-1 px-2 border border-[#2b5b84] text-right bg-[#8b0000]">Total</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right text-red-100">Crit</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right text-amber-100">High</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right">Med</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right">Low</th>

                <th className="py-1 px-2 border border-[#2b5b84] text-right bg-[#2e7d32]">Assigned</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right bg-[#2e7d32]">Reopens</th>
                <th className="py-1 px-2 border border-[#2b5b84] text-right bg-[#235826]">Fix Acc %</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r, idx) => {
                const devAccNum = parseFloat(r.developmentAccuracy) || 0;
                const fixAccNum = parseFloat(r.fixAccuracy) || 0;
                const finalNum = parseFloat(r.finalScore) || 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 border border-slate-300 font-medium text-slate-900 bg-[#d9e1f2] whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigateToSheet1WithFilter?.('developer', r.developer)}
                        className="hover:underline text-left cursor-pointer hover:text-sky-800 font-semibold"
                        title={`Filter Sheet 1 for ${r.developer}`}
                      >
                        {r.developer}
                      </button>
                    </td>

                    {/* Task Assignments */}
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.uiAssigned}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.apiAssigned}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.spAssigned}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.dbAssigned}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.bindingAssigned}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono font-bold text-right text-blue-900 bg-[#e6f0fa]">
                      {r.componentsCompleted}
                    </td>

                    {/* Original Defects */}
                    <td className="py-1.5 px-2 border border-slate-300 font-mono font-semibold text-right text-slate-900 bg-[#fff2cc]">
                      {r.originalBugs}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.critical > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-100 px-1 rounded">{r.critical}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.high > 0 ? (
                        <span className="font-bold text-amber-700 bg-amber-100 px-1 rounded">{r.high}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.medium}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.low}
                    </td>

                    {/* Dev Accuracy */}
                    <td className={`py-1.5 px-2.5 border border-slate-300 font-mono font-bold text-right ${
                      devAccNum >= 95 ? 'text-emerald-700 bg-emerald-50/50' :
                      devAccNum >= 85 ? 'text-blue-700 bg-blue-50/50' :
                      devAccNum > 0 ? 'text-amber-700 bg-amber-50/50' : 'text-slate-400'
                    }`}>
                      {r.developmentAccuracy}
                    </td>

                    {/* Fix Quality */}
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.fixBugsAssigned}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 font-mono text-right text-slate-800">
                      {r.fixReopens > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-50 px-1 rounded">{r.fixReopens}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className={`py-1.5 px-2.5 border border-slate-300 font-mono font-bold text-right ${
                      fixAccNum >= 95 ? 'text-emerald-700 bg-emerald-50/50' :
                      fixAccNum >= 85 ? 'text-blue-700 bg-blue-50/50' :
                      fixAccNum > 0 ? 'text-amber-700 bg-amber-50/50' : 'text-slate-400'
                    }`}>
                      {r.fixAccuracy}
                    </td>

                    {/* Final Score */}
                    <td className={`py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900 bg-[#fff2cc] ${
                      finalNum >= 90 ? 'text-emerald-800' :
                      finalNum >= 75 ? 'text-blue-800' : 'text-amber-800'
                    }`}>
                      {r.finalScore}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-[#fff2cc] font-bold border-t-2 border-slate-400">
                <td className="py-2 px-3 border border-slate-400 text-slate-900 uppercase">
                  TOTAL / AVERAGE
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-slate-900">
                  {data.total.uiAssigned}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-slate-900">
                  {data.total.apiAssigned}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-slate-900">
                  {data.total.spAssigned}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-slate-900">
                  {data.total.dbAssigned}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-slate-900">
                  {data.total.bindingAssigned}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-blue-900 bg-[#d9e8f5]">
                  {data.total.componentsCompleted}
                </td>

                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-slate-900 bg-[#ffe599]">
                  {data.total.originalBugs}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-rose-700">
                  {data.total.critical}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-amber-700">
                  {data.total.high}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-slate-800">
                  {data.total.medium}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-slate-800">
                  {data.total.low}
                </td>

                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-emerald-800 bg-[#d9ead3]">
                  {data.total.developmentAccuracy}
                </td>

                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-slate-900">
                  {data.total.fixBugsAssigned}
                </td>
                <td className="py-2 px-2 border border-slate-400 font-mono text-right text-rose-700">
                  {data.total.fixReopens}
                </td>
                <td className="py-2 px-2.5 border border-slate-400 font-mono text-right text-emerald-800 bg-[#d9ead3]">
                  {data.total.fixAccuracy}
                </td>

                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-[#1b365d] bg-[#ffe599]">
                  {data.total.finalScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={data.rows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20]}
        />

        {/* Evaluation Methodology Note */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            Evaluation Methodology:
          </div>
          <p className="leading-relaxed">
            Developers delivering UI, API, Stored Procedures, and Database tables are evaluated on delivery accuracy and defect suppression.
            Engineers with zero assigned development tasks are rated purely on their defect fix resolution accuracy and reopen rate.
          </p>
        </div>

      </div>
    </div>
  );
};
