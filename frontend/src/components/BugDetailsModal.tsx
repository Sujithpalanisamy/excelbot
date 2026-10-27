import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  ClipboardCheck, 
  FileText, 
  CheckSquare, 
  ShieldAlert, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import type { BugItem, SummaryDetail } from '../types';

interface BugDetailsModalProps {
  bug: BugItem;
  summary: SummaryDetail | null;
  onClose: () => void;
  onSummarize: (bugId: number, forceRefresh?: boolean) => Promise<void>;
  isLoadingSummary: boolean;
}

export const BugDetailsModal: React.FC<BugDetailsModalProps> = ({
  bug,
  summary,
  onClose,
  onSummarize,
  isLoadingSummary,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'summary'>('details');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-details-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-slate-200 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                ID: {bug.id}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                {bug.work_item_type}
              </span>
              <span className="text-xs font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {bug.page_name}
              </span>
            </div>
            <h2 id="bug-details-modal-title" className="text-base sm:text-lg font-bold font-display text-slate-900 leading-snug">
              {bug.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {bug.bug_url && (
              <a
                id="link-azure-devops-modal"
                href={bug.bug_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                <span>Azure DevOps</span>
              </a>
            )}
            <button
              id="btn-close-bug-details"
              type="button"
              onClick={onClose}
              aria-label="Close bug details modal"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 mb-4" role="tablist" aria-label="Bug details and QA analysis tabs">
          <button
            id="tab-btn-bug-details"
            role="tab"
            aria-selected={activeTab === 'details'}
            aria-controls="panel-bug-details"
            type="button"
            onClick={() => setActiveTab('details')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
              activeTab === 'details'
                ? 'btn-sky text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Bug Information</span>
          </button>

          <button
            id="tab-btn-bug-summary"
            role="tab"
            aria-selected={activeTab === 'summary'}
            aria-controls="panel-bug-summary"
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
              activeTab === 'summary'
                ? 'btn-sky text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>QA Analysis & Summary</span>
          </button>
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === 'details' && (
          <div id="panel-bug-details" role="tabpanel" aria-labelledby="tab-btn-bug-details" className="space-y-4">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">State</span>
                <span className="font-semibold text-slate-800">{bug.state}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Severity</span>
                <span className="font-semibold text-slate-800">{bug.severity}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Priority</span>
                <span className="font-semibold text-slate-800 font-mono">Priority {bug.priority}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Assigned To</span>
                <span className="font-semibold text-slate-800 truncate block">{bug.assigned_to || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Reporter</span>
                <span className="font-semibold text-slate-800 truncate block">{bug.reporter || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Created Date</span>
                <span className="font-semibold text-slate-800 font-mono">{bug.created_date || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Area Path</span>
                <span className="font-semibold text-slate-800 truncate block">{bug.area_path || 'Root'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Iteration</span>
                <span className="font-semibold text-slate-800 truncate block">{bug.iteration_path || 'Default'}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                Description
              </h3>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {bug.description || 'No description provided for this work item.'}
              </div>
            </div>

            {/* Repro Steps */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                Reproduction Steps
              </h3>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                {bug.repro_steps || 'No reproduction steps provided.'}
              </div>
            </div>

            {/* Acceptance Criteria */}
            {bug.acceptance_criteria && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                  Acceptance Criteria
                </h3>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {bug.acceptance_criteria}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI SUMMARY */}
        {activeTab === 'summary' && (
          <div id="panel-bug-summary" role="tabpanel" aria-labelledby="tab-btn-bug-summary">
            {!summary ? (
              <div className="text-center py-10 px-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 mx-auto mb-2.5 border border-slate-200" aria-hidden="true">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold font-display text-slate-900 mb-1">
                  No QA Summary Generated Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Generate an instant QA breakdown covering actual vs expected behavior, impact analysis, and suggested test steps.
                </p>
                <button
                  id="btn-generate-qa-summary"
                  type="button"
                  onClick={() => onSummarize(bug.id, true)}
                  disabled={isLoadingSummary}
                  className="btn-sky inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                >
                  {isLoadingSummary ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ClipboardCheck className="w-4 h-4" aria-hidden="true" />}
                  <span>{isLoadingSummary ? 'Analyzing...' : 'Generate QA Summary Now'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Privacy Badge */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-sky-600" aria-hidden="true" />
                    <span>{summary.privacy_note}</span>
                  </div>
                  <button
                    id="btn-reanalyze-qa-summary"
                    type="button"
                    onClick={() => onSummarize(bug.id, true)}
                    disabled={isLoadingSummary}
                    className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                  >
                    <RotateCcw className={`w-3 h-3 text-slate-600 ${isLoadingSummary ? 'animate-spin' : ''}`} aria-hidden="true" />
                    <span>Re-analyze</span>
                  </button>
                </div>

                {/* Short Summary Card */}
                <div className="p-3.5 rounded-lg bg-sky-50/50 border border-sky-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block mb-0.5">
                    Executive Summary
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-slate-900">
                    {summary.short_summary}
                  </div>
                </div>

                {/* Actual vs Expected Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-rose-50/50 border border-rose-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-0.5">
                      Actual Issue Observed
                    </span>
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {summary.actual_issue}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-0.5">
                      Expected Behavior
                    </span>
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {summary.expected_behavior}
                    </div>
                  </div>
                </div>

                {/* Impact */}
                <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
                    Operational & Business Impact
                  </span>
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {summary.impact}
                  </div>
                </div>

                {/* Testing Steps */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Suggested Next QA Testing Steps
                  </span>
                  <div className="space-y-1 text-xs sm:text-sm text-slate-800">
                    {summary.suggested_testing_steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-sky-600 font-bold">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 text-right">
                  Engine: {summary.source}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
