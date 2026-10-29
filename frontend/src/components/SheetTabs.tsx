import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  FileText,
  Search,
  X,
  ExternalLink,
  AlertCircle,
  Loader2,
  Eye,
  CornerDownLeft
} from 'lucide-react';
import { ALL_27_SHEETS, type BugItem } from '../types';
import { api } from '../services/api';

export interface SheetTabsProps {
  activeSheetId: number;
  onSelectSheet: (sheetId: number) => void;
  totalBugsCount: number;
  bugs?: BugItem[];
  onSelectBug?: (bug: BugItem) => void;
  onNavigateToBug?: (bugId: number) => void;
  onBugFetched?: (bug: BugItem) => void;
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
  bugs = [],
  onSelectBug,
  onNavigateToBug,
  onBugFetched,
}) => {
  const activeSheet = ALL_27_SHEETS.find((s) => s.id === activeSheetId) || ALL_27_SHEETS[0];

  // Universal Bug ID Search state
  const [searchBugId, setSearchBugId] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingBug, setIsLoadingBug] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDownGlobal);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDownGlobal);
    };
  }, []);

  // Filter matching bugs from in-memory bugs list
  const cleanQuery = searchBugId.trim();
  const queryNoHash = cleanQuery.replace(/^#/, '').trim();
  const queryLower = queryNoHash.toLowerCase();

  const matchingBugs = useMemo(() => {
    if (!queryLower || !bugs || bugs.length === 0) return [];

    const exactId: BugItem[] = [];
    const prefixId: BugItem[] = [];
    const substrId: BugItem[] = [];
    const textMatches: BugItem[] = [];

    for (const b of bugs) {
      const bIdStr = b.id.toString();
      if (bIdStr === queryLower) {
        exactId.push(b);
      } else if (bIdStr.startsWith(queryLower)) {
        prefixId.push(b);
      } else if (bIdStr.includes(queryLower)) {
        substrId.push(b);
      } else if (
        (b.title && b.title.toLowerCase().includes(queryLower)) ||
        (b.page_name && b.page_name.toLowerCase().includes(queryLower)) ||
        (b.assigned_to && b.assigned_to.toLowerCase().includes(queryLower))
      ) {
        textMatches.push(b);
      }
    }

    // Rank results: exact ID first, then startsWith ID, then contains ID, then text matches
    return [...exactId, ...prefixId, ...substrId, ...textMatches].slice(0, 7);
  }, [queryLower, bugs]);

  // Open bug in view modal
  const handleSelectBugItem = (bug: BugItem) => {
    if (onSelectBug) {
      onSelectBug(bug);
    }
    setIsOpen(false);
    setFetchError(null);
  };

  // Navigate to Sheet 1 with this bug
  const handleNavigateToSheet1 = (bugId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onNavigateToBug) {
      onNavigateToBug(bugId);
    } else {
      onSelectSheet(1);
    }
    setIsOpen(false);
  };

  // Submit search: pick exact match or top result, or query backend
  const handleSearchSubmit = async () => {
    if (!queryNoHash) return;
    setFetchError(null);

    // 1. If we have matching bugs in memory
    if (matchingBugs.length > 0) {
      const exact = matchingBugs.find((b) => b.id.toString() === queryNoHash);
      if (exact) {
        handleSelectBugItem(exact);
        return;
      }
      handleSelectBugItem(matchingBugs[0]);
      return;
    }

    // 2. If it's a numeric Bug ID not yet loaded in state, fetch directly from backend/Azure
    const numericId = parseInt(queryNoHash, 10);
    if (!isNaN(numericId) && numericId > 0) {
      setIsLoadingBug(true);
      try {
        let fetched: BugItem | null = null;
        try {
          fetched = await api.getBugDetails(numericId);
        } catch {
          const res = await api.fetchSingleBug(numericId);
          if (res.success && res.bug) {
            fetched = res.bug;
          }
        }

        if (fetched) {
          onBugFetched?.(fetched);
          handleSelectBugItem(fetched);
        } else {
          setFetchError(`Bug ${numericId} not found in database or Azure DevOps.`);
          setIsOpen(true);
        }
      } catch (err: any) {
        setFetchError(err.message || `Bug ${numericId} could not be found.`);
        setIsOpen(true);
      } finally {
        setIsLoadingBug(false);
      }
    } else {
      setFetchError(`No bug found matching "${cleanQuery}". Enter a numeric Bug ID (e.g. 10165).`);
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-2xs mb-5 overflow-visible">
      {/* Top Banner with Active Sheet Status & Universal Bug ID Search */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
        {/* Left: Active Sheet Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
            {SHEET_ICONS[activeSheet.id] || <Table className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                Sheet {activeSheet.id}: {activeSheet.name}
              </h2>
              {activeSheet.tier && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  activeSheet.tier === 'Tier 1'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : activeSheet.tier === 'Tier 2'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <span className="font-bold">{activeSheet.tier}</span>: {activeSheet.tierLabel}
                </span>
              )}
              {activeSheet.dataSource && (
                <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono hidden sm:inline-block">
                  Source: {activeSheet.dataSource}
                </span>
              )}
              {activeSheet.id === 1 && totalBugsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {totalBugsCount} Bugs
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSheet.description}
            </p>
          </div>
        </div>

        {/* Right: Universal Bug ID Search Bar & Quick Sheet Switcher */}
        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {/* Universal Bug ID Search Bar - Visible & Available on ALL 27 Sheets */}
          <div ref={searchContainerRef} className="relative min-w-[240px] sm:min-w-[280px] md:min-w-[320px]">
            <div className="relative flex items-center">
              <div className="absolute left-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                ref={searchInputRef}
                id="global-bug-search-input"
                type="text"
                value={searchBugId}
                onChange={(e) => {
                  setSearchBugId(e.target.value);
                  setIsOpen(true);
                  setFetchError(null);
                }}
                onFocus={() => {
                  if (searchBugId.trim().length > 0) setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search Bug ID (e.g. 10165)..."
                className="w-full h-8 pl-8 pr-14 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs transition-all"
                autoComplete="off"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                {isLoadingBug ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 mr-1" />
                ) : searchBugId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchBugId('');
                      setIsOpen(false);
                      setFetchError(null);
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 border border-slate-200 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                  title="Search Bug ID (Press Enter)"
                >
                  <CornerDownLeft className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Enter</span>
                </button>
              </div>
            </div>

            {/* Dropdown Results for Bug Search */}
            {isOpen && (searchBugId.trim().length > 0 || fetchError) && (
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                {/* Dropdown Header */}
                <div className="px-3 py-2 bg-slate-50/90 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    {matchingBugs.length > 0 
                      ? `Found ${matchingBugs.length} matching bug${matchingBugs.length === 1 ? '' : 's'}`
                      : 'Bug ID Search'}
                  </span>
                  <span className="text-[10px] text-slate-400">Esc to close</span>
                </div>

                {/* Dropdown Results List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
                  {matchingBugs.length > 0 ? (
                    matchingBugs.map((b) => {
                      const isCritical = (b.severity || '').toLowerCase().includes('1') || (b.severity || '').toLowerCase().includes('critical');
                      const isHigh = (b.severity || '').toLowerCase().includes('2') || (b.severity || '').toLowerCase().includes('high');
                      const isClosed = ['closed', 'done', 'resolved'].includes((b.state || '').toLowerCase());
                      const isExact = b.id.toString() === queryNoHash;

                      return (
                        <div
                          key={b.id}
                          onClick={() => handleSelectBugItem(b)}
                          className={`p-2.5 hover:bg-sky-50/70 cursor-pointer transition-colors group flex items-start gap-2.5 ${
                            isExact ? 'bg-sky-50/40' : ''
                          }`}
                        >
                          <div className="shrink-0 pt-0.5">
                            <span className="inline-block px-1.5 py-0.5 text-xs font-mono font-bold rounded bg-sky-100 text-sky-800 border border-sky-200">
                              ID: {b.id}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {/* Severity Badge */}
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : isHigh
                                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {b.severity || 'P3'}
                              </span>

                              {/* State Badge */}
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                isClosed
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-sky-100 text-sky-700 border border-sky-200'
                              }`}>
                                {b.state || 'Active'}
                              </span>

                              {/* Page / Module Name */}
                              {b.page_name && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-50 text-slate-600 border border-slate-200 truncate max-w-[130px]">
                                  {b.page_name}
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-semibold text-slate-900 group-hover:text-sky-700 truncate transition-colors">
                              {b.title}
                            </p>

                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              Assignee: {b.assigned_to || 'Unassigned'}
                            </p>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="shrink-0 flex items-center gap-1 pt-1 opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectBugItem(b);
                              }}
                              className="p-1 text-slate-400 hover:text-sky-700 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-colors"
                              title="View Bug Details Modal"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleNavigateToSheet1(b.id, e)}
                              className="p-1 text-slate-400 hover:text-sky-700 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-colors"
                              title="Open in Sheet 1: All Bugs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center">
                      <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-800">
                        {fetchError || `No bug found matching "${searchBugId}"`}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Try searching by numeric Bug ID (e.g. 10165) or check Sheet 1: All Bugs.
                      </p>

                      {queryNoHash && !isNaN(Number(queryNoHash)) && (
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={handleSearchSubmit}
                            disabled={isLoadingBug}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-sky-600 hover:bg-sky-700 text-white shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isLoadingBug ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                            <span>Fetch Bug {queryNoHash} Online</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dropdown Footer */}
                <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Click to view details modal</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToBug && queryNoHash && !isNaN(Number(queryNoHash))) {
                        onNavigateToBug(Number(queryNoHash));
                      } else {
                        onSelectSheet(1);
                      }
                      setIsOpen(false);
                    }}
                    className="text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1"
                  >
                    <span>View in Sheet 1</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            )}
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
                  Sheet {s.id}: {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Sheet Tabs Strip */}
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
