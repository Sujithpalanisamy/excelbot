import { Router } from 'express';
import {
  FetchSingleSchema,
  FetchBulkSchema,
  SummarizeSchema,
  PageClassificationUpdateSchema,
} from '../validators/schemas.js';
import { AzureDevOpsClient } from '../integrations/azure-devops/azure-client.js';
import {
  upsertBug,
  getBug,
  getAllBugs,
  setManualPage,
  reloadBugsCache,
  clearAllBugs,
} from '../database/index.js';
import { trackerService } from '../integrations/excel/tracker-service.js';
import { summarizeBug } from '../integrations/ai/ai-service.js';
import type { BugItem } from '../types/index.js';

export const bugsRouter = Router();

function parseIdsFromText(text: string): number[] {
  const matches = text.match(/\b\d+\b/g) || [];
  const ids: number[] = [];
  for (const m of matches) {
    const val = parseInt(m, 10);
    if (!isNaN(val) && val > 0) {
      ids.push(val);
    }
  }
  return Array.from(new Set(ids));
}

bugsRouter.post('/fetch', async (req, res, next) => {
  try {
    const parsed = FetchSingleSchema.parse(req.body);
    const client = new AzureDevOpsClient();
    const [bug, err] = await client.fetchSingleBug(parsed.bug_id);

    if (err || !bug) {
      res.json({
        success: false,
        message: err || `Bug #${parsed.bug_id} could not be retrieved.`,
        excel_updated: false,
      });
      return;
    }

    const savedBug = upsertBug(bug);
    const trackerRes = await trackerService.syncBugsToTracker([savedBug]);

    res.json({
      success: true,
      bug: savedBug,
      message: trackerRes.excel_open_warning
        ? `Bug #${savedBug.id} retrieved from Azure DevOps. ${trackerRes.message}`
        : `Successfully fetched Bug #${savedBug.id} from Azure DevOps and synced with QA Tracker.`,
      excel_updated: trackerRes.success,
      excel_path: trackerRes.tracker_file || null,
      excel_open_warning: trackerRes.excel_open_warning || false,
    });
  } catch (err) {
    next(err);
  }
});

bugsRouter.post('/bulk-fetch', async (req, res, next) => {
  try {
    const parsed = FetchBulkSchema.parse(req.body);
    const rawIds: number[] = [];

    if (parsed.bug_ids) {
      rawIds.push(...parsed.bug_ids);
    }
    if (parsed.input_text) {
      rawIds.push(...parseIdsFromText(parsed.input_text));
    }

    const uniqueIds = Array.from(new Set(rawIds.filter(i => i > 0)));

    if (uniqueIds.length === 0) {
      res.status(400).json({
        detail: "No valid Bug IDs provided. Please enter comma-separated numbers (e.g. '12025, 11963, 11956').",
      });
      return;
    }

    const client = new AzureDevOpsClient();
    const [successfulBugs, failedRecords] = await client.fetchBulkBugs(uniqueIds);

    const savedBugs: BugItem[] = [];
    for (const b of successfulBugs) {
      const saved = upsertBug(b);
      savedBugs.push(saved);
    }

    let excelOk = false;
    let excelPath = '';
    let excelWarning = false;
    let trackerMsg = '';
    if (savedBugs.length > 0) {
      const trackerRes = await trackerService.syncBugsToTracker(savedBugs);
      excelOk = trackerRes.success;
      excelPath = trackerRes.tracker_file;
      excelWarning = Boolean(trackerRes.excel_open_warning);
      trackerMsg = trackerRes.message;
    }

    let message = `Fetched ${savedBugs.length} of ${uniqueIds.length} requested bug(s).`;
    if (failedRecords.length > 0) {
      message += ` (${failedRecords.length} failed or not found)`;
    }
    if (excelWarning) {
      message += ` ${trackerMsg}`;
    }

    res.json({
      total_requested: uniqueIds.length,
      successful_count: savedBugs.length,
      failed_count: failedRecords.length,
      bugs: savedBugs,
      failed_ids: failedRecords,
      excel_updated: excelOk,
      excel_path: excelPath || null,
      excel_open_warning: excelWarning,
      message,
    });
  } catch (err) {
    next(err);
  }
});

