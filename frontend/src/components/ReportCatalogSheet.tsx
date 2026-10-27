import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  CheckCircle2, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

interface ReportCatalogItem {
  id: number;
  module: string;
  name: string;
  used?: string;
}

// Master reports catalog fallback
const MASTER_REPORTS_CATALOG: ReportCatalogItem[] = [
  { id: 1, module: 'EDM', name: 'Nominee Information', used: 'Active' },
  { id: 2, module: 'EDM', name: 'Personal Accidental Insurance', used: 'Active' },
  { id: 3, module: 'EDM', name: 'Personal Accidental Nominee Information', used: 'Active' },
  { id: 4, module: 'EDM', name: 'Asset Report', used: 'Active' },
  { id: 5, module: 'EDM', name: 'Employee Employment Information', used: 'Active' },
  { id: 6, module: 'EDM', name: 'Employee Personal Information', used: 'Active' },
  { id: 7, module: 'EDM', name: 'Employee Master Information Report', used: 'Active' }
];

export const ReportCatalogSheet: React.FC = () => {
  const [reportsList, setReportsList] = useState<ReportCatalogItem[]>(MASTER_REPORTS_CATALOG);
  const [modulesList, setModulesList] = useState<string[]>(['All', 'EDM', 'Leave', 'Attendance', 'Payroll']);
  const [selectedModule, setSelectedModule] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api.getReportsCatalogData()
      .then(res => {
        if (isMounted && res.reports && res.reports.length > 0) {
          setReportsList(res.reports);
          if (res.modules && res.modules.length > 0) {
            setModulesList(['All', ...res.modules]);
          }
        }
      })
      .catch(err => console.warn('Using fallback reports list:', err.message))
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const modules = modulesList;

  const filteredReports = reportsList.filter((r) => {
    if (selectedModule !== 'All' && r.module !== selectedModule) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.module.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportCsv = () => {
    const headers = ['Report ID', 'Module', 'Report Name', 'Status'];
    const rows = filteredReports.map((r) => [r.id, r.module, `"${r.name}"`, r.used || 'Active']);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sheet21_Reports_Catalog_${selectedModule}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-2xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900">
                Sheet 21: Reports Catalog (HRMS Module Register)
              </h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 inline-flex items-center gap-1.5">
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>{reportsList.length} Standard Reports</span>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Direct digital replacement for Sheet 21 of the Excel Tracker • Full catalog of all operational and compliance reports
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="h-9 btn-secondary inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-md shadow-2xs text-slate-700 hover:text-sky-700 hover:border-sky-300 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-sky-600" />
          <span>Export Catalog (.csv)</span>
        </button>
      </div>

      {/* Module Filter Pills & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">Filter by Module:</span>
          {modules.map((m) => {
            const isSelected = selectedModule === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedModule(m)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  isSelected
                    ? 'btn-sky text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report name or module..."
            className="h-8.5 w-full pl-8 pr-3 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4 w-16">#</th>
                <th className="py-2.5 px-4 w-32">Module</th>
                <th className="py-2.5 px-4">Standard Report Name</th>
                <th className="py-2.5 px-4 text-center w-28">Status</th>
                <th className="py-2.5 px-4 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-slate-400 font-semibold">
                    #{r.id}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                      r.module === 'EDM'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : r.module === 'Leave'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : r.module === 'Attendance'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {r.module}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    {r.name}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {r.used}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`Generating ${r.name} for ${r.module} module...`)}
                      className="btn-secondary px-2.5 py-1 text-[11px] font-medium rounded text-sky-700 hover:text-sky-900 hover:bg-sky-50 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Run Report</span>
                      <ExternalLink className="w-3 h-3 text-sky-500" />
                    </button>
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
