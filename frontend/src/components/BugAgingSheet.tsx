import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Clock,
  Search,
  Loader2,
  Filter,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import type { BugAgingData } from '../types';
import { api } from '../services/api';

interface BugAgingSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel?: () => void;
}

export const BugAgingSheet: React.FC<BugAgingSheetProps> = ({
  onNavigateToSheet1WithFilter,
}) => {
  const [data, setData] = useState<BugAgingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchAgingData = async () => {
      try {
        const res = await api.getBugAgingData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load bug aging data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAgingData();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('BUG AGING — Duration Analysis For Defects');
    lines.push('');
    lines.push('Bug ID,Parent Bug ID,Module,Page Name,Original Developer,Fix Developer,Severity,Date Raised,Status,Days Open,Aging Bucket');
    
    data.items.forEach(b => {
      lines.push(`${b.bug_id},${b.parent_bug_id || ''},"${b.module}","${b.page_name}","${b.original_developer}","${b.fix_developer}","${b.severity}","${b.date_raised}","${b.status}",${b.days_open},"${b.aging_bucket}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet13_Bug_Aging_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 13: Bug Aging...</h3>
        <p className="text-xs text-slate-500 mt-1">Calculating Resolution Age Durations and 6-Bracket Distribution</p>
      </div>
    );
  }

  const cleanSearch = searchTerm.replace(/^#/, '').trim().toLowerCase();
  const filteredItems = data.items.filter(item => {
    const matchesSearch = !searchTerm || 
      (cleanSearch && item.bug_id.toString().includes(cleanSearch)) ||
      item.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.page_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.original_developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fix_developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBucket = selectedBucket === 'all' || item.aging_bucket === selectedBucket;
    const matchesSeverity = selectedSeverity === 'all' || item.severity.toLowerCase().includes(selectedSeverity.toLowerCase());

    return matchesSearch && matchesBucket && matchesSeverity;
  });

  const getBucketBadgeStyle = (bucket: string) => {
    switch (bucket) {
      case '0-7 Days':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case '8-15 Days':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case '16-30 Days':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case '31-45 Days':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case '46-60 Days':
        return 'bg-orange-50 text-orange-800 border-orange-300';
      case '60+ Days':
      default:
        return 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>SHEET 13: BUG AGING</span>
          </div>
          <span className="text-xs text-slate-500">
            Aging Duration & 6-Bracket Distribution for all defects
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

      {/* 6 Age Bucket KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: '0-7 Days', count: data.bucketCounts['0-7 Days'], color: 'text-emerald-700', bg: 'hover:bg-emerald-50/50', activeBg: 'border-emerald-500 ring-1 ring-emerald-500' },
          { label: '8-15 Days', count: data.bucketCounts['8-15 Days'], color: 'text-blue-700', bg: 'hover:bg-blue-50/50', activeBg: 'border-blue-500 ring-1 ring-blue-500' },
          { label: '16-30 Days', count: data.bucketCounts['16-30 Days'], color: 'text-indigo-700', bg: 'hover:bg-indigo-50/50', activeBg: 'border-indigo-500 ring-1 ring-indigo-500' },
          { label: '31-45 Days', count: data.bucketCounts['31-45 Days'], color: 'text-amber-700', bg: 'hover:bg-amber-50/50', activeBg: 'border-amber-500 ring-1 ring-amber-500' },
          { label: '46-60 Days', count: data.bucketCounts['46-60 Days'], color: 'text-orange-700', bg: 'hover:bg-orange-50/50', activeBg: 'border-orange-500 ring-1 ring-orange-500' },
          { label: '60+ Days', count: data.bucketCounts['60+ Days'], color: 'text-rose-700 font-bold', bg: 'hover:bg-rose-50/50', activeBg: 'border-rose-500 ring-1 ring-rose-500' },
        ].map(b => (
          <button
            type="button"
            key={b.label}
            onClick={() => setSelectedBucket(selectedBucket === b.label ? 'all' : b.label)}
            className={`bg-white border text-left p-3 rounded shadow-2xs transition-all cursor-pointer ${
              selectedBucket === b.label ? b.activeBg : 'border-slate-300'
            } ${b.bg}`}
          >
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{b.label}</div>
            <div className={`text-xl font-bold mt-1 ${b.color}`}>{b.count}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {data.totalBugs > 0 ? ((b.count / data.totalBugs) * 100).toFixed(1) + '% of bugs' : '0%'}
            </div>
          </button>
        ))}
      </div>

      {/* Aging Bucket Distribution Chart */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1b365d]" />
            <span className="font-bold text-slate-800 text-xs">Defect Aging Bucket Distribution</span>
          </div>
          <span className="text-[10px] text-slate-500">Days Open from Date Raised</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={[
                { bucket: '0-7 Days', count: data.bucketCounts['0-7 Days'], fill: '#10b981' },
                { bucket: '8-15 Days', count: data.bucketCounts['8-15 Days'], fill: '#84cc16' },
                { bucket: '16-30 Days', count: data.bucketCounts['16-30 Days'], fill: '#eab308' },
                { bucket: '31-45 Days', count: data.bucketCounts['31-45 Days'], fill: '#f97316' },
                { bucket: '46-60 Days', count: data.bucketCounts['46-60 Days'], fill: '#ef4444' },
                { bucket: '60+ Days', count: data.bucketCounts['60+ Days'], fill: '#991b1b' },
              ]}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: any) => [`${value} Bugs`, 'Unresolved']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {[
                  '#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444', '#991b1b'
                ].map((color, i) => (
                  <Cell key={`cell-${i}`} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Bug ID, Module, Page, Developer, Status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Age Bucket:</span>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Buckets</option>
              <option value="0-7 Days">0-7 Days</option>
              <option value="8-15 Days">8-15 Days</option>
              <option value="16-30 Days">16-30 Days</option>
              <option value="31-45 Days">31-45 Days</option>
              <option value="46-60 Days">46-60 Days</option>
              <option value="60+ Days">60+ Days</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="1">1 - Critical</option>
              <option value="2">2 - High</option>
              <option value="3">3 - Medium</option>
              <option value="4">4 - Low</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredItems.length} of {data.totalBugs} bugs
          </span>
        </div>
      </div>

      {/* Spreadsheet Canvas */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-x-auto p-4 space-y-4">
        
        {/* Banner (Row 1) */}
        <div>
          <div className="bg-[#1b365d] text-white py-2 px-4 text-center font-bold tracking-wider text-sm sm:text-base uppercase border border-[#1b365d]">
            BUG AGING — DURATION ANALYSIS FOR DEFECT RESOLUTION (SORTED BY DAYS OPEN DESCENDING)
          </div>
          <div className="bg-slate-50 border-x border-b border-slate-300 px-4 py-2 text-[11px] text-slate-600 italic">
            <span className="font-bold not-italic uppercase tracking-wider text-slate-700">FORMULA: </span>
            <code>Days Open = IF(Date Closed &lt;&gt; "", Date Closed - Date Raised, TODAY() - Date Raised)</code>.
            Aging buckets: 0-7d, 8-15d, 16-30d, 31-45d, 46-60d, 60+d. Click any row to view in Sheet 1.
          </div>
        </div>

        {/* Excel Table */}
        <div className="border border-slate-300 overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#2b5b84] text-white font-bold text-xs uppercase shadow-xs">
                <th className="py-2 px-3 border border-[#2b5b84]">Bug ID</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Module</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Page Name</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Original Dev</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Fix Dev</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Severity</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Date Raised</th>
                <th className="py-2 px-3 border border-[#2b5b84]">Status</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-right bg-[#234b6d]">Days Open</th>
                <th className="py-2 px-3 border border-[#2b5b84] text-center">Aging Bucket</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((b) => (
                <tr key={b.bug_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-xs font-bold text-[#1b365d]">
                    <button
                      type="button"
                      onClick={() => onNavigateToSheet1WithFilter?.('bugId', b.bug_id.toString())}
                      className="hover:underline flex items-center gap-1 cursor-pointer"
                      title="View bug in Sheet 1"
                    >
                      <span>{b.bug_id}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </button>
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 text-xs font-semibold text-slate-800 bg-[#d9e1f2]">
                    <button
                      type="button"
                      onClick={() => onNavigateToSheet1WithFilter?.('module', b.module)}
                      className="hover:underline text-left cursor-pointer"
                    >
                      {b.module}
                    </button>
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 text-xs text-slate-800 max-w-[180px] truncate" title={b.page_name}>
                    {b.page_name}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 text-xs text-slate-700">
                    {b.original_developer}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 text-xs font-medium text-slate-900">
                    <button
                      type="button"
                      onClick={() => onNavigateToSheet1WithFilter?.('developer', b.fix_developer)}
                      className="hover:underline text-left cursor-pointer"
                    >
                      {b.fix_developer}
                    </button>
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 text-xs">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      b.severity.includes('1') ? 'bg-red-100 text-red-800' :
                      b.severity.includes('2') ? 'bg-amber-100 text-amber-800' :
                      b.severity.includes('3') ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {b.severity}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono text-xs text-slate-600">
                    {b.date_raised}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 text-xs font-semibold text-slate-800">
                    {b.status}
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-xs text-right text-slate-900 bg-[#fff2cc]">
                    {b.days_open} d
                  </td>
                  <td className="py-1.5 px-3 border border-slate-300 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[11px] rounded-full border ${getBucketBadgeStyle(b.aging_bucket)}`}>
                      {b.aging_bucket}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
