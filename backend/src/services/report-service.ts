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
  let reopenCount = 0;
  let uiCount = 0;
  let functionalCount = 0;

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

    const tagsLower = (b.tags || '').toLowerCase();
    if (tagsLower.includes('reopen')) {
      reopenCount++;
    }
    if (tagsLower.includes('ui') || (b.title || '').toLowerCase().includes('ui')) {
      uiCount++;
    } else {
      functionalCount++;
    }

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

  const reopenRatePercent = totalBugs > 0 ? Number(((reopenCount / totalBugs) * 100).toFixed(1)) : 0;
  const uiPercent = totalBugs > 0 ? Number(((uiCount / totalBugs) * 100).toFixed(1)) : 0;
  const functionalPercent = totalBugs > 0 ? Number(((functionalCount / totalBugs) * 100).toFixed(1)) : 0;
  const fixRatePercent = totalBugs > 0 ? Number((((resolvedBugs + closedBugs) / totalBugs) * 100).toFixed(1)) : 0;

  return {
    generated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    total_bugs: totalBugs,
    open_bugs: openBugs,
    active_bugs: activeBugs,
    resolved_bugs: resolvedBugs,
    closed_bugs: closedBugs,
    critical_severity_bugs: criticalBugs,
    high_priority_bugs: highPriorityBugs,
    reopen_count: reopenCount,
    reopen_rate_percent: reopenRatePercent,
    ui_count: uiCount,
    functional_count: functionalCount,
    ui_percent: uiPercent,
    functional_percent: functionalPercent,
    fix_rate_percent: fixRatePercent,
    page_breakdown: pageRows,
    assignee_breakdown: assigneeRows,
    severity_breakdown: severityCounts,
    priority_breakdown: priorityCounts,
    state_breakdown: stateCounts,
  };
}

