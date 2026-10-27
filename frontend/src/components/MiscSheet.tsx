import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  FolderKanban,
  Search,
  Loader2,
  Settings,
  Shield,
  FileCode
} from 'lucide-react';
import type { MiscData } from '../types';
import { api } from '../services/api';

interface MiscSheetProps {
  onDownloadExcel?: () => void;
}

export const MiscSheet: React.FC<MiscSheetProps> = ({
}) => {
  const [data, setData] = useState<MiscData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'nurture' | 'pwadmin' | 'fields'>('all');

  useEffect(() => {
    let isMounted = true;
    const fetchMisc = async () => {
      try {
        const res = await api.getMiscData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load misc data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMisc();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('MISCELLANEOUS CONFIGURATIONS & OPERATIONAL NOTES');
    lines.push('');
    lines.push('Category,Item / Configuration,Notes');
    
    data.nurtureManage.forEach(i => {
      lines.push(`"Nurture and manage","${(i.item || '').replace(/"/g, '""')}","${(i.notes || '').replace(/"/g, '""')}"`);
    });
    data.pwAdmin.forEach(i => {
      lines.push(`"PWadmin","${(i.item || '').replace(/"/g, '""')}","${(i.notes || '').replace(/"/g, '""')}"`);
    });
    data.fields.forEach(i => {
      lines.push(`"Fields","${(i.item || '').replace(/"/g, '""')}","${(i.notes || '').replace(/"/g, '""')}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet18_Miscellaneous_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 18: Miscellaneous...</h3>
        <p className="text-xs text-slate-500 mt-1">Reading module settings, PWadmin permissions, and field mappings</p>
      </div>
    );
  }

  const allItems = [
    ...data.nurtureManage.map(i => ({ ...i, category: 'Nurture and manage' })),
    ...data.pwAdmin.map(i => ({ ...i, category: 'PWadmin' })),
    ...data.fields.map(i => ({ ...i, category: 'Fields' }))
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = !searchTerm || 
      (item.item || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'nurture' && item.category === 'Nurture and manage') ||
      (activeTab === 'pwadmin' && item.category === 'PWadmin') ||
      (activeTab === 'fields' && item.category === 'Fields');

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-purple-50 border border-purple-200 text-purple-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-purple-600" />
            <span>SHEET 18: MISCELLANEOUS</span>
          </div>
          <span className="text-xs text-slate-500">
            {allItems.length} Admin Fields, PWadmin Configurations & Module Mappings
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
            <span>Total Configs</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{allItems.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Operational records logged</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Nurture & Manage</span>
            <Settings className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{data.nurtureManage.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Core feature module notes</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>PWadmin</span>
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">{data.pwAdmin.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Admin permission templates</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Fields & Notes</span>
            <FileCode className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">{data.fields.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Checklist & workflow items</div>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Items ({allItems.length})
          </button>
          <button
            onClick={() => setActiveTab('nurture')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'nurture' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nurture & Manage ({data.nurtureManage.length})
          </button>
          <button
            onClick={() => setActiveTab('pwadmin')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'pwadmin' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PWadmin ({data.pwAdmin.length})
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'fields' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fields & Notes ({data.fields.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search item or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Authentic Excel Table */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="bg-[#1b365d] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-purple-300" />
            <span>MISCELLANEOUS ITEMS & FIELD DISPOSITION (COUNT: {filteredItems.length})</span>
          </div>
          <span className="text-[11px] font-normal text-slate-300">
            Source: Excel Sheet 18 miscellaneous
          </span>
        </div>

        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#1B365D] text-white font-bold sticky top-0 z-10 select-none shadow-sm text-[11px]">
              <tr>
                <th className="py-2.5 px-3 border-r border-[#2C4D75] w-14 text-center">S.No</th>
                <th className="py-2.5 px-4 border-r border-[#2C4D75] w-48">CATEGORY</th>
                <th className="py-2.5 px-4 border-r border-[#2C4D75] min-w-[320px]">ITEM / CONFIGURATION NAME</th>
                <th className="py-2.5 px-4 min-w-[280px]">NOTES / SYSTEM DISPOSITION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 bg-slate-50 italic">
                    No items match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr 
                    key={idx}
                    className="hover:bg-blue-50/60 transition-colors group text-slate-800 even:bg-slate-50/50"
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center border-r border-slate-200 font-mono text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Category */}
                    <td className="py-2 px-4 border-r border-slate-200 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.category === 'Nurture and manage' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        item.category === 'PWadmin' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        'bg-teal-100 text-teal-800 border border-teal-200'
                      }`}>
                        {item.category}
                      </span>
                    </td>

                    {/* Item */}
                    <td className="py-2 px-4 border-r border-slate-200 font-medium text-slate-900">
                      {item.item || '—'}
                    </td>

                    {/* Notes */}
                    <td className="py-2 px-4 text-slate-700 italic">
                      {item.notes ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] not-italic">
                          {item.notes}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
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
                <td colSpan={3} className="py-2.5 px-4 text-slate-800">
                  {filteredItems.length} Operational Configuration Records Active
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
