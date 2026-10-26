import { getAllBugs } from '../database/index.js';
import type { BugItem, ReportSummary, PageSummaryRow, AssigneeSummaryRow } from '../types/index.js';

export function buildReportSummary(bugs?: BugItem[]): ReportSummary {
  const bugList = bugs || getAllBugs();

  const totalBugs = bugList.length;
  let openBugs = 0;
  let activeBugs = 0;
  let resolvedBugs = 0;
  let closedBugs = 0;
  let criticalBugs = 0;
  let highPriorityBugs = 0;

  const severityCounts: Record<string, number> = {
    '1 - Critical': 0,
    '2 - High': 0,
    '3 - Medium': 0,
    '4 - Low': 0,
  };

  const priorityCounts: Record<string, number> = {
    'Priority 1': 0,
    'Priority 2': 0,
    'Priority 3': 0,
    'Priority 4': 0,
  };

  const stateCounts: Record<string, number> = {};

  const pageMap: Record<string, { total: number; open: number; active: number; closed: number; critical: number; high_pri: number }> = {};
  const assigneeMap: Record<string, { total: number; open: number; active: number; closed: number; critical: number }> = {};

  for (const b of bugList) {
    const st = b.state || 'New';
    const stLower = st.toLowerCase();
    stateCounts[st] = (stateCounts[st] || 0) + 1;

    if (['new', 'proposed', 'to do'].includes(stLower)) {
      openBugs++;
    } else if (['active', 'in progress', 'committed', 'investigating'].includes(stLower)) {
      activeBugs++;
    } else if (['resolved', 'fixed'].includes(stLower)) {
      resolvedBugs++;
    } else if (['closed', 'done', 'completed'].includes(stLower)) {
      closedBugs++;
    }

    // Severity
    const sev = String(b.severity || '').toLowerCase();
    let isCrit = false;
    if (sev.includes('1') || sev.includes('critical')) {
      severityCounts['1 - Critical']++;
      criticalBugs++;
      isCrit = true;
    } else if (sev.includes('2') || sev.includes('high')) {
      severityCounts['2 - High']++;
      criticalBugs++;
      isCrit = true;
    } else if (sev.includes('4') || sev.includes('low')) {
      severityCounts['4 - Low']++;
    } else {
      severityCounts['3 - Medium']++;
    }

    // Priority
    const pri = b.priority ?? 2;
    const isHighPri = pri === 1;
    if (pri === 1) {
      priorityCounts['Priority 1']++;
      highPriorityBugs++;
    } else if (pri === 3) {
      priorityCounts['Priority 3']++;
    } else if (pri === 4) {
      priorityCounts['Priority 4']++;
    } else {
      priorityCounts['Priority 2']++;
    }

    // Page aggregation
    const pName = b.page_name || 'Unclassified';
    if (!pageMap[pName]) {
      pageMap[pName] = { total: 0, open: 0, active: 0, closed: 0, critical: 0, high_pri: 0 };
    }
    pageMap[pName].total++;
    if (['new', 'proposed', 'to do'].includes(stLower)) {
      pageMap[pName].open++;
    } else if (['active', 'in progress', 'committed', 'investigating'].includes(stLower)) {
      pageMap[pName].active++;
    } else if (['closed', 'done', 'completed', 'resolved', 'fixed'].includes(stLower)) {
      pageMap[pName].closed++;
    }
    if (isCrit) pageMap[pName].critical++;
    if (isHighPri) pageMap[pName].high_pri++;

    // Assignee aggregation
    const assignee = b.assigned_to || 'Unassigned';
    if (!assigneeMap[assignee]) {
      assigneeMap[assignee] = { total: 0, open: 0, active: 0, closed: 0, critical: 0 };
    }
    assigneeMap[assignee].total++;
    if (['new', 'proposed', 'to do'].includes(stLower)) {
      assigneeMap[assignee].open++;
    } else if (['active', 'in progress', 'committed', 'investigating'].includes(stLower)) {
      assigneeMap[assignee].active++;
    } else if (['closed', 'done', 'completed', 'resolved', 'fixed'].includes(stLower)) {
      assigneeMap[assignee].closed++;
    }
    if (isCrit) assigneeMap[assignee].critical++;
  }

  const pageRows: PageSummaryRow[] = Object.keys(pageMap)
    .sort()
    .map(k => ({
      page_name: k,
      total_bugs: pageMap[k].total,
      open_bugs: pageMap[k].open,
      active_bugs: pageMap[k].active,
      closed_bugs: pageMap[k].closed,
      critical_bugs: pageMap[k].critical,
      high_priority_bugs: pageMap[k].high_pri,
    }));

  const assigneeRows: AssigneeSummaryRow[] = Object.keys(assigneeMap)
    .sort()
    .map(k => ({
      assigned_to: k,
      total_bugs: assigneeMap[k].total,
      open_bugs: assigneeMap[k].open,
      active_bugs: assigneeMap[k].active,
      closed_bugs: assigneeMap[k].closed,
      critical_bugs: assigneeMap[k].critical,
    }));

  return {
    generated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    total_bugs: totalBugs,
    open_bugs: openBugs,
    active_bugs: activeBugs,
    resolved_bugs: resolvedBugs,
    closed_bugs: closedBugs,
    critical_severity_bugs: criticalBugs,
    high_priority_bugs: highPriorityBugs,
    page_breakdown: pageRows,
    assignee_breakdown: assigneeRows,
    severity_breakdown: severityCounts,
    priority_breakdown: priorityCounts,
    state_breakdown: stateCounts,
  };
}
