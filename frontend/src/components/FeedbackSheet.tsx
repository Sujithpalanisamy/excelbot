import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  MessageSquare, 
  Search, 
  Loader2,
  Users,
  Layers,
  Sparkles
} from 'lucide-react';
import type { FeedbackData } from '../types';
import { api } from '../services/api';

interface FeedbackSheetProps {
  onDownloadExcel?: () => void;
}

export const FeedbackSheet: React.FC<FeedbackSheetProps> = () => {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [reporterFilter, setReporterFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchFeedback = async () => {
      try {
        const res = await api.getFeedbackData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load feedback data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFeedback();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('FEEDBACK — Stakeholder Observations & Product Review Notes');
    lines.push('');
    lines.push('ID,Module,Issue / Feedback Note,Reported By');
    
    data.feedbackList.forEach(fb => {
      lines.push(`${fb.id},"${fb.module}","${(fb.issue || '').replace(/"/g, '""')}","${fb.reportedBy}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet20_Feedback_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 20: Feedback...</h3>
        <p className="text-xs text-slate-500 mt-1">Reading product review feedback and UX observations</p>
      </div>
    );
  }

  const uniqueReporters = Array.from(new Set(data.feedbackList.map(f => f.reportedBy).filter(Boolean)));

  const filteredFeedback = data.feedbackList.filter(fb => {
    const matchesSearch = !searchTerm ||
      (fb.issue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fb.module || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fb.reportedBy || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = moduleFilter === 'all' || fb.module === moduleFilter;
    const matchesReporter = reporterFilter === 'all' || fb.reportedBy === reporterFilter;

    return matchesSearch && matchesModule && matchesReporter;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Controls */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-rose-50 border border-rose-200 text-rose-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
            <span>SHEET 20: FEEDBACK</span>
          </div>
          <span className="text-xs text-slate-500">
            {data.totalFeedback} Stakeholder Feedback Notes Recorded
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Feedback Items</span>
            <MessageSquare className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.totalFeedback}</div>
          <div className="text-[11px] text-slate-500 mt-1">Captured user observations</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Modules Reviewed</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{data.modules.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">HRMS features with feedback</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Reviewers / Testers</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{uniqueReporters.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Key stakeholders providing notes</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search feedback notes, module, or reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium">Module:</label>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Modules ({data.modules.length})</option>
            {data.modules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {uniqueReporters.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-medium">Reported By:</label>
            <select
              value={reporterFilter}
              onChange={(e) => setReporterFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Reporters</option>
              {uniqueReporters.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {(searchTerm || moduleFilter !== 'all' || reporterFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setModuleFilter('all');
              setReporterFilter('all');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Authentic Excel Table */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="bg-[#1b365d] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rose-300" />
            <span>FEEDBACK AND USER OBSERVATIONS (NOTES: {filteredFeedback.length})</span>
          </div>
          <span className="text-[11px] font-normal text-slate-300">
            Excel Sheet 20 — Logged User Feedback & QA Observations
          </span>
        </div>

        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#1B365D] text-white font-bold sticky top-0 z-10 select-none shadow-sm text-[11px]">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#2C4D75] w-16 text-center">S.No</th>
                <th className="py-2.5 px-4 border-r border-[#2C4D75] w-48">MODULE</th>
                <th className="py-2.5 px-4 border-r border-[#2C4D75] min-w-[380px]">FEEDBACK / ISSUE DESCRIPTION</th>
                <th className="py-2.5 px-4 w-44">REPORTED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFeedback.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 bg-slate-50 italic">
                    No feedback notes match your search.
                  </td>
                </tr>
              ) : (
                filteredFeedback.map((fb, idx) => (
                  <tr 
                    key={fb.id || idx}
                    className="hover:bg-blue-50/60 transition-colors group text-slate-800 even:bg-slate-50/50"
                  >
                    {/* ID */}
                    <td className="py-2 px-3 text-center border-r border-slate-200 font-mono text-slate-500">
                      {fb.id}
                    </td>

                    {/* Module */}
                    <td className="py-2 px-4 border-r border-slate-200 whitespace-nowrap">
                      <span className="bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {fb.module}
                      </span>
                    </td>

                    {/* Issue / Feedback Description */}
                    <td className="py-2 px-4 border-r border-slate-200 font-medium text-slate-900">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{fb.issue}</span>
                      </div>
                    </td>

                    {/* Reported By */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                        {fb.reportedBy || 'Stakeholder'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Soft Yellow Total Row */}
            <tfoot className="bg-[#FFF2CC] font-bold text-slate-900 border-t-2 border-slate-400 text-[11px]">
              <tr>
                <td className="py-2.5 px-3 text-center border-r border-amber-300">
                  TOTAL
                </td>
                <td className="py-2.5 px-4 border-r border-amber-300">
                  {filteredFeedback.length} Feedback Notes
                </td>
                <td colSpan={2} className="py-2.5 px-4 text-slate-700">
                  User feedback loop for continuous product enhancement
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
