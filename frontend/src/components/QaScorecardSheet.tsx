import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  CheckCircle,
  Loader2,
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
import type { QaScorecardData } from '../types';
import { api } from '../services/api';
import { Pagination } from './Pagination';

interface QaScorecardSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel?: () => void;
}

export const QaScorecardSheet: React.FC<QaScorecardSheetProps> = ({
  onNavigateToSheet1WithFilter,
}) => {
  const [data, setData] = useState<QaScorecardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    let isMounted = true;
    const fetchQaScorecard = async () => {
      try {
        const res = await api.getQaScorecardData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load QA scorecard data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchQaScorecard();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('QA RESOURCE ACCURACY SCORECARD — Defect Detection Quality');
    lines.push('');
    lines.push('QA,Pages Tested,Bugs Raised,Valid Bugs,Critical,High,Medium,Low,Rejected/Duplicate,Missed Bugs,QA Accuracy %,Bug Find Rate,Final QA Score %');
    
    data.rows.forEach(r => {
      lines.push(`"${r.qa}",${r.pagesTested},${r.bugsRaised},${r.validBugs},${r.critical},${r.high},${r.medium},${r.low},${r.rejectedDuplicate},${r.missedBugs},"${r.qaAccuracy}",${r.bugFindRate},"${r.finalQaScore}"`);
    });

    lines.push(`"TOTAL / AVERAGE",${data.total.pagesTested},${data.total.bugsRaised},${data.total.validBugs},${data.total.critical},${data.total.high},${data.total.medium},${data.total.low},${data.total.rejectedDuplicate},${data.total.missedBugs},"${data.total.qaAccuracy}",${data.total.bugFindRate},"${data.total.finalQaScore}"`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet11_QA_Scorecard_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 11: QA Scorecard...</h3>
        <p className="text-xs text-slate-500 mt-1">Evaluating QA Testing Volume, Valid Bug Ratios, and Defect Detection Efficiency</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>SHEET 11: QA SCORECARD</span>
          </div>
          <span className="text-xs text-slate-500">
            QA Testing Volume, Valid Bug % and Detection Rate
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
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">QA Engineers</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{data.rows.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Assigned testers</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pages Tested</div>
          <div className="text-xl font-bold text-indigo-700 mt-1">{data.total.pagesTested}</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">Across sprint cycles</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bugs Raised</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{data.total.bugsRaised}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified defects</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Valid Bug %</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">100.0%</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">0 rejected / duplicates</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Bug Find Rate</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{data.total.bugFindRate}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Bugs per page tested</div>
        </div>

        <div className="bg-white border border-slate-300 p-3 rounded shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overall QA Score</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">{data.total.finalQaScore}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Target &ge; 95%</div>
        </div>
      </div>

      {/* QA Accuracy & Bug Detection Rate Chart */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1b365d]" />
            <span className="font-bold text-slate-800 text-xs">QA Accuracy % &amp; Bug Detection Volume</span>
          </div>
          <span className="text-[10px] text-slate-500">Auto-calculated from QA Scorecard</span>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.rows.map(r => ({
              qa: r.qa,
              qaAccuracy: parseFloat(r.qaAccuracy) || 0,
              bugsRaised: r.bugsRaised,
              pagesTested: r.pagesTested
            }))} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="qa" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={30} iconType="rect" />
              <Bar yAxisId="left" dataKey="qaAccuracy" name="QA Accuracy %" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="bugsRaised" name="Bugs Raised" fill="#1b365d" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="pagesTested" name="Pages Tested" fill="#0284c7" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            QA RESOURCE ACCURACY SCORECARD — DEFECT DETECTION & TESTING ACCURACY
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">FORMULA LOGIC: </span>
            <code>Valid Bugs = MAX(0, Bugs Raised - Rejected/Duplicate)</code>. 
            <code>QA Accuracy % = IF(Bugs Raised=0, 0, MAX(0, MIN(1, Valid Bugs/Bugs Raised - Missed*0.03)))</code>. 
            <code>Bug Find Rate = Bugs Raised / Pages Tested</code>.
          </div>
        </div>

        {/* 13-Column Excel Table */}
        <div className="border border-slate-300 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2b5b84] text-white font-bold uppercase">
                <th className="py-2 px-3 border border-[#2b5b84]">QA Engineer</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Pages Tested</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#234b6d]">Bugs Raised</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right text-emerald-100">Valid Bugs</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right text-red-100">Critical</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right text-amber-100">High</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Medium</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Low</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Rejected / Duplicate</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Missed Bugs</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#1b365d]">QA Accuracy %</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right">Bug Find Rate</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#0b2046]">Final QA Score %</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 border border-slate-300 font-medium text-slate-900 bg-[#d9e1f2] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onNavigateToSheet1WithFilter?.('reporter', r.qa)}
                      className="hover:underline text-left cursor-pointer hover:text-sky-800 font-semibold"
                      title={`Filter Sheet 1 for ${r.qa}`}
                    >
                      {r.qa}
                    </button>
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                    {r.pagesTested}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-slate-900 bg-[#fff2cc]">
                    {r.bugsRaised}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono font-semibold text-right text-emerald-800 bg-[#e2f0d9]">
                    {r.validBugs}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                    {r.critical > 0 ? (
                      <span className="font-bold text-rose-700 bg-rose-100 px-1 rounded">{r.critical}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                    {r.high > 0 ? (
                      <span className="font-bold text-amber-700 bg-amber-100 px-1 rounded">{r.high}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                    {r.medium}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-800">
                    {r.low}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-400">
                    {r.rejectedDuplicate}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-slate-400">
                    {r.missedBugs}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-emerald-700 bg-emerald-50/50">
                    {r.qaAccuracy}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-right text-blue-700 font-semibold">
                    {r.bugFindRate}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-right text-emerald-900 bg-[#d9ead3]">
                    {r.finalQaScore}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-[#fff2cc] font-bold border-t-2 border-slate-400">
                <td className="py-2 px-3 border border-slate-400 text-slate-900 uppercase">
                  TOTAL / AVERAGE
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-900">
                  {data.total.pagesTested}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-900 bg-[#ffe599]">
                  {data.total.bugsRaised}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-emerald-900 bg-[#d9ead3]">
                  {data.total.validBugs}
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
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-600">
                  {data.total.rejectedDuplicate}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-slate-600">
                  {data.total.missedBugs}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-emerald-800 bg-[#d9ead3]">
                  {data.total.qaAccuracy}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-blue-900">
                  {data.total.bugFindRate}
                </td>
                <td className="py-2 px-3 border border-slate-400 font-mono text-right text-emerald-900 bg-[#d9ead3]">
                  {data.total.finalQaScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={data.rows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20, 50]}
        />

        {/* Quality note */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            QA Evaluation Standards:
          </div>
          <p className="leading-relaxed">
            QA Accuracy measures the validity and high reproducibility of logged defect items. Missed bugs in production or client UAT incur a 3% penalty deduction from QA Accuracy.
          </p>
        </div>

      </div>
    </div>
  );
};
