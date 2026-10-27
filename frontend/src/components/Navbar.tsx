import React from 'react';
import { 
  Settings, 
  FileSpreadsheet, 
  RefreshCw,
  Layers
} from 'lucide-react';
import type { SettingsStatusResponse } from '../types';

interface NavbarProps {
  settings: SettingsStatusResponse | null;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  onExportExcel?: () => void;
  onDownloadExcel?: () => void;
  onExportAndDownload?: () => void;
  onSyncNow?: () => void;
  isSyncing?: boolean;
  lastSyncInfo?: string;
  isExporting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenSettings,
  onOpenReport,
  onExportExcel,
  onDownloadExcel,
  onExportAndDownload,
  onSyncNow,
  isSyncing = false,
  lastSyncInfo,
  isExporting,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-2.5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] transition-all">
      <div className="w-full flex items-center justify-between flex-wrap gap-y-3 gap-x-4">
        {/* Brand & PeopleWorks Logo */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Transparent Logo */}
          <div 
            id="company-logo-slot" 
            className="flex items-center justify-center shrink-0 select-none transition-opacity hover:opacity-90"
            title="PeopleWorks™"
          >
            <img 
              src="/peopleworks-logo.png" 
              alt="PeopleWorks" 
              className="h-7 sm:h-8 w-auto max-w-[180px] sm:max-w-[220px] object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = '/company-logo.png';
              }} 
            />
          </div>

          {/* Elegant Divider between Logo & Product Suite */}
          <div className="hidden sm:block h-7 w-px bg-slate-200" aria-hidden="true" />

          {/* Product Identification */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display leading-tight">
                Azure Bug Assistant
              </h1>
              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 leading-none">
                REST API v7.1
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans font-medium leading-normal mt-0.5">
              Azure Boards to Excel Bridge • Page-wise Classification & QA Intelligence
            </p>
          </div>
        </div>

        {/* Action Controls / Toolbar - Perfectly Aligned */}
        <nav aria-label="Toolbar controls" className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          {/* Status Indicator */}
          {settings && (
            <div 
              className="h-9 hidden md:inline-flex items-center gap-2 text-xs bg-slate-50 px-3 rounded-lg border border-slate-200 text-slate-700 shadow-2xs" 
              role="status" 
              aria-label="Connection Status"
            >
              <span className={`w-2 h-2 rounded-full ${settings.mock_mode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} aria-hidden="true" />
              <span>
                {settings.mock_mode ? (
                  <span className="text-amber-700 font-semibold">Mock Mode</span>
                ) : (
                  <span>
                    Connected:{' '}
                    <strong className="text-slate-900 font-semibold">
                      {settings.project || settings.organization}
                    </strong>
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Sync Now Button */}
          {onSyncNow && (
            <button
              id="btn-sync-now"
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              title={lastSyncInfo ? `Last sync: ${lastSyncInfo}` : 'Synchronize Azure Bugs to Excel'}
              className="h-9 btn-sky inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-lg disabled:opacity-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}

          {/* 1-Click Export & Download .xlsx */}
          <button
            id="btn-export-download-excel"
            type="button"
            onClick={onExportAndDownload || onDownloadExcel || onExportExcel}
            disabled={isExporting}
            className="h-9 btn-sky inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shrink-0 disabled:opacity-60 shadow-2xs"
            title="Generate latest data and download full 27-sheet Excel workbook to your computer"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{isExporting ? 'Generating Excel...' : 'Export & Download .xlsx'}</span>
          </button>

          {/* QA Report */}
          <button
            id="btn-qa-report"
            type="button"
            onClick={onOpenReport}
            className="h-9 btn-secondary inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shrink-0"
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <span>QA Report</span>
          </button>

          {/* Settings */}
          <button
            id="btn-open-settings"
            type="button"
            onClick={onOpenSettings}
            className="h-9 w-9 btn-secondary inline-flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shrink-0"
            title="Settings"
            aria-label="Application Settings"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </header>
  );
};
