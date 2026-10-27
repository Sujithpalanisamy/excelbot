import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  BookOpen, 
  Loader2,
  CheckCircle2,
  Palette,
  HelpCircle,
  FileText
} from 'lucide-react';
import type { InstructionsData } from '../types';
import { api } from '../services/api';

interface InstructionsSheetProps {
  onDownloadExcel: () => void;
}

export const InstructionsSheet: React.FC<InstructionsSheetProps> = ({
  onDownloadExcel,
}) => {
  const [data, setData] = useState<InstructionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchInstructions = async () => {
      try {
        const res = await api.getInstructionsData();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load instructions:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInstructions();
    return () => { isMounted = false; };
  }, []);

  const handleExportCsv = () => {
    if (!data) return;
    const lines: string[] = [];
    lines.push('STANDARD OPERATING PROCEDURES & MATRIX NAVIGATION GUIDE');
    lines.push('');
    lines.push('Step / Topic,Guidance / Operating Instruction');
    
    data.steps.forEach(s => {
      lines.push(`"${s.step}","${(s.guidance || '').replace(/"/g, '""')}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet15_Instructions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-slate-300 rounded p-12 text-center shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b365d] mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Loading Sheet 15: Instructions...</h3>
        <p className="text-xs text-slate-500 mt-1">Reading standard operating procedures and workflow navigation rules</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-3 border border-slate-300 rounded shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>SHEET 15: INSTRUCTIONS & NAVIGATION GUIDE</span>
          </div>
          <span className="text-xs text-slate-500">
            Standard Operating Procedures (SOP) & Formatting Standards
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
          <button
            onClick={onDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#107c41] hover:bg-[#0b5c30] rounded shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Master .XLSX</span>
          </button>
        </div>
      </div>

      {/* Excel Color Code Palette Guide */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
          <Palette className="w-4 h-4 text-blue-600" />
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
            Workbook Visual Style & Excel Color Palette Standards
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.colorCodes.map((c, idx) => (
            <div key={idx} className="border border-slate-200 rounded p-2.5 bg-slate-50 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="w-5 h-5 rounded border border-slate-400 shadow-2xs shrink-0" 
                  style={{ backgroundColor: c.code }} 
                />
                <span className="font-mono text-[11px] font-bold text-slate-800">{c.code}</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">{c.role}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Rules Callout */}
      <div className="bg-blue-50/70 border border-blue-200 rounded p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>CORE DATA INTEGRITY & WORKFLOW RULES</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
          {data.rules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded border border-blue-100">
              <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step SOP Table */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        <div className="bg-[#1b365d] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-300" />
            <span>HOW TO USE THIS TRACKING MATRIX — DETAILED GUIDANCE</span>
          </div>
          <span className="text-[11px] font-normal text-slate-300">
            Source: Excel Sheet 15 Instructions
          </span>
        </div>

        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#1B365D] text-white font-bold sticky top-0 z-10 select-none shadow-sm text-[11px]">
              <tr>
                <th className="py-2.5 px-4 border-r border-[#2C4D75] w-64">STEP / COMPONENT</th>
                <th className="py-2.5 px-4 min-w-[400px]">OPERATIONAL GUIDANCE & BEST PRACTICES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.steps.map((s, idx) => (
                <tr 
                  key={idx}
                  className="hover:bg-blue-50/60 transition-colors group text-slate-800 even:bg-slate-50/50"
                >
                  {/* Step */}
                  <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-900 bg-slate-50/70 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>{s.step}</span>
                    </div>
                  </td>

                  {/* Guidance */}
                  <td className="py-2.5 px-4 text-slate-700 leading-relaxed">
                    {s.guidance}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Soft Yellow Total Row */}
            <tfoot className="bg-[#FFF2CC] font-bold text-slate-900 border-t-2 border-slate-400 text-[11px]">
              <tr>
                <td className="py-2.5 px-4 border-r border-amber-300">
                  TOTAL PROCEDURES:
                </td>
                <td className="py-2.5 px-4 text-slate-800">
                  {data.steps.length} Steps Defined for Enterprise Defect Quality Governance
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
