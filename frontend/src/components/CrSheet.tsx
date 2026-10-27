import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  FileEdit, 
  Search, 
  Loader2,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import type { CrData } from '../types';
import { api } from '../services/api';

interface CrSheetProps {
  onDownloadExcel?: () => void;
}

export const CrSheet: React.FC<CrSheetProps> = () => {
  const [data, setData] = useState<CrData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchCr = async () => {
      try {
        const res = await api.getCrData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load CR data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCr();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('CHANGE REQUESTS (CR) — Scope Additions & Specification Changes');
    lines.push('');
    lines.push('CR ID,Module,Summary / Requirement,Status');
    
    data.crList.forEach(cr => {
      lines.push(`${cr.id},"${cr.module}","${(cr.summary || '').replace(/"/g, '""')}","${cr.status}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet19_CR_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 19: Change Requests (CR)...</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating functional enhancements, client scope revisions, and module CRs</p>
      </div>
    );
  }

  const uniqueStatuses = Array.from(new Set(data.crList.map(c => c.status).filter(Boolean)));
  const completedCr = data.crList.filter(c => (c.status || '').toLowerCase().includes('done') || (c.status || '').toLowerCase().includes('closed') || (c.status || '').toLowerCase().includes('approved')).length;

  const filteredCr = data.crList.filter(cr => {
    const matchesSearch = !searchTerm ||
      (cr.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cr.module || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = moduleFilter === 'all' || cr.module === moduleFilter;
    const matchesStatus = statusFilter === 'all' || cr.status === statusFilter;

    return matchesSearch && matchesModule && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Actions */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-teal-50 border border-teal-200 text-teal-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <FileEdit className="w-3.5 h-3.5 text-teal-600" />
            <span>SHEET 19: CHANGE REQUESTS (CR)</span>
          </div>
          <span className="text-xs text-slate-500">
            {data.totalCr} Change Requests Documented across {data.modules.length} Modules
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total CRs</span>
            <FileEdit className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.totalCr}</div>
          <div className="text-[11px] text-slate-500 mt-1">Scope modifications</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Modules Impacted</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{data.modules.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">HRMS business domains</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Implemented / Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{completedCr}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {((completedCr / (data.totalCr || 1)) * 100).toFixed(0)}% delivered
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>In Pipeline</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{data.totalCr - completedCr}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending development / QA</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search CR summary or module..."
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

        {uniqueStatuses.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        )}

        {(searchTerm || moduleFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setModuleFilter('all');
              setStatusFilter('all');
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
            <FileEdit className="w-4 h-4 text-teal-300" />
            <span>CHANGE REQUEST (CR) SCOPE MATRIX (CRS: {filteredCr.length})</span>
          </div>
          <span className="text-[11px] font-normal text-slate-300">
            Excel Sheet 19 — Change Requests Logged During Development
          </span>
        </div>

        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#1B365D] text-white font-bold sticky top-0 z-10 select-none shadow-sm text-[11px]">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#2C4D75] w-16 text-center">CR #</th>
                <th className="py-2.5 px-4 border-r border-[#2C4D75] w-48">MODULE</th>
                <th className="py-2.5 px-4 border-r border-[#2C4D75] min-w-[360px]">CHANGE REQUEST SUMMARY / SCOPE</th>
                <th className="py-2.5 px-4 w-32 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCr.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 bg-slate-50 italic">
                    No change requests matched your search.
                  </td>
                </tr>
              ) : (
                filteredCr.map((cr, idx) => {
                  const isDone = (cr.status || '').toLowerCase().includes('done') || (cr.status || '').toLowerCase().includes('closed');

                  return (
                    <tr 
                      key={cr.id || idx}
                      className="hover:bg-blue-50/60 transition-colors group text-slate-800 even:bg-slate-50/50"
                    >
                      {/* CR # */}
                      <td className="py-2 px-3 text-center border-r border-slate-200 font-mono text-slate-600 font-semibold">
                        CR-{cr.id}
                      </td>

                      {/* Module */}
                      <td className="py-2 px-4 border-r border-slate-200 whitespace-nowrap">
                        <span className="bg-teal-50 text-teal-900 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {cr.module}
                        </span>
                      </td>

                      {/* Summary */}
                      <td className="py-2 px-4 border-r border-slate-200 font-medium text-slate-900">
                        {cr.summary}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {cr.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Soft Yellow Total Row */}
            <tfoot className="bg-[#FFF2CC] font-bold text-slate-900 border-t-2 border-slate-400 text-[11px]">
              <tr>
                <td className="py-2.5 px-3 text-center border-r border-amber-300">
                  TOTAL
                </td>
                <td className="py-2.5 px-4 border-r border-amber-300">
                  {filteredCr.length} CRs
                </td>
                <td colSpan={2} className="py-2.5 px-4 text-slate-700">
                  Scope evolution documented for HRMS transformation
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
