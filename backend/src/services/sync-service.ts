import { AzureDevOpsClient } from '../integrations/azure-devops/azure-client.js';
import {
  upsertBugsBulk,
  saveSyncLog,
  getLastSyncLog,
  getSyncLogs,
} from '../database/index.js';
import { trackerService } from '../integrations/excel/tracker-service.js';
import type { BugItem } from '../types/index.js';

export class SyncService {
  public isSyncing = false;

  public async getChangedBugIds(
    client: AzureDevOpsClient,
    mode: 'incremental' | 'full' = 'incremental'
  ): Promise<[number[], string | null]> {
    const apiRoot = client.getApiRoot();
    const apiVer = client.getApiVersion();
    const url = `${apiRoot}/_apis/wit/wiql?api-version=${apiVer}`;

    let sinceStr = '';
    if (mode === 'incremental') {
      const lastSyncLog = getLastSyncLog();
      if (lastSyncLog?.timestamp) {
        try {
          const lastDt = new Date(lastSyncLog.timestamp);
          const sinceDt = new Date(lastDt.getTime() - 24 * 60 * 60 * 1000);
          sinceStr = sinceDt.toISOString().slice(0, 10);
        } catch {
          const fallback = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          sinceStr = fallback.toISOString().slice(0, 10);
        }
      } else {
        const fallback = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        sinceStr = fallback.toISOString().slice(0, 10);
      }
    }

    const query = mode === 'incremental'
      ? `SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [System.TeamProject] = '${client.project}' AND [System.ChangedDate] >= '${sinceStr}' ORDER BY [System.ChangedDate] DESC`
      : `SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [System.TeamProject] = '${client.project}' ORDER BY [System.Id] DESC`;

    try {
      let headers = client.getHeaders(false);
      headers['Content-Type'] = 'application/json';

      let resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(30000),
      });

