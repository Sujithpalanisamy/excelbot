import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  FileText, 
  RotateCcw, 
  ChevronDown, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Download,
  ListFilter
} from 'lucide-react';
import type { BugItem } from '../types';
import { HRMS_PAGES, STANDARD_STATES, STANDARD_SEVERITIES } from '../types';

interface BugTableProps {
  bugs: BugItem[];
  allBugs?: BugItem[];
  activeMetricFilter?: string;
  onClearMetricFilter?: () => void;
  onSelectBug: (bug: BugItem) => void;
  onUpdateClassification: (bugId: number, pageName: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPage: string;
  setSelectedPage: (p: string) => void;
  selectedState: string;
  setSelectedState: (s: string) => void;
  selectedSeverity: string;
  setSelectedSeverity: (s: string) => void;
  selectedPriority: string;
  setSelectedPriority: (p: string) => void;
  selectedAssignee: string;
  setSelectedAssignee: (a: string) => void;
  selectedReporter: string;
  setSelectedReporter: (r: string) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  onResetFilters: () => void;
}

export const BugTable: React.FC<BugTableProps> = ({
  bugs,
  allBugs,
  activeMetricFilter,
  onClearMetricFilter,
  onSelectBug,
  onUpdateClassification,
  searchQuery,
  setSearchQuery,
  selectedPage,
  setSelectedPage,
  selectedState,
  setSelectedState,
  selectedSeverity,
  setSelectedSeverity,
  selectedPriority,
  setSelectedPriority,
  selectedAssignee,
  setSelectedAssignee,
  selectedReporter,
  setSelectedReporter,
  selectedDate,
  setSelectedDate,
  onResetFilters,
}) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showReproColumn, setShowReproColumn] = useState<boolean>(true);

  // Use allBugs as master reference so dropdowns never collapse when filtered
  const masterBugs = allBugs && allBugs.length > 0 ? allBugs : bugs;

  // Reset to first page whenever search query or filters change
  const filterKey = `${searchQuery}|${selectedPage}|${selectedState}|${selectedSeverity}|${selectedPriority}|${selectedAssignee}|${selectedReporter}|${selectedDate}|${pageSize}|${activeMetricFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalItems = bugs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedBugs = bugs.slice(startIndex, endIndex);

  const getPageNumbers = (current: number, total: number): (number | string)[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // 100% unique, deduplicated lists for all filter dropdowns derived from master dataset
  const uniqueModules = Array.from(new Set([
    ...HRMS_PAGES,
    ...masterBugs.map(b => b.page_name).filter(Boolean)
  ])).sort();

  // All standard states guaranteed + any extra custom states present in the dataset
  const uniqueStates = Array.from(new Set([
    ...STANDARD_STATES,
    ...masterBugs.map(b => b.state).filter(Boolean)
  ])).sort((a, b) => {
    const order = ['New', 'Active', 'Committed', 'Approved', 'Resolved', 'Done', 'Closed'];
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const uniqueSeverities = Array.from(new Set([
    ...STANDARD_SEVERITIES,
    ...masterBugs.map(b => b.severity).filter(Boolean)
  ])).sort();

  const uniquePriorities = Array.from(new Set([
    1, 2, 3, 4,
    ...masterBugs.map(b => {
      const num = Number(String(b.priority).replace(/\D/g, ''));
      return isNaN(num) || num === 0 ? 2 : num;
    })
  ])).sort((a, b) => a - b);

  const assignees = Array.from(new Set(masterBugs.map(b => b.assigned_to).filter(Boolean))).sort();
  const creators = Array.from(new Set(masterBugs.map(b => b.reporter).filter(Boolean))).sort();

  // Helper to count how many bugs in master list match a state
  const getStateCount = (stateName: string) => {
    const s = stateName.toLowerCase();
    return masterBugs.filter(b => {
      const bs = (b.state || '').toLowerCase();
      if (s === 'new') return ['new', 'proposed', 'to do'].includes(bs);
      if (s === 'active') return ['active', 'in progress', 'investigating'].includes(bs);
      if (s === 'committed') return bs === 'committed';
      if (s === 'approved') return bs === 'approved';
      if (s === 'resolved') return ['resolved', 'fixed'].includes(bs);
      if (s === 'done') return bs === 'done';
      if (s === 'closed') return ['closed', 'completed'].includes(bs);
      return bs === s;
    }).length;
  };

  const handlePageChange = async (bugId: number, newPage: string) => {
    setUpdatingId(bugId);
    try {
      await onUpdateClassification(bugId, newPage);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStateBadge = (state: string) => {
    const s = (state || '').toLowerCase();
    if (['new', 'proposed', 'to do'].includes(s)) {
      return {
        badge: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500'
      };
    }
    if (s === 'approved') {
      return {
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500'
      };
    }
    if (s === 'committed') {
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500'
      };
    }
    if (['active', 'in progress', 'investigating'].includes(s)) {
      return {
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500'
      };
    }
    if (['resolved', 'fixed'].includes(s)) {
      return {
        badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        dot: 'bg-cyan-500'
      };
    }
    if (['closed', 'done', 'completed'].includes(s)) {
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    }
    return {
      badge: 'bg-slate-50 text-slate-700 border-slate-200',
      dot: 'bg-slate-400'
    };
  };

  const getSeverityBadge = (sev: string) => {
    const s = (sev || '').toLowerCase();
    if (s.includes('1') || s.includes('critical')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
    }
    if (s.includes('2') || s.includes('high')) {
      return 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
    }
    if (s.includes('3') || s.includes('medium')) {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  const handleExportSheet1Csv = () => {
    const headers = [
      'Bug ID',
      'Work Item Type',
      'Title',
      'Reproduction Steps',
      'Description',
      'State',
      'Severity',
      'Priority',
      'Assigned To',
      'Reporter',
      'Created Date',
      'Page Name',
      'Tags',
      'Bug URL'
    ];
    const escapeCsv = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
    const rows = bugs.map(b => [
      b.id,
      escapeCsv(b.work_item_type || 'Bug'),
      escapeCsv(b.title),
      escapeCsv(b.repro_steps),
      escapeCsv(b.description),
      escapeCsv(b.state),
      escapeCsv(b.severity),
      b.priority ?? '',
      escapeCsv(b.assigned_to),
      escapeCsv(b.reporter),
      escapeCsv(b.created_date),
      escapeCsv(b.page_name),
      escapeCsv(b.tags),
      escapeCsv(b.bug_url)
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sheet1_All_Bugs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="work-items-section" aria-labelledby="work-items-heading" className="w-full enterprise-card overflow-hidden mb-6">
      {/* Table Header & Search */}
      <div className="p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3 border-b border-slate-200/80 bg-white">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              #1
            </span>
            <h2 id="work-items-heading" className="text-base sm:text-lg font-bold font-display text-slate-900">
              Sheet 1: All Bugs
            </h2>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 tabular-nums">
              {bugs.length} {bugs.length === 1 ? 'item' : 'items'}
            </span>
            {totalPages > 1 && (
              <span className="font-sans text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Page {validCurrentPage} of {totalPages}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Synchronized directly from Azure DevOps • Includes Bug ID, Title, Repro Steps, State, Severity, Assignee &amp; Module
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Repro Steps column button */}
          <button
            id="btn-toggle-repro-column"
            type="button"
            onClick={() => setShowReproColumn(!showReproColumn)}
            className="h-9 btn-secondary inline-flex items-center gap-1.5 px-3 text-xs font-medium rounded-md focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none cursor-pointer"
            title="Toggle Reproduction Steps column visibility"
          >
            <ListFilter className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>{showReproColumn ? 'Hide Repro Steps' : 'Show Repro Steps'}</span>
          </button>

          {/* Export Sheet 1 to CSV button */}
          <button
            id="btn-export-sheet1-csv"
            type="button"
            onClick={handleExportSheet1Csv}
            className="h-9 btn-secondary inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-700 rounded-md hover:text-sky-700 hover:border-sky-300 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none cursor-pointer shadow-2xs"
            title="Download Sheet 1 as CSV file"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
            <span>Export Sheet 1 (.csv)</span>
          </button>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <label htmlFor="table-search-input" className="sr-only">
              Search work items by ID, title, description, or tags
            </label>
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="table-search-input"
              name="table_search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, title, steps, tags..."
              className="h-9 w-full pl-8 pr-3 text-xs rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 p-3 sm:p-3.5 bg-slate-50/80 border-b border-slate-200 text-xs" role="search" aria-label="Work item filters">
        {/* Module / Page */}
        <div>
          <label htmlFor="filter-module-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Module / Page
          </label>
          <select
            id="filter-module-select"
            name="filter_module"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="h-9 w-full px-2.5 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:border-sky-500 focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="">All Modules ({uniqueModules.length})</option>
            {uniqueModules.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label htmlFor="filter-state-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            State
          </label>
          <select
            id="filter-state-select"
            name="filter_state"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="h-9 w-full px-2.5 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:border-sky-500 focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="">All States ({masterBugs.length})</option>
            {uniqueStates.map((s) => {
              const count = getStateCount(s);
              return (
                <option key={s} value={s}>
                  {s} {count > 0 ? `(${count})` : '(0)'}
                </option>
              );
            })}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label htmlFor="filter-severity-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Severity
          </label>
          <select
            id="filter-severity-select"
            name="filter_severity"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="h-9 w-full px-2.5 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:border-sky-500 focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="">All Severities ({uniqueSeverities.length})</option>
            {uniqueSeverities.map((sev) => (
              <option key={sev} value={sev}>{sev}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="filter-priority-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Priority
          </label>
          <select
            id="filter-priority-select"
            name="filter_priority"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-9 w-full px-2.5 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:border-sky-500 focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="">All Priorities ({uniquePriorities.length})</option>
            {uniquePriorities.map((pri) => (
              <option key={pri} value={String(pri)}>Priority {pri} (P{pri})</option>
            ))}
          </select>
        </div>

        {/* Assignee */}
        <div>
          <label htmlFor="filter-assignee-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Assignee
          </label>
          <select
            id="filter-assignee-select"
            name="filter_assignee"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="h-9 w-full px-2.5 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:border-sky-500 focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="">All Assignees ({assignees.length})</option>
            {assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Created By */}
        <div>
          <label htmlFor="filter-reporter-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Created By
          </label>
          <select
            id="filter-reporter-select"
            name="filter_reporter"
            value={selectedReporter}
            onChange={(e) => setSelectedReporter(e.target.value)}
            className="h-9 w-full px-2.5 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:border-sky-500 focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="">All Creators ({creators.length})</option>
            {creators.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Created Date */}
        <div>
          <label htmlFor="filter-date-input" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Created Date
          </label>
          <input
            id="filter-date-input"
            name="filter_date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 w-full px-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:border-sky-500 focus:outline-none shadow-2xs cursor-pointer"
          />
        </div>

        {/* Reset Action */}
        <div className="flex items-end">
          <button
            id="btn-reset-filters"
            type="button"
            onClick={onResetFilters}
            className="h-9 btn-secondary w-full inline-flex items-center justify-center gap-1.5 rounded-md font-medium text-xs focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Active Metric Filter Banner */}
      {activeMetricFilter && activeMetricFilter !== 'all' && (
        <div className="px-4 py-2 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sky-900">
            <span className="font-semibold text-slate-700">Active Metric Filter:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white border border-sky-200 font-bold text-sky-800 text-[11px] shadow-2xs">
              {activeMetricFilter === 'open' && 'Open / New'}
              {activeMetricFilter === 'active' && 'Active / Committed / Approved'}
              {activeMetricFilter === 'critical' && 'Critical & High Severity'}
              {activeMetricFilter === 'closed' && 'Resolved & Closed (Done)'}
            </span>
            <span className="text-slate-500 tabular-nums">({bugs.length} items shown)</span>
          </div>
          {onClearMetricFilter && (
            <button
              id="btn-clear-metric-filter"
              type="button"
              onClick={onClearMetricFilter}
              className="text-xs text-sky-700 hover:text-sky-900 font-semibold underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Clear Filter (Show All {masterBugs.length} Items)</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Table Container - Full View High Density */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs" aria-label="Azure DevOps Work Items">
          <caption className="sr-only">Live retrieved Azure DevOps bugs and work items</caption>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-display font-semibold uppercase tracking-wider text-[11px]">
              <th scope="col" className="py-2.5 px-3.5 w-[95px] whitespace-nowrap">ID &amp; Type</th>
              <th scope="col" className="py-2.5 px-3.5 min-w-[260px]">Title</th>
              {showReproColumn && (
                <th scope="col" className="py-2.5 px-3.5 min-w-[280px]">Reproduction Steps</th>
              )}
              <th scope="col" className="py-2.5 px-3.5 text-center w-[115px] whitespace-nowrap">State</th>
              <th scope="col" className="py-2.5 px-3.5 text-center w-[115px] whitespace-nowrap">Severity</th>
              <th scope="col" className="py-2.5 px-3.5 text-center w-[70px] whitespace-nowrap">Pri</th>
              <th scope="col" className="py-2.5 px-3.5 min-w-[190px]">Module / Page</th>
              <th scope="col" className="py-2.5 px-3.5 min-w-[140px]">Assignee</th>
              <th scope="col" className="py-2.5 px-3.5 min-w-[140px]">Created By</th>
              <th scope="col" className="py-2.5 px-3.5 min-w-[135px] whitespace-nowrap">Created Date</th>
              <th scope="col" className="py-2.5 px-3.5 text-right w-[90px] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bugs.length === 0 ? (
              <tr>
                <td colSpan={showReproColumn ? 11 : 10} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-7 h-7 stroke-1 text-slate-300" aria-hidden="true" />
                    <p className="text-sm font-medium text-slate-600">No work items match the current filters or query.</p>
                    <button
                      id="btn-empty-reset-filters"
                      type="button"
                      onClick={onResetFilters}
                      className="text-xs text-sky-600 font-semibold hover:underline mt-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                    >
                      Reset all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedBugs.map((b, idx) => {
                const stateStyle = getStateBadge(b.state);
                return (
                  <tr
                    key={b.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    {/* ID & Work Item Type */}
                    <th scope="row" className="py-2.5 px-3.5 font-mono font-semibold text-sky-700 tabular-nums whitespace-nowrap font-normal text-left">
                      <div className="flex flex-col items-start gap-1">
                        <span className="bg-sky-50 px-2 py-0.5 rounded border border-sky-200/70 text-xs font-semibold">
                          #{b.id}
                        </span>
                        <span className="text-[10px] font-sans uppercase font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {b.work_item_type || 'Bug'}
                        </span>
                      </div>
                    </th>

                    {/* Title */}
                    <td className="py-2.5 px-3.5">
                      <button
                        id={`btn-bug-title-${b.id}`}
                        type="button"
                        onClick={() => onSelectBug(b)}
                        className="text-left font-medium text-slate-900 hover:text-sky-700 transition-colors line-clamp-2 cursor-pointer leading-snug focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                      >
                        {b.title}
                      </button>

                      {b.tags && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {b.tags.split(';').slice(0, 4).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Reproduction Steps */}
                    {showReproColumn && (
                      <td className="py-2.5 px-3.5 max-w-[300px]">
                        {b.repro_steps ? (
                          <button
                            id={`btn-repro-steps-${b.id}`}
                            type="button"
                            onClick={() => onSelectBug(b)}
                            className="text-left w-full group cursor-pointer block"
                            title="Click to view full reproduction steps and acceptance criteria"
                          >
                            <div className="text-slate-700 font-mono text-[11px] line-clamp-2 leading-relaxed bg-slate-50 group-hover:bg-sky-50 group-hover:text-sky-900 group-hover:border-sky-300 p-1.5 rounded border border-slate-200 transition-colors">
                              {b.repro_steps.replace(/\*Description\*|\*Steps to Reproduce\*|h3\./gi, '').trim()}
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No repro steps</span>
                        )}
                      </td>
                    )}

                    {/* State */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${stateStyle.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stateStyle.dot}`} aria-hidden="true" />
                        <span>{b.state}</span>
                      </span>
                    </td>

                    {/* Severity */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] border ${getSeverityBadge(b.severity)}`}>
                        {b.severity}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <span className="font-mono tabular-nums font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                        P{b.priority}
                      </span>
                    </td>

                    {/* Module / Page dropdown */}
                    <td className="py-2.5 px-3.5">
                      <div className="relative">
                        <label htmlFor={`select-module-${b.id}`} className="sr-only">
                          Override module classification for Bug #{b.id}
                        </label>
                        <select
                          id={`select-module-${b.id}`}
                          name={`module_${b.id}`}
                          value={b.page_name || 'Unclassified'}
                          disabled={updatingId === b.id}
                          onChange={(e) => handlePageChange(b.id, e.target.value)}
                          className={`w-full py-1 pl-2 pr-6 text-xs rounded border transition-colors focus:outline-none appearance-none cursor-pointer ${
                            b.manual_page_override
                              ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                          title={b.manual_page_override ? 'Manually classified override (saved in database)' : 'Auto-classified module'}
                        >
                          {HRMS_PAGES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" aria-hidden="true">
                          {updatingId === b.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap">
                      <div className="font-medium text-slate-900 truncate max-w-[170px]" title={b.assigned_to || 'Unassigned'}>
                        {b.assigned_to || 'Unassigned'}
                      </div>
                      {b.assigned_to_email && (
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]">
                          {b.assigned_to_email}
                        </div>
                      )}
                    </td>

                    {/* Created By */}
                    <td className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap">
                      <div className="font-medium text-slate-900 truncate max-w-[160px]" title={b.reporter || 'Unknown'}>
                        {b.reporter || 'Unknown'}
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-2.5 px-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTime(b.created_date)}
                    </td>

                    {/* Actions - Enterprise Action Buttons */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`btn-bug-details-${b.id}`}
                          type="button"
                          onClick={() => onSelectBug(b)}
                          className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                          title="View Bug Details & QA Summary"
                        >
                          <FileText className="w-3 h-3 text-slate-500" aria-hidden="true" />
                          <span>Details</span>
                        </button>
                        {b.bug_url && (
                          <a
                            id={`link-bug-azure-${b.id}`}
                            href={b.bug_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-slate-100 border border-transparent transition-colors cursor-pointer inline-flex items-center focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                            title="Open in Azure DevOps Boards"
                            aria-label={`Open Bug #${b.id} in Azure DevOps Boards`}
                          >
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="p-3.5 sm:p-4 border-t border-slate-200/90 bg-white flex flex-col md:flex-row items-center justify-between gap-3 text-xs select-none">
          {/* Summary & Rows Per Page Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-slate-600 font-sans">
              Showing <span className="font-semibold text-slate-900 tabular-nums">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 tabular-nums">{endIndex}</span> of{' '}
              <span className="font-semibold text-slate-900 tabular-nums">{totalItems}</span> items
            </div>

            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <label htmlFor="select-page-size" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Rows:
              </label>
              <select
                id="select-page-size"
                name="page_size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded-md bg-white border border-slate-300 text-slate-800 text-xs font-semibold focus:border-sky-500 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Controls */}
          <nav aria-label="Table pagination navigation" className="flex items-center gap-1">
            <button
              id="btn-page-first"
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage === 1}
              className="h-8 w-8 btn-secondary inline-flex items-center justify-center rounded-md disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="First Page"
              aria-label="Go to first page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              id="btn-page-prev"
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validCurrentPage === 1}
              className="h-8 px-2.5 btn-secondary inline-flex items-center gap-1 rounded-md disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
              title="Previous Page"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 px-1">
              {getPageNumbers(validCurrentPage, totalPages).map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-mono select-none">
                      ...
                    </span>
                  );
                }
                const pageNum = p as number;
                const isActive = pageNum === validCurrentPage;
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`Go to page ${pageNum}`}
                    className={`h-8 min-w-[32px] px-2 rounded-md font-medium tabular-nums transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              id="btn-page-next"
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage === totalPages}
              className="h-8 px-2.5 btn-secondary inline-flex items-center gap-1 rounded-md disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
              title="Next Page"
              aria-label="Go to next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              id="btn-page-last"
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage === totalPages}
              className="h-8 w-8 btn-secondary inline-flex items-center justify-center rounded-md disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Last Page"
              aria-label="Go to last page"
            >
              <ChevronsRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}
    </section>
  );
};
