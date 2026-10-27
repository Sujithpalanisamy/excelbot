import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Rocket, 
  Search, 
  Loader2,
  Bug,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import type { DeploymentTrackerData } from '../types';
import { api } from '../services/api';

interface DeploymentTrackerSheetProps {
  onNavigateToSheet1WithFilter?: (filterType: string, filterValue: string) => void;
  onDownloadExcel: () => void;
}

export const DeploymentTrackerSheet: React.FC<DeploymentTrackerSheetProps> = ({
  onNavigateToSheet1WithFilter,
  onDownloadExcel,
}) => {
  const [data, setData] = useState<DeploymentTrackerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterQaStatus, setFilterQaStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchDeployments = async () => {
      try {
        const res = await api.getDeploymentTrackerData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load deployment tracker data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDeployments();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('DEPLOYMENT TRACKER — Item Release Dates & QA Sign-off Matrix');
    lines.push('');
    lines.push('Type,ID,Deployment Date,Item Name,Developer(s),Severity,Priority,Status,QA Status,QA Assigned,Worked Date');
    
    data.deployments.forEach(d => {
      lines.push(`"${d.type}",${d.id},"${d.deploymentDate}","${(d.itemName || '').replace(/"/g, '""')}","${d.developers}","${d.severity}","${d.priority}","${d.status}","${d.qaStatus}","${d.qaAssigned}","${d.workedDate}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet6_Deployment_Tracker_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 6: Deployment Tracker...</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating historical builds, QA verification statuses, and developer releases</p>
      </div>
    );
  }

  const cleanSearch = searchTerm.replace(/^#/, '').trim().toLowerCase();
  const filteredDeployments = data.deployments.filter(d => {
    const matchesSearch = !searchTerm || 
      (cleanSearch && String(d.id).includes(cleanSearch)) ||
      (d.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.developers || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.qaAssigned || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || d.type.toLowerCase() === filterType.toLowerCase();
    const matchesQa = filterQaStatus === 'all' || (d.qaStatus || '').toLowerCase().includes(filterQaStatus.toLowerCase());
    const matchesDate = selectedDate === 'all' || d.deploymentDate === selectedDate;

    return matchesSearch && matchesType && matchesQa && matchesDate;
  });

  const uniqueQaStatuses = Array.from(new Set(data.deployments.map(d => d.qaStatus).filter(Boolean)));

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-blue-600" />
            <span>SHEET 6: DEPLOYMENT TRACKER</span>
          </div>
          <span className="text-xs text-slate-500">
            {data.totalDeployments} Deployment Records Logged across Sprints
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded transition-colors"
            title="Print sheet"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>
          <button
            onClick={onDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#107c41] hover:bg-[#0b5c30] rounded shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Master .XLSX</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Deployments</span>
            <Rocket className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{data.totalDeployments}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified release packages</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Bugs Deployed</span>
            <Bug className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{data.bugsDeployed}</div>
          <div className="text-[11px] text-slate-500 mt-1">Fixes deployed to QA build</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Tasks Deployed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{data.tasksDeployed}</div>
          <div className="text-[11px] text-slate-500 mt-1">Feature / Enhancement items</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Release Cycles</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{data.dates.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Distinct deployment batch dates</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, summary, developer, QA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium whitespace-nowrap">Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="Bug">Bug</option>
            <option value="Task">Task</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium whitespace-nowrap">QA Status:</label>
          <select
            value={filterQaStatus}
            onChange={(e) => setFilterQaStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All QA Statuses</option>
            {uniqueQaStatuses.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium whitespace-nowrap">Deploy Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Dates ({data.dates.length})</option>
            {data.dates.map(dt => (
              <option key={dt} value={dt}>{dt}</option>
            ))}
          </select>
        </div>

        {(searchTerm || filterType !== 'all' || filterQaStatus !== 'all' || selectedDate !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterQaStatus('all');
              setSelectedDate('all');
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
            <Rocket className="w-4 h-4 text-blue-300" />
            <span>DEPLOYMENT TRACKER — DETAILED RELEASES (ROW COUNT: {filteredDeployments.length})</span>
          </div>
          <span className="text-[11px] font-normal text-slate-300">
            Click Bug ID to drill down to Sheet 1: All Bugs
          </span>
        </div>

        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#1B365D] text-white font-bold sticky top-0 z-10 select-none shadow-sm text-[11px]">
              <tr>
                <th className="py-2 px-2 border-r border-[#2C4D75] w-16 text-center">TYPE</th>
                <th className="py-2 px-2 border-r border-[#2C4D75] w-20 text-center">ID</th>
                <th className="py-2 px-2.5 border-r border-[#2C4D75] w-28">DEPLOY DATE</th>
                <th className="py-2 px-3 border-r border-[#2C4D75] min-w-[280px]">ITEM NAME / SUMMARY</th>
                <th className="py-2 px-2.5 border-r border-[#2C4D75] w-36">DEVELOPER(S)</th>
                <th className="py-2 px-2 border-r border-[#2C4D75] w-20 text-center">SEVERITY</th>
                <th className="py-2 px-2 border-r border-[#2C4D75] w-20 text-center">PRIORITY</th>
                <th className="py-2 px-2.5 border-r border-[#2C4D75] w-24 text-center">STATUS</th>
                <th className="py-2 px-2.5 border-r border-[#2C4D75] w-28 text-center">QA STATUS</th>
                <th className="py-2 px-2.5 border-r border-[#2C4D75] w-32">QA ASSIGNED</th>
                <th className="py-2 px-2.5 w-28 text-center">WORKED DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDeployments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 bg-slate-50 italic">
                    No deployment records matched the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDeployments.map((d, idx) => {
                  const isBug = d.type.toLowerCase() === 'bug';
                  const isClosed = (d.status || '').toLowerCase().includes('closed');
                  const isQaDone = (d.qaStatus || '').toLowerCase().includes('pass') || (d.qaStatus || '').toLowerCase().includes('done') || (d.qaStatus || '').toLowerCase().includes('verified');

                  return (
                    <tr 
                      key={`${d.id}-${idx}`}
                      className="hover:bg-blue-50/60 transition-colors group text-slate-700 even:bg-slate-50/50"
                    >
                      {/* Type */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isBug 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {d.type}
                        </span>
                      </td>

                      {/* ID */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-200 font-mono font-semibold">
                        {isBug ? (
                          <button
                            onClick={() => onNavigateToSheet1WithFilter?.('bugId', String(d.id))}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 hover:underline group-hover:font-bold"
                            title={`Drill down Bug ${d.id} in Sheet 1`}
                          >
                            <span>{d.id}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                          </button>
                        ) : (
                          <span className="text-slate-600">{d.id}</span>
                        )}
                      </td>

                      {/* Deployment Date */}
                      <td className="py-1.5 px-2.5 border-r border-slate-200 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {d.deploymentDate || '—'}
                      </td>

                      {/* Item Name */}
                      <td className="py-1.5 px-3 border-r border-slate-200 font-medium text-slate-800">
                        <div className="line-clamp-2" title={d.itemName}>
                          {d.itemName || '—'}
                        </div>
                      </td>

                      {/* Developers */}
                      <td className="py-1.5 px-2.5 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                        {d.developers ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                            {d.developers}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Severity */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          d.severity === 'Critical' ? 'bg-rose-100 text-rose-800 font-bold' :
                          d.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          d.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {d.severity || '—'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-200 text-[11px]">
                        {d.priority || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isClosed 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {d.status || 'Active'}
                        </span>
                      </td>

                      {/* QA Status */}
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isQaDone
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {d.qaStatus || '—'}
                        </span>
                      </td>

                      {/* QA Assigned */}
                      <td className="py-1.5 px-2.5 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                        {d.qaAssigned || '—'}
                      </td>

                      {/* Worked Date */}
                      <td className="py-1.5 px-2.5 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {d.workedDate || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Soft Yellow Total Row */}
            <tfoot className="bg-[#FFF2CC] font-bold text-slate-900 border-t-2 border-slate-400 text-[11px]">
              <tr>
                <td colSpan={2} className="py-2 px-3 text-right border-r border-amber-300">
                  TOTAL FILTERED:
                </td>
                <td className="py-2 px-2.5 border-r border-amber-300 font-mono">
                  {filteredDeployments.length}
                </td>
                <td colSpan={8} className="py-2 px-3 text-slate-700">
                  Bugs: {filteredDeployments.filter(d => d.type.toLowerCase() === 'bug').length} | 
                  Tasks: {filteredDeployments.filter(d => d.type.toLowerCase() === 'task').length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