      if (resp.status === 401) {
        headers = client.getHeaders(true);
        headers['Content-Type'] = 'application/json';
        resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(30000),
        });
      }

      if (resp.ok) {
        const data = (await resp.json()) as any;
        const workItems = data.workItems || [];
        const ids = workItems.map((wi: any) => wi.id).filter(Boolean);
        return [ids, null];
      } else if (resp.status === 401) {
        return [[], `Authentication failed (401). Check Azure DevOps PAT for project '${client.project}'.`];
      } else if (resp.status === 403) {
        return [[], `Permission denied (403) accessing work items for project '${client.project}'.`];
      } else {
        const body = await resp.text();
        return [[], `Azure DevOps WIQL error (${resp.status}): ${body.slice(0, 200)}`];
      }
    } catch (exc: any) {
      return [[], `Network error querying Azure DevOps: ${exc.message}`];
    }
  }

  public async fetchBugsInBatches(
    client: AzureDevOpsClient,
    bugIds: number[]
  ): Promise<[BugItem[], string[]]> {
    if (!bugIds || bugIds.length === 0) return [[], []];

    const apiRoot = client.getApiRoot();
    const apiVer = client.getApiVersion();
    const batchSize = 100;
    const allBugs: BugItem[] = [];
    const errors: string[] = [];

    const headers = client.getHeaders(false);

    for (let i = 0; i < bugIds.length; i += batchSize) {
      const chunk = bugIds.slice(i, i + batchSize);
      const idsParam = chunk.join(',');
      const batchUrl = `${apiRoot}/_apis/wit/workitems?ids=${idsParam}&api-version=${apiVer}`;

      try {
        let resp = await fetch(batchUrl, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(45000),
        });

        if (resp.status === 401) {
          resp = await fetch(batchUrl, {
            method: 'GET',
            headers: client.getHeaders(true),
            signal: AbortSignal.timeout(45000),
          });
        }

        if (resp.ok) {
          const data = (await resp.json()) as any;
          const items = data.value || [];
          for (const item of items) {
            try {
              const parsed = client.parseWorkItem(item);
              allBugs.push(parsed);
            } catch (pe: any) {
              errors.push(`Parse error for ID ${item.id}: ${pe.message}`);
            }
          }
        } else {
          errors.push(`Batch fetch error for IDs ${chunk.slice(0, 3).join(',')}...: status ${resp.status}`);
        }
      } catch (exc: any) {
        errors.push(`Network error in batch fetch: ${exc.message}`);
      }
    }

    return [allBugs, errors];
  }

  public async syncNow(mode: 'incremental' | 'full' = 'full'): Promise<any> {
    if (this.isSyncing) {
      return {
        success: false,
        message: 'A synchronization is already in progress. Please wait.',
        status: 'RUNNING',
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const startTs = new Date().toISOString().replace('T', ' ').slice(0, 19);

    try {
      const client = new AzureDevOpsClient();

      // 1. Fetch changed Bug IDs via WIQL
      const [bugIds, err] = await this.getChangedBugIds(client, mode);
      if (err) {
        const duration = Math.round(((Date.now() - startTime) / 1000) * 100) / 100;
        saveSyncLog({
          timestamp: startTs,
          mode,
          status: 'ERROR',
          duration_seconds: duration,
          total_found: 0,
          new_inserted: 0,
          existing_updated: 0,
          details: { error: err },
          error_message: err,
        });
        return {
          success: false,
          message: `Sync failed: ${err}`,
          status: 'ERROR',
          error: err,
        };
      }

      if (!bugIds || bugIds.length === 0) {
        const duration = Math.round(((Date.now() - startTime) / 1000) * 100) / 100;
        saveSyncLog({
          timestamp: startTs,
          mode,
          status: 'SUCCESS',
          duration_seconds: duration,
          total_found: 0,
          new_inserted: 0,
          existing_updated: 0,
          details: { message: 'No new or changed bugs detected in Azure DevOps.' },
          error_message: '',
        });
        return {
          success: true,
          message: 'Tracker is fully up to date. No new or changed bugs detected in Azure DevOps.',
          mode,
          timestamp: startTs,
          duration_seconds: duration,
          total_found: 0,
          new_bugs_inserted: 0,
          existing_bugs_updated: 0,
          status_changed_bugs: [],
        };
      }

      // 2. Batch fetch full bug details
      const [bugs, fetchErrors] = await this.fetchBugsInBatches(client, bugIds);

      // 3. Bulk upsert into SQLite
      upsertBugsBulk(bugs);

      // 4. Update the QA Tracker Excel workbook
      const trackerResult = await trackerService.syncBugsToTracker(bugs);

      const duration = Math.round(((Date.now() - startTime) / 1000) * 100) / 100;
      saveSyncLog({
        timestamp: startTs,
        mode,
        status: trackerResult.success ? 'SUCCESS' : 'WARNING',
        duration_seconds: duration,
        total_found: bugs.length,
        new_inserted: trackerResult.inserted_count || 0,
        existing_updated: trackerResult.updated_count || 0,
        details: {
          status_changes: trackerResult.status_changed_bugs || [],
          fetch_errors: fetchErrors,
          tracker_file: trackerResult.tracker_file,
          excel_open_warning: trackerResult.excel_open_warning,
        },
        error_message: fetchErrors.length > 0 ? fetchErrors.join('; ') : '',
      });

      return {
        success: true,
        mode,
        timestamp: startTs,
        duration_seconds: duration,
        total_found: bugs.length,
        new_bugs_inserted: trackerResult.inserted_count || 0,
        existing_bugs_updated: trackerResult.updated_count || 0,
        status_changed_bugs: trackerResult.status_changed_bugs || [],
        tracker_file: trackerResult.tracker_file,
        backup_file: trackerResult.backup_file,
        excel_open_warning: trackerResult.excel_open_warning,
        message: trackerResult.message || 'Sync completed.',
      };
    } catch (exc: any) {
      const duration = Math.round(((Date.now() - startTime) / 1000) * 100) / 100;
      saveSyncLog({
        timestamp: startTs,
        mode,
        status: 'EXCEPTION',
        duration_seconds: duration,
        total_found: 0,
        new_inserted: 0,
        existing_updated: 0,
        details: { exception: exc.message },
        error_message: exc.message,
      });
      return {
        success: false,
        message: `Sync encountered an unexpected error: ${exc.message}`,
        status: 'EXCEPTION',
        error: exc.message,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  public getStatus() {
    const lastLog = getLastSyncLog();
    return {
      is_syncing: this.isSyncing,
      last_sync: lastLog,
      auto_sync_interval_minutes: 15,
    };
  }
}

export const syncService = new SyncService();
