import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { MetricsOverview } from './components/MetricsOverview';
import { BugInputPanel } from './components/BugInputPanel';
import { BugTable } from './components/BugTable';
import { BugDetailsModal } from './components/BugDetailsModal';
import { ChatPanel } from './components/ChatPanel';
import { ReportModal } from './components/ReportModal';
import { SettingsModal } from './components/SettingsModal';
import { SheetTabs } from './components/SheetTabs';
import { DashboardSheet } from './components/DashboardSheet';
import { AzureImportSheet } from './components/AzureImportSheet';
import { BugTrackerSheet } from './components/BugTrackerSheet';
import { BugLifecycleSheet } from './components/BugLifecycleSheet';
import { PendingWithDeveloperSheet } from './components/PendingWithDeveloperSheet';
import { ReportCatalogSheet } from './components/ReportCatalogSheet';
import { ExecutiveReportSheet } from './components/ExecutiveReportSheet';
import { AlertTriangle } from 'lucide-react';
import type { BugItem, SettingsStatusResponse, SummaryDetail, ChatMessage, SettingsUpdateRequest } from './types';
import { ALL_27_SHEETS } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [bugs, setBugs] = useState<BugItem[]>([]);
  const [settings, setSettings] = useState<SettingsStatusResponse | null>(null);
  const [selectedBug, setSelectedBug] = useState<BugItem | null>(null);
  const [currentSummary, setCurrentSummary] = useState<SummaryDetail | null>(null);

  // Active Sheet in Excel 27-Sheet Workspace
  const [activeSheetId, setActiveSheetId] = useState<number>(1);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  // Loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncInfo, setLastSyncInfo] = useState('');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedReporter, setSelectedReporter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [activeMetricFilter, setActiveMetricFilter] = useState('all');

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Load bugs & settings
  const loadData = useCallback(async () => {

    setIsRefreshing(true);
    try {
      const [fetchedBugs, fetchedSettings, syncStatus] = await Promise.all([
        api.getBugs(),
        api.getSettingsStatus(),
        api.getSyncStatus().catch(() => null),
      ]);

      // Deduplicate bugs list by unique ID and normalized title
      const seenIds = new Set<number>();
      const seenTitles = new Set<string>();
      const uniqueBugs: BugItem[] = [];
      for (const b of fetchedBugs) {
        if (seenIds.has(b.id)) continue;
        const normTitle = (b.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (normTitle && seenTitles.has(normTitle)) continue;
        seenIds.add(b.id);
        if (normTitle) seenTitles.add(normTitle);
        uniqueBugs.push(b);
      }

      setBugs(uniqueBugs);
      setSettings(fetchedSettings);
      if (syncStatus?.last_sync?.timestamp) {
        setLastSyncInfo(`${syncStatus.last_sync.new_inserted} new, ${syncStatus.last_sync.existing_updated} updated (${syncStatus.last_sync.timestamp})`);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setSettings(null);
    } finally {
      setIsRefreshing(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch single bug handler
  const handleFetchSingle = async (bugId: number) => {
    setIsLoading(true);
    try {
      const res = await api.fetchSingleBug(bugId);
      if (res.bug) {
        // Refresh list
        await loadData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch bulk bugs handler
  const handleFetchBulk = async (inputText: string) => {
    setIsLoading(true);
    try {
      await api.fetchBulkBugs(inputText);
      await loadData();
    } finally {
      setIsLoading(false);
    }
  };

  // Sync Now handler (Fetches all bugs pin-to-pin, end-to-end)
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncNow('full');
      if (res.success) {
        setLastSyncInfo(`${res.total_found} bugs synced end-to-end (${res.timestamp})`);
        await loadData();
      } else if (res.excel_open_warning) {
        alert(res.message);
        await loadData();
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Summarize bug handler
  const handleSummarizeBug = async (bugId: number, forceRefresh = false) => {
    setIsLoadingSummary(true);
    try {
      const targetBug = bugs.find(b => b.id === bugId);
      if (targetBug) {
        setSelectedBug(targetBug);
      }
      const summary = await api.summarizeBug(bugId, forceRefresh);
      setCurrentSummary(summary);
      await loadData(); // refresh short summaries in table
    } catch (err) {
      console.error('Summarize error:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Select bug for view modal
  const handleSelectBug = (bug: BugItem) => {
    setSelectedBug(bug);
    if (bug.ai_summary) {
      try {
        const parsed = JSON.parse(bug.ai_summary);
        setCurrentSummary(parsed);
      } catch {
        // If stored as string
        setCurrentSummary({
          bug_id: bug.id,
          short_summary: bug.ai_summary,
          actual_issue: bug.description || bug.title,
          expected_behavior: bug.acceptance_criteria || 'Standard functionality',
          impact: `Severity: ${bug.severity}`,
          suggested_testing_steps: [
            '1. Reproduce in staging environment.',
            '2. Verify boundary values.',
            '3. Check server error logs.',
            '4. Execute regression tests.'
          ],
          source: 'Saved Summary',
          privacy_note: 'Stored in local database.'
        });
      }
    } else {
      setCurrentSummary(null);
    }
  };

  // Classification override
  const handleUpdateClassification = async (bugId: number, pageName: string) => {
    try {
      await api.updateClassification(bugId, pageName);
      setBugs(prev => prev.map(b => b.id === bugId ? { ...b, page_name: pageName } : b));
    } catch (err) {
      console.error('Failed to update classification:', err);
    }
  };

  // Export to Excel handler
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await api.exportToExcel();
      alert(`Excel Export Successful!\nSaved to: ${res.excel_path}\nTotal Bugs: ${res.total_bugs}`);
    } catch (err: any) {
      alert(`Failed to export Excel: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Download Excel handler
  const handleDownloadExcel = () => {
    window.open(api.getExcelDownloadUrl(), '_blank');
  };

  // Save Settings handler
  const handleSaveSettings = async (updated: SettingsUpdateRequest) => {
    await api.updateSettings(updated);
    await loadData();
  };

  // Chat message handler
  const handleSendChatMessage = async (msgText: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await api.sendChatMessage(msgText);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action_type: response.action_type,
        data: response.data
      };
      setChatMessages(prev => [...prev, botMsg]);

      // If an action changed data, refresh bugs
      if (['FETCH_BUG', 'BULK_FETCH', 'SUMMARIZE'].includes(response.action_type || '')) {
        await loadData();
      }
      if (response.action_type === 'PAGE_REPORT' && response.data?.page_name) {
        setSelectedPage(response.data.page_name);
      }
      if (response.action_type === 'SHOW_BUGS' && response.data?.filter === 'critical') {
        setSelectedSeverity('1 - Critical');
      }
      if (response.action_type === 'SHOW_BUGS' && response.data?.filter === 'open') {
        setSelectedState('New');
      }
    } catch (err: any) {
      const isNetworkError = (err?.message || '').toLowerCase().includes('failed to fetch') || err?.name === 'TypeError';
      const content = isNetworkError
        ? '⚠️ Cannot reach the backend server (http://127.0.0.1:8000). Please start the backend service using `start_demo.bat` or `npm run dev`.'
        : `Error: ${err.message || 'Unable to connect to assistant.'}`;
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {

      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPage('');
    setSelectedState('');
    setSelectedSeverity('');
    setSelectedPriority('');
    setSelectedAssignee('');
    setSelectedReporter('');
    setSelectedDate('');
    setActiveMetricFilter('all');
  };

  // Apply filters to table display
  const filteredBugs = bugs.filter(b => {
    // Quick metric filter
    if (activeMetricFilter === 'open' && !['new', 'proposed', 'to do'].includes((b.state || '').toLowerCase())) return false;
    if (activeMetricFilter === 'active' && !['active', 'in progress', 'committed', 'approved', 'investigating'].includes((b.state || '').toLowerCase())) return false;
    if (activeMetricFilter === 'closed' && !['closed', 'done', 'completed', 'resolved', 'fixed'].includes((b.state || '').toLowerCase())) return false;
    if (activeMetricFilter === 'critical') {
      const s = (b.severity || '').toLowerCase();
      if (!s.includes('1') && !s.includes('critical') && !s.includes('2') && !s.includes('high')) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = b.id.toString().includes(q);
      const matchTitle = (b.title || '').toLowerCase().includes(q);
      const matchDesc = (b.description || '').toLowerCase().includes(q);
      const matchRepro = (b.repro_steps || '').toLowerCase().includes(q);
      const matchTags = (b.tags || '').toLowerCase().includes(q);
      const matchReporter = (b.reporter || '').toLowerCase().includes(q);
      const matchAssignee = (b.assigned_to || '').toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchDesc && !matchRepro && !matchTags && !matchReporter && !matchAssignee) return false;
    }

    // Specific filters
    if (selectedPage && b.page_name !== selectedPage) return false;
    if (selectedState) {
      const s = (b.state || '').trim().toLowerCase();
      const sel = selectedState.trim().toLowerCase();
      if (sel === 'new') {
        if (!['new', 'proposed', 'to do'].includes(s)) return false;
      } else if (sel === 'approved') {
        if (s !== 'approved') return false;
      } else if (sel === 'committed') {
        if (s !== 'committed') return false;
      } else if (sel === 'active') {
        if (!['active', 'in progress', 'investigating'].includes(s)) return false;
      } else if (sel === 'resolved') {
        if (!['resolved', 'fixed'].includes(s)) return false;
      } else if (sel === 'done') {
        if (s !== 'done') return false;
      } else if (sel === 'closed') {
        if (!['closed', 'completed'].includes(s)) return false;
      } else {
        if (s !== sel) return false;
      }
    }
    if (selectedSeverity) {
      const bSev = (b.severity || '').toLowerCase();
      const selSev = selectedSeverity.toLowerCase();
      const normSev = (str: string) => {
        if (str.includes('1') || str.includes('critical')) return 'critical';
        if (str.includes('2') || str.includes('high')) return 'high';
        if (str.includes('3') || str.includes('medium')) return 'medium';
        if (str.includes('4') || str.includes('low')) return 'low';
        return str.trim();
      };
      if (normSev(bSev) !== normSev(selSev)) return false;
    }
    if (selectedPriority) {
      const bPri = Number(String(b.priority).replace(/\D/g, ''));
      const selPri = Number(String(selectedPriority).replace(/\D/g, ''));
      if (bPri !== selPri) return false;
    }
    if (selectedAssignee && b.assigned_to !== selectedAssignee) return false;
    if (selectedReporter && b.reporter !== selectedReporter) return false;
    if (selectedDate) {
      const bDate = (b.created_date || '').slice(0, 10);
      if (bDate !== selectedDate) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      {/* Top Navigation Bar */}
      <Navbar
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onExportExcel={handleExportExcel}
        onDownloadExcel={handleDownloadExcel}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
        lastSyncInfo={lastSyncInfo}
        isExporting={isExporting}
      />

      {/* Main Container - Full View */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1">
        {/* Backend Offline Warning Banner */}
        {!settings && !isRefreshing && (
          <div className="bg-white border-l-4 border-l-rose-600 border border-slate-200 rounded-xl p-4 sm:p-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div>
              <div className="font-bold text-rose-700 text-sm flex items-center gap-2 font-display">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Backend Server Offline (Port 8000)</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                The backend service is required to communicate with Azure DevOps, run the AI Chatbot, and sync Excel sheets.
                Launch it by running <code className="text-sky-700 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">npm run dev</code> in your backend directory.
              </div>
            </div>
            <button
              id="btn-retry-backend-connection"
              type="button"
              onClick={() => loadData()}
              className="btn-sky px-3.5 py-1.5 text-xs font-semibold rounded-md cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Excel 27-Sheet Workspace Tabs Strip */}
        <SheetTabs
          activeSheetId={activeSheetId}
          onSelectSheet={setActiveSheetId}
          totalBugsCount={bugs.length}
        />

        {activeSheetId === 1 ? (
          <>
            {/* Metric Cards */}
            <MetricsOverview
              bugs={bugs}
              activeFilter={activeMetricFilter}
              onSelectFilter={(f) => setActiveMetricFilter(f)}
            />

            {/* Bug Input & Actions Hub */}
            <BugInputPanel
              onFetchSingle={handleFetchSingle}
              onFetchBulk={handleFetchBulk}
              onExportExcel={handleExportExcel}
              onOpenPageReport={() => setIsReportOpen(true)}
              onSyncNow={handleSyncNow}
              isSyncing={isSyncing}
              lastSyncInfo={lastSyncInfo}
              isLoading={isLoading}
            />

            {/* Chatbot Panel */}
            <ChatPanel
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              onClearHistory={handleClearChat}
              isLoading={isChatLoading}
            />

            {/* Work Items Table - Sheet 1: All Bugs */}
            <BugTable
              bugs={filteredBugs}
              allBugs={bugs}
              activeMetricFilter={activeMetricFilter}
              onClearMetricFilter={() => setActiveMetricFilter('all')}
              onSelectBug={handleSelectBug}
              onUpdateClassification={handleUpdateClassification}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedPage={selectedPage}
              setSelectedPage={setSelectedPage}
              selectedState={selectedState}
              setSelectedState={setSelectedState}
              selectedSeverity={selectedSeverity}
              setSelectedSeverity={setSelectedSeverity}
              selectedPriority={selectedPriority}
              setSelectedPriority={setSelectedPriority}
              selectedAssignee={selectedAssignee}
              setSelectedAssignee={setSelectedAssignee}
              selectedReporter={selectedReporter}
              setSelectedReporter={setSelectedReporter}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onResetFilters={handleResetFilters}
            />
          </>
        ) : activeSheetId === 2 ? (
          <DashboardSheet
            allBugs={bugs}
            onDownloadExcel={handleDownloadExcel}
            onNavigateToSheet1WithFilter={(fType, fVal) => {
              setActiveSheetId(1);
              if (fType === 'metric') setActiveMetricFilter(fVal);
              if (fType === 'page') setSelectedPage(fVal);
              if (fType === 'developer') setSelectedAssignee(fVal);
            }}
          />
        ) : activeSheetId === 4 ? (
          <AzureImportSheet
            onDownloadExcel={handleDownloadExcel}
            onNavigateToSheet1WithFilter={(fType, fVal) => {
              setActiveSheetId(1);
              if (fType === 'developer') setSelectedAssignee(fVal);
              if (fType === 'page') setSelectedPage(fVal);
            }}
          />
        ) : activeSheetId === 5 ? (
          <BugTrackerSheet
            onDownloadExcel={handleDownloadExcel}
            onNavigateToSheet1WithFilter={(fType, fVal) => {
              setActiveSheetId(1);
              if (fType === 'developer') setSelectedAssignee(fVal);
              if (fType === 'page') setSelectedPage(fVal);
            }}
          />
        ) : activeSheetId === 8 ? (
          <BugLifecycleSheet
            onDownloadExcel={handleDownloadExcel}
            onNavigateToSheet1WithFilter={(fType, fVal) => {
              setActiveSheetId(1);
              if (fType === 'page') setSelectedPage(fVal);
            }}
          />
        ) : activeSheetId === 21 ? (
          <ReportCatalogSheet />
        ) : activeSheetId === 24 ? (
          <PendingWithDeveloperSheet
            onDownloadExcel={handleDownloadExcel}
            onNavigateToSheet1WithFilter={(fType, fVal) => {
              setActiveSheetId(1);
              if (fType === 'developer') setSelectedAssignee(fVal);
              if (fType === 'page') setSelectedPage(fVal);
            }}
          />
        ) : activeSheetId === 27 ? (
          <ExecutiveReportSheet
            allBugs={bugs}
            onDownloadExcel={handleDownloadExcel}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100 font-bold text-xl font-display shadow-2xs">
              #{activeSheetId}
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 mb-2">
              Sheet {activeSheetId}: {ALL_27_SHEETS.find(s => s.id === activeSheetId)?.name}
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
              {ALL_27_SHEETS.find(s => s.id === activeSheetId)?.description}
            </p>
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium mb-6 text-left space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Step-by-Step Transition Plan:
              </div>
              <p>
                We are building each of the 27 Excel sheets directly inside this application one by one.
                Currently, <strong>Sheet 1 (All Bugs)</strong>, <strong>Sheet 2 (Dashboard)</strong>, <strong>Sheet 21 (Reports Catalog)</strong>, and <strong>Sheet 27 (Executive Report)</strong> are live with real-time calculations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSheetId(1)}
              className="btn-sky px-5 py-2.5 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer inline-flex items-center gap-2"
            >
              <span>Go to Sheet 1: All Bugs</span>
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedBug && (
        <BugDetailsModal
          bug={selectedBug}
          summary={currentSummary}
          onClose={() => setSelectedBug(null)}
          onSummarize={(id, force) => handleSummarizeBug(id, force)}
          isLoadingSummary={isLoadingSummary}
        />
      )}

      {isReportOpen && (
        <ReportModal
          onClose={() => setIsReportOpen(false)}
          allBugs={bugs}
          onDownloadExcel={handleDownloadExcel}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          currentSettings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        />
      )}

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 text-slate-500 text-xs py-3 px-6 lg:px-8 text-center font-sans">
        Azure Bug Assistant • Enterprise Defect Tracking & Excel Bridge • REST API v7.1
      </footer>
    </div>
  );
};

export default App;