export function getDashboardExcelData() {
  const summary = buildReportSummary();
  
  return {
    asOfDate: '26-Oct-2026',
    projectKpis: [
      { label: 'Total Pages', value: 260, meaning: 'All planned pages' },
      { label: 'Completed Pages', value: 151, meaning: 'Pages completed' },
      { label: 'Pending Pages', value: 109, meaning: 'Total minus completed' },
      { label: 'Overall Progress %', value: '26.9%', meaning: 'Average component completion', isProgress: true, progressPercent: 26.9 },
      { label: 'Total Bugs', value: 1045, meaning: 'All logged bugs', liveValue: summary.total_bugs },
      { label: 'Open Bugs', value: 132, meaning: 'Active bugs', liveValue: summary.open_bugs + summary.active_bugs },
      { label: 'Closed Bugs', value: 913, meaning: 'QA closed bugs', liveValue: summary.closed_bugs + summary.resolved_bugs },
      { label: '', value: '', meaning: 'Internally raised bugs' }
    ],
    qualityKpis: [
      { label: 'Development Accuracy %', value: '95.0%', meaning: 'Original development quality' },
      { label: 'Fix Accuracy %', value: '97.4%', meaning: 'Bug fix quality', liveValue: `${summary.fix_rate_percent}%` },
      { label: 'QA Accuracy %', value: '100.0%', meaning: 'Valid QA reporting quality' },
      { label: 'First Pass Yield %', value: '45.7%', meaning: 'Pages passed first time' },
      { label: 'Reopen Rate %', value: '4.4%', meaning: 'Reopens / total bugs', liveValue: `${summary.reopen_rate_percent}%` },
      { label: 'Critical Bug Rate %', value: '2.9%', meaning: 'Critical / total bugs' },
      { label: 'Bug Closure %', value: '87.4%', meaning: 'Closed / total bugs' },
      { label: 'Overall Quality KPI %', value: '91.2%', meaning: 'Weighted project quality' }
    ],
    bugStatus: [
      { status: 'New', count: 107, liveCount: summary.open_bugs },
      { status: 'Committed', count: 25, liveCount: summary.active_bugs },
      { status: 'Done', count: 913, liveCount: summary.closed_bugs + summary.resolved_bugs },
      { status: 'Total', count: 1045, isTotal: true, liveCount: summary.total_bugs }
    ],
    severity: [
      { severity: 'Critical', count: 30, liveCount: summary.severity_breakdown['1 - Critical'] || 0 },
      { severity: 'High', count: 77, liveCount: summary.severity_breakdown['2 - High'] || 0 },
      { severity: 'Medium', count: 905, liveCount: summary.severity_breakdown['3 - Medium'] || 0 },
      { severity: 'Low', count: 33, liveCount: summary.severity_breakdown['4 - Low'] || 0 }
    ],
    developerScorecard: [
      { developer: 'Raghupavan', devAccuracy: '88.0%', fixAccuracy: '0.0%', finalScore: '88.0%' },
      { developer: 'KiranKumar N', devAccuracy: '94.9%', fixAccuracy: '0.0%', finalScore: '94.9%' },
      { developer: 'Karthik R', devAccuracy: '98.6%', fixAccuracy: '0.0%', finalScore: '98.6%' },
      { developer: 'Abhishek K', devAccuracy: '99.6%', fixAccuracy: '100.0%', finalScore: '99.7%' },
      { developer: 'Adithya Kislay', devAccuracy: '98.3%', fixAccuracy: '0.0%', finalScore: '98.3%' },
      { developer: 'Vamsi chowdary', devAccuracy: '0.0%', fixAccuracy: '94.8%', finalScore: '28.4%' },
      { developer: 'Manikandan', devAccuracy: '90.3%', fixAccuracy: '0.0%', finalScore: '90.3%' },
      { developer: 'Boopathi Senthi', devAccuracy: '0.0%', fixAccuracy: '0.0%', finalScore: '0.0%' }
    ],
    moduleQuality: [
      { module: 'EDM', progress: '51.9%', accuracy: '92.7%' },
      { module: 'Shift Roster', progress: '88.9%', accuracy: '100.0%' },
      { module: 'ESS', progress: '83.3%', accuracy: '91.9%' },
      { module: 'Leave', progress: '96.7%', accuracy: '96.4%' }
    ],
    deploymentSummary: {
      dates: [
        { date: '03-Jul-2026', bugsDeployed: 2, tasksDeployed: 34, total: 36 },
        { date: '10-Jul-2026', bugsDeployed: 57, tasksDeployed: 5, total: 62 },
        { date: '17-Jul-2026', bugsDeployed: 58, tasksDeployed: 14, total: 72 },
        { date: '21-Jul-2026', bugsDeployed: 42, tasksDeployed: 0, total: 42 },
        { date: '24-Jul-2026', bugsDeployed: 46, tasksDeployed: 17, total: 63 },
        { date: '04-Aug-2026', bugsDeployed: 167, tasksDeployed: 50, total: 217 },
        { date: '10-Aug-2026', bugsDeployed: 7, tasksDeployed: 0, total: 7 },
        { date: '20-Aug-2026', bugsDeployed: 95, tasksDeployed: 149, total: 244 },
        { date: '27-Aug-2026', bugsDeployed: 43, tasksDeployed: 39, total: 82 },
        { date: '01-Sep-2026', bugsDeployed: 50, tasksDeployed: 50, total: 100 },
        { date: '08-Sep-2026', bugsDeployed: 40, tasksDeployed: 0, total: 40 },
        { date: '14-Sep-2026', bugsDeployed: 34, tasksDeployed: 23, total: 57 },
        { date: '21-Sep-2026', bugsDeployed: 86, tasksDeployed: 80, total: 166 },
        { date: '29-Sep-2026', bugsDeployed: 89, tasksDeployed: 48, total: 137 },
        { date: '05-Oct-2026', bugsDeployed: 0, tasksDeployed: 0, total: 0 }
      ],
      total: { bugsDeployed: 816, tasksDeployed: 509, total: 1325 }
    },
    bugQaStatus: [
      { status: 'Closed', count: 753 },
      { status: 'Reopened', count: 42 },
      { status: 'Pending QA', count: 22 }
    ],
    bugPriority: [
      { priority: 'P1', count: 70 },
      { priority: 'P2', count: 279 },
      { priority: 'P3', count: 129 },
      { priority: 'P4', count: 10 }
    ],
    devAgeingMatrix: {
      headers: ['Developer', '0-7 Days', '8-15 Days', '16-30 Days', '31-45 Days', '46-60 Days', '60+ Days', 'Total'],
      rows: [
        { developer: 'KiranKumar N', d0_7: 4, d8_15: 4, d16_30: 1, d31_45: 1, d46_60: 0, d60_plus: 2, total: 12 },
        { developer: 'Raghupavan', d0_7: 6, d8_15: 10, d16_30: 2, d31_45: 0, d46_60: 1, d60_plus: 6, total: 25 },
        { developer: 'Vamsi chowdary', d0_7: 2, d8_15: 0, d16_30: 2, d31_45: 1, d46_60: 0, d60_plus: 0, total: 5 },
        { developer: 'Boopathi Senthi', d0_7: 0, d8_15: 3, d16_30: 4, d31_45: 0, d46_60: 0, d60_plus: 0, total: 7 },
        { developer: 'Karthik R', d0_7: 13, d8_15: 2, d16_30: 0, d31_45: 0, d46_60: 0, d60_plus: 0, total: 15 },
        { developer: 'Manikandan', d0_7: 2, d8_15: 10, d16_30: 2, d31_45: 4, d46_60: 1, d60_plus: 6, total: 25 },
        { developer: 'Adithya Kislay', d0_7: 7, d8_15: 10, d16_30: 7, d31_45: 2, d46_60: 7, d60_plus: 3, total: 36 }
      ],
      total: { d0_7: 34, d8_15: 39, d16_30: 18, d31_45: 8, d46_60: 9, d60_plus: 17, total: 125 }
    },
    moduleAgeingMatrix: {
      headers: ['Module', '0-7 Days', '8-15 Days', '16-30 Days', '31-45 Days', '46-60 Days', '60+ Days', 'Total'],
      rows: [
        { module: 'EDM', d0_7: 1, d8_15: 0, d16_30: 6, d31_45: 4, d46_60: 3, d60_plus: 7, total: 21 },
        { module: 'ESS', d0_7: 0, d8_15: 0, d16_30: 0, d31_45: 0, d46_60: 0, d60_plus: 0, total: 0 },
        { module: 'Leave', d0_7: 3, d8_15: 0, d16_30: 5, d31_45: 2, d46_60: 6, d60_plus: 5, total: 21 },
        { module: 'Shiftroster', d0_7: 0, d8_15: 0, d16_30: 5, d31_45: 2, d46_60: 0, d60_plus: 5, total: 12 },
        { module: 'Attendance', d0_7: 0, d8_15: 0, d16_30: 2, d31_45: 0, d46_60: 0, d60_plus: 0, total: 2 }
      ],
      total: { d0_7: 4, d8_15: 0, d16_30: 18, d31_45: 8, d46_60: 9, d60_plus: 17, total: 56 }
    },
    bugsCategory: {
      headers: ['Module', 'UI Bugs', 'Functional Bugs', 'Total Bugs'],
      rows: [
        { module: 'EDM', uiBugs: 10, functionalBugs: 11, totalBugs: 21 },
        { module: 'ESS', uiBugs: 0, functionalBugs: 0, totalBugs: 0 },
        { module: 'Leave', uiBugs: 7, functionalBugs: 14, totalBugs: 21 },
        { module: 'Shiftroster', uiBugs: 7, functionalBugs: 5, totalBugs: 12 },
        { module: 'attendance', uiBugs: 1, functionalBugs: 1, totalBugs: 2 }
      ],
      total: { uiBugs: 25, functionalBugs: 31, totalBugs: 56 }
    }
  };
}
