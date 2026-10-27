import React, { useState } from 'react';
import {
  Search,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';

interface BugInputPanelProps {
  onFetchSingle: (id: number) => Promise<void>;
  onFetchBulk: (inputText: string) => Promise<void>;
  onExportExcel?: () => Promise<void>;
  onOpenPageReport?: () => void;
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncInfo?: string;
  isLoading: boolean;
}

export const BugInputPanel: React.FC<BugInputPanelProps> = ({
  onFetchSingle,
  onFetchBulk,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleFetch = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setStatusMessage({ type: 'error', text: 'Please enter at least one Azure DevOps Bug ID.' });
      return;
    }

    setStatusMessage(null);

    // Single integer
    if (/^\d+$/.test(trimmed)) {
      const bugId = parseInt(trimmed, 10);
      try {
        await onFetchSingle(bugId);
        setStatusMessage({ type: 'success', text: `Successfully retrieved details for Bug #${bugId} and synced with Excel.` });
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err.message || `Failed to fetch Bug #${bugId}` });
      }
    } else {
      // Bulk fetch
      try {
        await onFetchBulk(trimmed);
        setStatusMessage({ type: 'success', text: 'Processed multiple bug IDs. Excel workbook updated.' });
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err.message || 'Failed bulk fetch' });
      }
    }
  };

  const setSampleIds = (sample: string) => {
    setInputText(sample);
  };

  return (
    <section id="integration-hub-section" aria-labelledby="hub-heading" className="w-full enterprise-card p-4 sm:p-5 mb-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3.5">
        <div>
          <h2 id="hub-heading" className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-700 shadow-2xs" aria-hidden="true">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <span>Azure DevOps Integration Hub</span>
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Query work items directly via Azure DevOps REST API v7.1 and keep Excel database in sync
          </p>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Sample Bug IDs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Quick Sample:</span>
          <button
            id="btn-sample-101"
            type="button"
            aria-label="Use sample bug ID 101"
            onClick={() => setSampleIds('101')}
            className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            #101
          </button>
          <button
            id="btn-sample-batch"
            type="button"
            aria-label="Use sample batch bug IDs 102, 103, 104"
            onClick={() => setSampleIds('102, 103, 104')}
            className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            Batch 102-104
          </button>
          <button
            id="btn-sample-bulk"
            type="button"
            aria-label="Use sample bulk bug IDs"
            onClick={() => setSampleIds('105, 106, 107, 108, 109, 110')}
            className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            Bulk HRMS IDs
          </button>
        </div>
      </div>

      {/* Input Group */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-2.5">
        <div className="relative flex-1">
          <label htmlFor="input-work-item-ids" className="sr-only">
            Azure DevOps Bug IDs
          </label>
          <input
            id="input-work-item-ids"
            name="work_item_ids"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFetch();
            }}
            placeholder="Enter Single Bug ID (e.g. 101) or Bulk Comma/Space Separated IDs (e.g. 101, 102, 103)..."
            className="h-10 w-full px-3.5 text-xs sm:text-sm rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none transition-all font-mono shadow-2xs"
          />
          {inputText && (
            <button
              type="button"
              aria-label="Clear input"
              onClick={() => setInputText('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center">
          <button
            id="btn-fetch-work-items"
            type="button"
            onClick={handleFetch}
            disabled={isLoading || !inputText.trim()}
            className="h-10 btn-sky inline-flex items-center justify-center gap-1.5 px-4 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all w-full sm:w-auto cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shrink-0"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Search className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>Fetch Work Item(s)</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-sky-50 text-sky-800 border-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
