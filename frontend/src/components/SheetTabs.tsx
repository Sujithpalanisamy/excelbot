import React from 'react';
import { 
  Table, 
  BarChart3, 
  Layers, 
  DownloadCloud, 
  Bug, 
  Rocket, 
  History, 
  GitBranch, 
  UserCheck, 
  RotateCcw, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  ListOrdered, 
  HelpCircle, 
  CheckSquare, 
  Kanban, 
  FolderKanban, 
  FileEdit, 
  MessageSquare, 
  FileSpreadsheet, 
  Split, 
  Boxes, 
  Hourglass, 
  LayoutList, 
  Users, 
  FileText
} from 'lucide-react';
import { ALL_27_SHEETS } from '../types';

interface SheetTabsProps {
  activeSheetId: number;
  onSelectSheet: (sheetId: number) => void;
  totalBugsCount: number;
}

// Icon mapper for each sheet
const SHEET_ICONS: Record<number, React.ReactNode> = {
  1: <Table className="w-3.5 h-3.5" />,
  2: <BarChart3 className="w-3.5 h-3.5" />,
  3: <Layers className="w-3.5 h-3.5" />,
  4: <DownloadCloud className="w-3.5 h-3.5" />,
  5: <Bug className="w-3.5 h-3.5" />,
  6: <Rocket className="w-3.5 h-3.5" />,
  7: <History className="w-3.5 h-3.5" />,
  8: <GitBranch className="w-3.5 h-3.5" />,
  9: <UserCheck className="w-3.5 h-3.5" />,
  10: <RotateCcw className="w-3.5 h-3.5" />,
  11: <CheckCircle className="w-3.5 h-3.5" />,
  12: <ShieldAlert className="w-3.5 h-3.5" />,
  13: <Clock className="w-3.5 h-3.5" />,
  14: <ListOrdered className="w-3.5 h-3.5" />,
  15: <HelpCircle className="w-3.5 h-3.5" />,
  16: <CheckSquare className="w-3.5 h-3.5" />,
  17: <Kanban className="w-3.5 h-3.5" />,
  18: <FolderKanban className="w-3.5 h-3.5" />,
  19: <FileEdit className="w-3.5 h-3.5" />,
  20: <MessageSquare className="w-3.5 h-3.5" />,
  21: <FileSpreadsheet className="w-3.5 h-3.5" />,
  22: <Split className="w-3.5 h-3.5" />,
  23: <Boxes className="w-3.5 h-3.5" />,
  24: <Hourglass className="w-3.5 h-3.5" />,
  25: <LayoutList className="w-3.5 h-3.5" />,
  26: <Users className="w-3.5 h-3.5" />,
  27: <FileText className="w-3.5 h-3.5" />,
};

export const SheetTabs: React.FC<SheetTabsProps> = ({
  activeSheetId,
  onSelectSheet,
  totalBugsCount,
}) => {
  const activeSheet = ALL_27_SHEETS.find((s) => s.id === activeSheetId) || ALL_27_SHEETS[0];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-2xs mb-5 overflow-hidden">
      {/* Top Banner with Active Sheet Status */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
            #{activeSheet.id}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                Sheet {activeSheet.id}: {activeSheet.name}
              </h2>
              {activeSheet.id === 1 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active ({totalBugsCount} Bugs)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  Queued in Roadmap
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSheet.description}
            </p>
          </div>
        </div>

        {/* Quick Sheet Selector Dropdown for Fast Access */}
        <div className="flex items-center gap-2">
          <label htmlFor="sheet-quick-select" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Switch Sheet:
          </label>
          <select
            id="sheet-quick-select"
            value={activeSheetId}
            onChange={(e) => onSelectSheet(Number(e.target.value))}
            className="h-8 pl-2 pr-6 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
          >
            {ALL_27_SHEETS.map((s) => (
              <option key={s.id} value={s.id}>
                Sheet {s.id}: {s.name} {s.id === 1 ? '★ (Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Horizontal Scrollable Excel Sheet Tabs Strip */}
      <div className="flex items-center overflow-x-auto py-1 px-2 bg-slate-100 border-t border-slate-200 scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
          {ALL_27_SHEETS.map((sheet) => {
            const isActive = sheet.id === activeSheetId;
            const icon = SHEET_ICONS[sheet.id] || <Table className="w-3.5 h-3.5" />;
            return (
              <button
                key={sheet.id}
                id={`tab-sheet-${sheet.id}`}
                type="button"
                onClick={() => onSelectSheet(sheet.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-sky-800 font-bold shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
                }`}
                title={`Sheet ${sheet.id}: ${sheet.name} — ${sheet.description}`}
              >
                <span className={isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'}>
                  {icon}
                </span>
                <span>{sheet.id}. {sheet.name}</span>
                {sheet.id === 1 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active live data" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
