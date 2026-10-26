import { getAllBugs, getBug, upsertBug, getLastSyncLog, getSyncLogs } from '../database/index.js';
import { summarizeBug } from '../integrations/ai/ai-service.js';
import { AzureDevOpsClient } from '../integrations/azure-devops/azure-client.js';
import { HRMS_PAGES } from './classifier.js';
import { trackerService } from '../integrations/excel/tracker-service.js';
import { syncService } from './sync-service.js';
import type { ChatResponse } from '../types/index.js';

const ID_REGEX = /\b\d{3,7}\b/g;

export async function processChatMessage(message: string): Promise<ChatResponse> {
  const msg = message.trim();
  const msgLower = msg.toLowerCase();
  const foundIds = (msg.match(ID_REGEX) || []).map(i => parseInt(i, 10));

  // 1. Sync Now Intent
  if (['sync all', 'sync now', 'update the tracker', 'update tracker', 'synchronize', 'sync azure', 'raise bug', 'rise bug', 'raised bug', 'rised bug', 'new bug', 'sync bug'].some(k => msgLower.includes(k))) {
    const res = await syncService.syncNow('incremental');
    if (res.success || res.excel_open_warning) {
      let reply =
        `### 🔄 Synchronization Complete!\n\n` +
        `- **Timestamp:** \`${res.timestamp}\`\n` +
        `- **Duration:** ${res.duration_seconds}s\n` +
        `- **New Bugs Inserted:** ${res.new_bugs_inserted}\n` +
        `- **Existing Bugs Updated:** ${res.existing_bugs_updated}\n` +
        `- **Total Azure Bugs Processed:** ${res.total_found}\n` +
        `- **Primary Tracker:** \`${res.tracker_file || ''}\`\n\n` +
        `All affected report sheets, Developer Scorecards, and UI/Functional breakdowns have been updated in place.`;

      if (res.excel_open_warning) {
        reply += '\n\n⚠️ *Note: The primary Excel workbook is currently open in Microsoft Excel. Please close Excel — your updates are queued and will be saved automatically directly to your workbook as soon as Excel closes.*';
      }
      return { reply, action_type: 'SYNC_SUCCESS', data: res };
    } else {
      return {
        reply: `❌ Synchronization failed: ${res.message || 'Unknown error'}`,
        action_type: 'SYNC_ERROR',
        data: res,
      };
    }
  }

  // 2. Last Sync Status Intent
  if (['last sync', 'last successful sync', 'sync status', 'when was the last'].some(k => msgLower.includes(k))) {
    const lastLog = getLastSyncLog();
    if (!lastLog) {
      return { reply: "No synchronization has been run yet. Type *'Sync all new bugs'* or click **Sync Now** to start." };
    }
    let reply =
      `### ⏱️ Last Synchronization Status\n\n` +
      `- **Time:** ${lastLog.timestamp}\n` +
      `- **Status:** \`${lastLog.status}\`\n` +
      `- **Mode:** ${lastLog.mode}\n` +
      `- **Duration:** ${lastLog.duration_seconds}s\n` +
      `- **New Bugs Added:** ${lastLog.new_inserted}\n` +
      `- **Existing Bugs Updated:** ${lastLog.existing_updated}\n` +
      `- **Total Bugs Checked:** ${lastLog.total_found}\n`;

    if (lastLog.error_message) {
      reply += `- **Errors:** ${lastLog.error_message}`;
    }
    return { reply, action_type: 'SYNC_STATUS', data: lastLog };
  }

  // 3. Synchronization Errors Intent
  if (['sync error', 'synchronization error', 'sync issues'].some(k => msgLower.includes(k))) {
    const logs = getSyncLogs(10);
    const errorLogs = logs.filter(l => ['ERROR', 'EXCEPTION'].includes(l.status) || Boolean(l.error_message));
    if (errorLogs.length === 0) {
      return { reply: '✅ Great news! There are **0 synchronization errors** recorded in recent runs.' };
    }
    const lines = errorLogs.map(l => `- **${l.timestamp}** \`[${l.status}]\`: ${l.error_message || 'Check details'}`);
    const reply = `Found **${errorLogs.length}** synchronization error(s) in recent logs:\n\n` + lines.join('\n');
    return { reply, action_type: 'SYNC_ERRORS' };
  }

  // 4. Status Changed Intent
  if (['status change', 'status changed', 'state change', 'state changed'].some(k => msgLower.includes(k))) {
    const lastLog = getLastSyncLog();
    let changes: any[] = [];
    if (lastLog?.details_json) {
      try {
        const details = JSON.parse(lastLog.details_json);
        changes = details.status_changes || [];
      } catch {
        // Continue
      }
    }
    if (changes.length > 0) {
      const lines = changes.slice(0, 15).map(c => `- **Bug #${c.id}** (${(c.title || '').slice(0, 40)}...): \`${c.old_state}\` ➔ **\`${c.new_state}\`**`);
      const reply = `### Bugs with Recent Status Changes (${changes.length}):\n\n` + lines.join('\n');
      return { reply, action_type: 'STATUS_CHANGES', data: { changes } };
    } else {
      return { reply: "No bug status changes were detected in the most recent synchronization. Run *'Sync all new bugs'* to pull the latest state updates from Azure Boards." };
    }
  }

  // 5. Fetch Intent
  const isBareNumber = /^[\s,#\d]+$/.test(msg) && foundIds.length > 0;
  const hasFetchKeyword = ['fetch', 'retrieve', 'get', 'pull', 'show bug', 'find bug', 'bug', '#', 'raise', 'rise', 'raised', 'rised'].some(k => msgLower.includes(k));

  if (foundIds.length > 0 && (isBareNumber || hasFetchKeyword) && !['summarize', 'summary'].some(k => msgLower.includes(k))) {
    const client = new AzureDevOpsClient();
    if (foundIds.length === 1) {
      const bugId = foundIds[0];
      const [bug, err] = await client.fetchSingleBug(bugId);
      if (bug) {
        const saved = upsertBug(bug);
        const trackerRes = await trackerService.syncBugsToTracker([saved]);
        return {
          reply:
            `✅ Fetched **Bug #${saved.id}** from Azure DevOps:\n\n` +
            `**Title:** ${saved.title}\n\n` +
            `- **Module/Page:** \`${saved.page_name}\`\n` +
            `- **State:** \`${saved.state}\`\n` +
            `- **Severity:** \`${saved.severity}\` | **Priority:** \`P${saved.priority}\`\n` +
            `- **Assigned To:** ${saved.assigned_to}\n` +
            `- **Area Path:** ${saved.area_path || 'Root'}\n\n` +
            `*(Automatically saved to database and synchronized with your QA Tracker workbook)*`,
          action_type: 'FETCH_BUG',
          data: { bug: saved, tracker: trackerRes },
        };
      } else {
        return {
          reply: `❌ Could not retrieve Bug #${bugId} from Azure DevOps.\n\n**Details:** ${err || 'Work item not found in current project.'}`,
          action_type: 'ERROR',
        };
      }
    } else {
      const [bugs, failed] = await client.fetchBulkBugs(foundIds);
      const savedList = bugs.map(b => upsertBug(b));
      if (savedList.length > 0) {
        await trackerService.syncBugsToTracker(savedList);
      }
      let reply = `✅ Fetched **${savedList.length}** bug(s) successfully and synced to your QA Tracker.`;
      if (failed.length > 0) {
        reply += `\n\n⚠️ Failed or inaccessible IDs (${failed.length}): ${failed.map(f => f.id).join(', ')}`;
      }
      return {
        reply,
        action_type: 'BULK_FETCH',
        data: { bugs: savedList, failed },
      };
    }
  }

  // 6. Summarize Intent
  if (['summarize', 'summary', 'explain bug', 'ai summary'].some(k => msgLower.includes(k))) {
    if (foundIds.length > 0) {
      const bugId = foundIds[0];
      let bug = getBug(bugId);
      if (!bug) {
        const client = new AzureDevOpsClient();
        const [fetchedBug] = await client.fetchSingleBug(bugId);
        if (fetchedBug) bug = upsertBug(fetchedBug);
      }
      if (bug) {
        const sumRes = await summarizeBug(bug);
        const stepsTxt = sumRes.suggested_testing_steps.map(s => `  - ${s}`).join('\n');
        const reply =
          `### Summary for Bug #${bug.id} - ${bug.title}\n\n` +
          `**Short Summary:** ${sumRes.short_summary}\n\n` +
          `**Actual Issue:** ${sumRes.actual_issue}\n\n` +
          `**Expected Behavior:** ${sumRes.expected_behavior}\n\n` +
          `**Impact:** ${sumRes.impact}\n\n` +
          `**Suggested QA Testing Steps:**\n${stepsTxt}\n\n` +
          `*(Source: ${sumRes.source})*`;
        return {
          reply,
          action_type: 'SUMMARIZE',
          data: { summary: sumRes },
        };
      } else {
        return { reply: `Bug #${bugId} could not be found to summarize.` };
      }
    }
  }

  // 7. Bugs Assigned to Specific Person
  const assignedMatch = msgLower.match(/assigned to\s+([a-zA-Z\s]+)/);
  if (assignedMatch && !['assigned to each', 'how many', 'distribution'].some(k => msgLower.includes(k))) {
    const targetName = assignedMatch[1].trim();
    if (!['each', 'each person', 'anyone', 'everyone', 'me', 'who', 'whom'].includes(targetName)) {
      const allBugs = getAllBugs();
      const matchedBugs = allBugs.filter(b => (b.assigned_to || '').toLowerCase().includes(targetName));
      if (matchedBugs.length > 0) {
        const lines = matchedBugs.slice(0, 15).map(b => `- **Bug #${b.id}** (${b.page_name}): ${b.title} \`[${b.state} | ${b.severity}]\``);
        const capitalized = targetName.charAt(0).toUpperCase() + targetName.slice(1);
        const reply = `Found **${matchedBugs.length}** bug(s) assigned to **${capitalized}**:\n\n` + lines.join('\n');
        return { reply, action_type: 'SHOW_BUGS', data: { assignee: targetName } };
      } else {
        const capitalized = targetName.charAt(0).toUpperCase() + targetName.slice(1);
        return { reply: `No bugs found assigned to '${capitalized}' in the local database. Try running *'Sync all new bugs'* to retrieve the latest work item assignments.` };
      }
    }
  }

  // 8. Closed Bugs for Page
  if (msgLower.includes('closed')) {
    for (const page of HRMS_PAGES) {
      const cleanPageKey = page.toLowerCase().replace('module', '').replace('page', '').trim();
      if (msgLower.includes(cleanPageKey)) {
        const allBugs = getAllBugs();
        const pageClosed = allBugs.filter(
          b => (b.page_name || '').toLowerCase() === page.toLowerCase() && ['closed', 'done', 'resolved'].includes((b.state || '').toLowerCase())
        );
        if (pageClosed.length > 0) {
          const lines = pageClosed.slice(0, 15).map(b => `- **Bug #${b.id}**: ${b.title} (Closed Date: ${b.closed_date || 'Recorded'})`);
          const reply = `Found **${pageClosed.length}** closed bug(s) for **${page}**:\n\n` + lines.join('\n');
          return { reply, action_type: 'SHOW_BUGS', data: { page, status: 'closed' } };
        } else {
          return { reply: `No closed bugs found for **${page}** in the synchronized dataset.` };
        }
      }
    }
  }

  // 9. Open Bugs / Total Open Count
  if (msgLower.includes('open') && (msgLower.includes('how many') || msgLower.includes('count') || msgLower.includes('open bug') || msgLower.includes('all open'))) {
    const allBugs = getAllBugs();
    const openBugs = allBugs.filter(b => ['new', 'proposed', 'to do', 'active', 'in progress', 'committed', 'approved'].includes((b.state || '').toLowerCase()));
    const lines = openBugs.slice(0, 15).map(b => `- **Bug #${b.id}** (${b.page_name}): ${b.title} \`[${b.state} | ${b.severity}]\``);
    let reply = `There are currently **${openBugs.length}** open bug(s) across all modules:\n\n` + lines.join('\n');
    if (openBugs.length > 15) {
      reply += `\n\n*...and ${openBugs.length - 15} more in the main dashboard table.*`;
    }
    return { reply, action_type: 'SHOW_BUGS', data: { filter: 'open' } };
  }

  // 10. Page / Module Report
  for (const page of HRMS_PAGES) {
    const cleanPageKey = page.toLowerCase().replace('module', '').replace('page', '').trim();
    if (msgLower.includes(cleanPageKey) && ['report', 'bugs in', 'for the', 'summary'].some(w => msgLower.includes(w))) {
      const allBugs = getAllBugs();
      const pageBugs = allBugs.filter(b => (b.page_name || '').toLowerCase() === page.toLowerCase());
      const openCnt = pageBugs.filter(b => ['new', 'active', 'in progress', 'to do', 'approved', 'committed'].includes((b.state || '').toLowerCase())).length;
      const closedCnt = pageBugs.filter(b => ['closed', 'resolved', 'done'].includes((b.state || '').toLowerCase())).length;
      const critCnt = pageBugs.filter(b => String(b.severity || '').includes('1') || String(b.severity || '').includes('2') || String(b.severity || '').toLowerCase().includes('critical') || String(b.severity || '').toLowerCase().includes('high')).length;

      const lines = pageBugs.slice(0, 10).map(b => `  - **#${b.id}** ${b.title} \`[${b.state} | ${b.severity}]\``);
      const bugListText = lines.length > 0 ? lines.join('\n') : '  *(No specific bugs loaded for this module yet)*';

      const reply =
        `### HRMS Module Report: **${page}**\n\n` +
        `- **Total Bugs:** ${pageBugs.length}\n` +
        `- **Open / Active:** ${openCnt}\n` +
        `- **Closed / Resolved:** ${closedCnt}\n` +
        `- **Critical / High Severity:** ${critCnt}\n\n` +
        `**Work Items:**\n${bugListText}\n\n` +
        `*This module breakdown is synchronized live in your QA Tracker workbook.*`;
      return { reply, action_type: 'PAGE_REPORT', data: { page_name: page } };
    }
  }

  // 11. Assignee Distribution
  if (['assigned to each', 'how many bugs are assigned', 'assignee', 'workload', 'who has'].some(k => msgLower.includes(k))) {
    const allBugs = getAllBugs();
    const assignees: Record<string, { total: number; open: number }> = {};
    for (const b of allBugs) {
      const person = b.assigned_to || 'Unassigned';
      if (!assignees[person]) {
        assignees[person] = { total: 0, open: 0 };
      }
      assignees[person].total++;
      if (['new', 'active', 'in progress', 'to do', 'approved', 'committed'].includes((b.state || '').toLowerCase())) {
        assignees[person].open++;
      }
    }

    if (Object.keys(assignees).length === 0) {
      return { reply: 'No bugs have been retrieved into the system yet.' };
    }

    const lines = Object.entries(assignees)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([person, stats]) => `- **${person}**: ${stats.total} total (${stats.open} active/open)`);
    const reply = '### Bug Distribution by Assignee:\n\n' + lines.join('\n');
    return { reply, action_type: 'ASSIGNEE_METRICS' };
  }

  // 12. General Total or Overview
  if (['how many bugs', 'total bug', 'overview', 'status', 'stats'].some(k => msgLower.includes(k))) {
    const allBugs = getAllBugs();
    const openCnt = allBugs.filter(b => ['new', 'active', 'in progress', 'to do', 'approved', 'committed'].includes((b.state || '').toLowerCase())).length;
    const closedCnt = allBugs.filter(b => ['closed', 'done', 'resolved'].includes((b.state || '').toLowerCase())).length;
    const critCnt = allBugs.filter(b => String(b.severity || '').includes('1') || String(b.severity || '').toLowerCase().includes('critical')).length;

    const reply =
      `Currently tracking **${allBugs.length}** bugs in the system.\n` +
      `- Open/Active: ${openCnt}\n` +
      `- Closed: ${closedCnt}\n` +
      `- Critical: ${critCnt}\n\n` +
      `You can ask me to sync all new bugs, fetch specific bug IDs, or view module reports!`;
    return { reply };
  }

  // Fallback instructions
  return {
    reply:
      'I can help you query, synchronize, and analyze your Azure DevOps QA Tracker! Try asking:\n' +
      "- *'Sync all new bugs'*\n" +
      "- *'Fetch bug 12025'*\n" +
      "- *'Show bugs whose status changed'*\n" +
      "- *'Update the tracker now'*\n" +
      "- *'How many bugs are open?'*\n" +
      "- *'Show closed bugs for Login Page'*\n" +
      "- *'Show bugs assigned to Boopathi'*\n" +
      "- *'When was the last successful sync?'*\n" +
      "- *'Show synchronization errors'*",
  };
}
