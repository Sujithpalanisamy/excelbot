import type { 
  BugItem, SummaryDetail, ReportSummary, DashboardExcelData,
  PendingWithDeveloperData, BugLifecycleData, AzureImportItem, BugTrackerItem,
  ReopenAnalysisData, ModuleQualityData, BugAgingData, ModuleUiVsFunctionalData, PageSummaryData,
  SettingsStatusResponse, SettingsUpdateRequest, ChatResponse 
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

export const api = {
  // Bugs
  async getBugs(params?: {
    search?: string;
    page_name?: string;
    state?: string;
    severity?: string;
    priority?: number;
    assigned_to?: string;
  }): Promise<BugItem[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page_name) query.append('page_name', params.page_name);
    if (params?.state) query.append('state', params.state);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.priority !== undefined && params?.priority !== null) {
      query.append('priority', params.priority.toString());
    }
    if (params?.assigned_to) query.append('assigned_to', params.assigned_to);

    const res = await fetch(`${API_BASE}/bugs?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to load bugs (${res.status})`);
    return res.json();
  },

  async getBugDetails(id: number): Promise<BugItem> {
    const res = await fetch(`${API_BASE}/bugs/${id}`);
    if (!res.ok) throw new Error(`Failed to load details for bug #${id}`);
    return res.json();
  },

  async fetchSingleBug(bugId: number): Promise<{ success: boolean; bug?: BugItem; message: string; excel_updated: boolean }> {
    const res = await fetch(`${API_BASE}/bugs/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bug_id: bugId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch bug' }));
      throw new Error(err.detail || 'Error connecting to Azure DevOps');
    }
    return res.json();
  },

  async fetchBulkBugs(inputText: string): Promise<{
    total_requested: number;
    successful_count: number;
    failed_count: number;
    bugs: BugItem[];
    failed_ids: Array<{ id: number; error: string }>;
    excel_updated: boolean;
    excel_path?: string;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/bugs/bulk-fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_text: inputText }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed bulk fetch' }));
      throw new Error(err.detail || 'Error during bulk fetch');
    }
    return res.json();
  },

  async updateClassification(bugId: number, pageName: string): Promise<{ success: boolean; page_name: string }> {
    const res = await fetch(`${API_BASE}/bugs/${bugId}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bug_id: bugId, page_name: pageName }),
    });
    if (!res.ok) throw new Error('Failed to update classification');
    return res.json();
  },

  async summarizeBug(bugId: number, forceRefresh = false, useLocalOnly = false): Promise<SummaryDetail> {
    const res = await fetch(`${API_BASE}/bugs/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bug_id: bugId, force_refresh: forceRefresh, use_local_only: useLocalOnly }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to summarize' }));
      throw new Error(err.detail || 'Summarization error');
    }
    return res.json();
  },

  async deduplicateBugs(): Promise<{ success: boolean; message: string; unique_count: number; raw_cache_count: number }> {
    const res = await fetch(`${API_BASE}/bugs/deduplicate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to deduplicate bugs');
    return res.json();
  },

  // Excel
  async exportToExcel(): Promise<{ success: boolean; message: string; total_bugs: number; excel_path: string }> {
    const res = await fetch(`${API_BASE}/excel/export`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to export to Excel');
    return res.json();
  },

  getExcelDownloadUrl(): string {
    return `${API_BASE}/excel/download`;
  },

  async getExcelStatus(): Promise<{ exists: boolean; filename: string; path: string; size_bytes: number; last_modified: string }> {
    const res = await fetch(`${API_BASE}/excel/status`);
    if (!res.ok) throw new Error('Failed to get Excel status');
    return res.json();
  },

  // Reports
  async getReportSummary(): Promise<ReportSummary> {
    const res = await fetch(`${API_BASE}/reports/summary`);
    if (!res.ok) throw new Error('Failed to get report summary');
    return res.json();
  },

  async getDashboardExcelData(): Promise<DashboardExcelData> {
    const res = await fetch(`${API_BASE}/reports/dashboard-excel`);
    if (!res.ok) throw new Error('Failed to get dashboard excel data');
    return res.json();
  },

  async getPendingWithDeveloperData(): Promise<PendingWithDeveloperData> {
    const res = await fetch(`${API_BASE}/reports/pending-with-developer`);
    if (!res.ok) throw new Error('Failed to get pending with developer data');
    return res.json();
  },

  async getBugLifecycleData(): Promise<BugLifecycleData> {
    const res = await fetch(`${API_BASE}/reports/bug-lifecycle`);
    if (!res.ok) throw new Error('Failed to get bug lifecycle data');
    return res.json();
  },

  async getAzureImportData(): Promise<AzureImportItem[]> {
    const res = await fetch(`${API_BASE}/reports/azure-import`);
    if (!res.ok) throw new Error('Failed to get azure import data');
    return res.json();
  },

  async getBugTrackerData(): Promise<BugTrackerItem[]> {
    const res = await fetch(`${API_BASE}/reports/bug-tracker`);
    if (!res.ok) throw new Error('Failed to get bug tracker data');
    return res.json();
  },

  async getReopenAnalysisData(): Promise<ReopenAnalysisData> {
    const res = await fetch(`${API_BASE}/reports/reopen-analysis`);
    if (!res.ok) throw new Error('Failed to get reopen analysis data');
    return res.json();
  },

  async getModuleQualityData(): Promise<ModuleQualityData> {
    const res = await fetch(`${API_BASE}/reports/module-quality`);
    if (!res.ok) throw new Error('Failed to get module quality data');
    return res.json();
  },

  async getBugAgingData(): Promise<BugAgingData> {
    const res = await fetch(`${API_BASE}/reports/bug-aging`);
    if (!res.ok) throw new Error('Failed to get bug aging data');
    return res.json();
  },

  async getModuleUiVsFunctionalData(): Promise<ModuleUiVsFunctionalData> {
    const res = await fetch(`${API_BASE}/reports/module-ui-vs-functional`);
    if (!res.ok) throw new Error('Failed to get module UI vs functional data');
    return res.json();
  },

  async getPageSummaryData(): Promise<PageSummaryData> {
    const res = await fetch(`${API_BASE}/reports/page-summary`);
    if (!res.ok) throw new Error('Failed to get page summary data');
    return res.json();
  },

  async generatePageReport(pageName: string): Promise<{
    success: boolean;
    message: string;
    page_name: string;
    total_bugs: number;
    open_bugs: number;
    closed_bugs: number;
    critical_bugs: number;
    bugs: BugItem[];
  }> {
    const res = await fetch(`${API_BASE}/reports/page-wise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_name: pageName }),
    });
    if (!res.ok) throw new Error('Failed generating page-wise report');
    return res.json();
  },

  // Settings
  async getSettingsStatus(): Promise<SettingsStatusResponse> {
    const res = await fetch(`${API_BASE}/settings/status`);
    if (!res.ok) throw new Error('Failed to get settings');
    return res.json();
  },

  async updateSettings(settings: SettingsUpdateRequest): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/settings/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Sync
  async syncNow(mode: 'incremental' | 'full' = 'incremental'): Promise<{
    success: boolean;
    mode: string;
    timestamp: string;
    duration_seconds: number;
    total_found: number;
    new_bugs_inserted: number;
    existing_bugs_updated: number;
    status_changed_bugs: any[];
    tracker_file: string;
    backup_file: string;
    excel_open_warning?: boolean;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/sync/now`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Sync request failed' }));
      throw new Error(err.detail || 'Error connecting to sync service');
    }
    return res.json();
  },

  async getSyncStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/sync/status`);
    if (!res.ok) throw new Error('Failed to get sync status');
    return res.json();
  },

  async getSyncLogs(limit = 20): Promise<any> {
    const res = await fetch(`${API_BASE}/sync/logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to get sync logs');
    return res.json();
  },

  // Chat
  async sendChatMessage(message: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed communicating with assistant');
    return res.json();
  },

  async getChatHistory(): Promise<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>> {
    const res = await fetch(`${API_BASE}/chat/history`);
    if (!res.ok) return [];
    return res.json();
  }
};