bugsRouter.get('/', (req, res, next) => {
  try {
    const search = req.query.search ? String(req.query.search) : '';
    const page_name = req.query.page_name ? String(req.query.page_name) : '';
    const state = req.query.state ? String(req.query.state) : '';
    const severity = req.query.severity ? String(req.query.severity) : '';
    const priority = req.query.priority !== undefined && req.query.priority !== '' ? parseInt(String(req.query.priority), 10) : undefined;
    const assigned_to = req.query.assigned_to ? String(req.query.assigned_to) : '';

    const bugs = getAllBugs({
      search,
      page_name,
      state,
      severity,
      priority,
      assigned_to,
    });

    res.json(bugs);
  } catch (err) {
    next(err);
  }
});

bugsRouter.get('/:bugId', (req, res, next) => {
  try {
    const bugId = parseInt(req.params.bugId, 10);
    if (isNaN(bugId) || bugId <= 0) {
      res.status(400).json({ detail: 'Invalid Bug ID parameter.' });
      return;
    }

    const bug = getBug(bugId);
    if (!bug) {
      res.status(404).json({ detail: `Bug #${bugId} not found in local database.` });
      return;
    }

    res.json(bug);
  } catch (err) {
    next(err);
  }
});

bugsRouter.post('/:bugId/classify', async (req, res, next) => {
  try {
    const bugId = parseInt(req.params.bugId, 10);
    const parsed = PageClassificationUpdateSchema.parse(req.body);

    if (bugId !== parsed.bug_id) {
      res.status(400).json({ detail: 'Mismatched bug ID in URL and body.' });
      return;
    }

    const bug = getBug(bugId);
    if (!bug) {
      res.status(404).json({ detail: `Bug #${bugId} not found.` });
      return;
    }

    const updated = setManualPage(bugId, parsed.page_name);
    if (!updated) {
      res.status(500).json({ detail: 'Failed to update classification.' });
      return;
    }

    const refreshedBug = getBug(bugId);
    if (refreshedBug) {
      await trackerService.syncBugsToTracker([refreshedBug]);
    }

    res.json({ success: true, bug_id: bugId, page_name: parsed.page_name });
  } catch (err) {
    next(err);
  }
});

bugsRouter.post('/summarize', async (req, res, next) => {
  try {
    const parsed = SummarizeSchema.parse(req.body);

    let bug = getBug(parsed.bug_id);
    if (!bug) {
      const client = new AzureDevOpsClient();
      const [fetchedBug, err] = await client.fetchSingleBug(parsed.bug_id);
      if (!fetchedBug) {
        res.status(404).json({ detail: err || `Bug #${parsed.bug_id} not found.` });
        return;
      }
      bug = upsertBug(fetchedBug);
    }

    const summary = await summarizeBug(bug, parsed.force_refresh, parsed.use_local_only);

    bug.ai_summary = summary.short_summary;
    upsertBug(bug);
    await trackerService.syncBugsToTracker([bug]);

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

bugsRouter.post('/deduplicate', async (_req, res, next) => {
  try {
    const count = await reloadBugsCache();
    const uniqueBugs = getAllBugs();
    res.json({
      success: true,
      message: `Database cache deduplicated and reloaded. ${uniqueBugs.length} unique work items available.`,
      unique_count: uniqueBugs.length,
      raw_cache_count: count,
    });
  } catch (err) {
    next(err);
  }
});

bugsRouter.delete('/', async (_req, res, next) => {
  try {
    await clearAllBugs();
    res.json({
      success: true,
      message: 'All bugs cleared from database.',
      count: 0,
    });
  } catch (err) {
    next(err);
  }
});

