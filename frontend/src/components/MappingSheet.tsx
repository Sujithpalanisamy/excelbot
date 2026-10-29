import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  GitFork,
  Search,
  Loader2,
  Users,
  Layers,
  Sparkles,
  Cpu
} from 'lucide-react';
import type { MappingData } from '../types';
import { api } from '../services/api';
import { Pagination } from './Pagination';

interface MappingSheetProps {
  onDownloadExcel?: () => void;
}

export const MappingSheet: React.FC<MappingSheetProps> = ({
}) => {
  const [data, setData] = useState<MappingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'all' | 'devs' | 'modules' | 'ui'>('all');
  const [devPage, setDevPage] = useState<number>(1);
  const [devPageSize, setDevPageSize] = useState<number>(10);
  const [modPage, setModPage] = useState<number>(1);
  const [modPageSize, setModPageSize] = useState<number>(10);

  useEffect(() => {
    let isMounted = true;
    const fetchMapping = async () => {
      try {
        const res = await api.getMappingData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load mapping rules:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMapping();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('AZURE WORK ITEM AUTO-CLASSIFICATION MAPPING & RULES');
    lines.push('');
    lines.push('Section,Key / Alias,Mapped Target / Value');
    
    data.developerMappings.forEach(d => {
      lines.push(`"Developer Normalization","${d.azureAssignee}","${d.cleanName}"`);
    });
    data.moduleKeywords.forEach(m => {
      lines.push(`"Module Keywords","${m.keyword}","${m.module}"`);
    });
    data.uiKeywords.forEach(u => {
      lines.push(`"UI Nature Keywords","${u}","UI"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet22_Mapping_Rules_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 22: Mapping Rules...</h3>
        <p className="text-xs text-slate-500 mt-1">Reading auto-classification dictionary and Azure work item normalization rules</p>
      </div>
    );
  }

  const filteredDevs = data.developerMappings.filter(d => 
    !searchTerm || d.azureAssignee.toLowerCase().includes(searchTerm.toLowerCase()) || d.cleanName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredModules = data.moduleKeywords.filter(m => 
    !searchTerm || m.keyword.toLowerCase().includes(searchTerm.toLowerCase()) || m.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUi = data.uiKeywords.filter(u => 
    !searchTerm || u.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-50 border border-cyan-200 text-cyan-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-cyan-600" />
            <span>SHEET 22: MAPPING & RULES</span>
          </div>
          <span className="text-xs text-slate-500">
            Auto-Classification Logic for Azure DevOps Work Items
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

      {/* Excel Instruction Callout */}
      <div className="bg-blue-50/80 border border-blue-200 rounded p-3.5 shadow-2xs flex items-start gap-3">
        <Cpu className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700">
          <div className="font-bold text-slate-900 mb-0.5">
            MAPPING & RULES — EDIT THESE TABLES TO CHANGE HOW THE AZURE REPORT IS CLASSIFIED
          </div>
          <p className="leading-relaxed">
            Everything on the <strong>Azure Import</strong> sheet is driven by these lists. Rules are checked top to bottom; the first keyword found in the bug Title wins. Default Module is <strong>EDM</strong>, and Default Bug Nature is <strong>Functional</strong>.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Developer Aliases</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{data.developerMappings.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Normalized resource names</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Module Keywords</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{data.moduleKeywords.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Top-to-bottom priority rules</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>UI Nature Keywords</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{data.uiKeywords.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">UI defect pattern tokens</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Report Modules</span>
            <Cpu className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">{data.reportModules.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Target reporting domains</div>
        </div>
      </div>

      {/* Search and Section Filters */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
          <button
            onClick={() => {
              setActiveSection('all');
              setDevPage(1);
              setModPage(1);
            }}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeSection === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Rules
          </button>
          <button
            onClick={() => {
              setActiveSection('devs');
              setDevPage(1);
            }}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeSection === 'devs' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Developers ({data.developerMappings.length})
          </button>
          <button
            onClick={() => {
              setActiveSection('modules');
              setModPage(1);
            }}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeSection === 'modules' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Module Rules ({data.moduleKeywords.length})
          </button>
          <button
            onClick={() => setActiveSection('ui')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeSection === 'ui' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            UI Keywords ({data.uiKeywords.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search keyword, assignee, or module..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDevPage(1);
              setModPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid of Rule Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table 1: Developer Name Normalization */}
        {(activeSection === 'all' || activeSection === 'devs') && (
          <div className={`bg-white border border-slate-300 rounded shadow-xs overflow-hidden ${activeSection === 'devs' ? 'lg:col-span-3' : ''}`}>
            <div className="bg-[#1b365d] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-300" />
                <span>DEVELOPER NORMALIZATION</span>
              </div>
              <span className="text-[10px] text-slate-300">{filteredDevs.length} aliases</span>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#1B365D] text-white font-bold sticky top-0 text-[10px]">
                  <tr>
                    <th className="py-2 px-3 border-r border-[#2C4D75]">AZURE 'ASSIGNED TO'</th>
                    <th className="py-2 px-3">REPORT CLEAN NAME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDevs.slice((devPage - 1) * devPageSize, devPage * devPageSize).map((d, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/60 transition-colors text-slate-800 even:bg-slate-50/50">
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-600">
                        {d.azureAssignee}
                      </td>
                      <td className="py-2 px-3 font-semibold text-purple-700">
                        {d.cleanName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={devPage}
              totalItems={filteredDevs.length}
              pageSize={devPageSize}
              onPageChange={setDevPage}
              onPageSizeChange={(newSize) => {
                setDevPageSize(newSize);
                setDevPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}

        {/* Table 2: Module Auto-Classification */}
        {(activeSection === 'all' || activeSection === 'modules') && (
          <div className={`bg-white border border-slate-300 rounded shadow-xs overflow-hidden ${activeSection === 'modules' ? 'lg:col-span-3' : ''}`}>
            <div className="bg-[#1b365d] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-300" />
                <span>MODULE KEYWORD RULES</span>
              </div>
              <span className="text-[10px] text-slate-300">{filteredModules.length} rules</span>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#1B365D] text-white font-bold sticky top-0 text-[10px]">
                  <tr>
                    <th className="py-2 px-3 border-r border-[#2C4D75]">TITLE KEYWORD (LOWER)</th>
                    <th className="py-2 px-3">TARGET MODULE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredModules.slice((modPage - 1) * modPageSize, modPage * modPageSize).map((m, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/60 transition-colors text-slate-800 even:bg-slate-50/50">
                      <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-600">
                        "{m.keyword}"
                      </td>
                      <td className="py-2 px-3">
                        <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">
                          {m.module}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={modPage}
              totalItems={filteredModules.length}
              pageSize={modPageSize}
              onPageChange={setModPage}
              onPageSizeChange={(newSize) => {
                setModPageSize(newSize);
                setModPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}

        {/* Table 3: UI Nature Keywords */}
        {(activeSection === 'all' || activeSection === 'ui') && (
          <div className={`bg-white border border-slate-300 rounded shadow-xs overflow-hidden ${activeSection === 'ui' ? 'lg:col-span-3' : ''}`}>
            <div className="bg-[#1b365d] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>UI NATURE DETECTION KEYWORDS</span>
              </div>
              <span className="text-[10px] text-slate-300">{filteredUi.length} tokens</span>
            </div>
            <div className="overflow-x-auto max-h-[500px] p-3">
              <div className="flex flex-wrap gap-1.5">
                {filteredUi.map((u, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center px-2 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 font-mono text-[11px]"
                  >
                    {u}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                Any work item title containing these keywords is classified as <strong>UI</strong> nature; all others default to <strong>Functional</strong>.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
