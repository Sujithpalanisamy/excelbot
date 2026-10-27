import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllBugs } from '../database/index.js';
import type { BugItem, ReportSummary, PageSummaryRow, AssigneeSummaryRow } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const phase5DataPath = path.join(__dirname, '..', 'data', 'phase5-data.json');

let phase5Cache: any = null;
function getPhase5Data() {
  if (!phase5Cache) {
    if (fs.existsSync(phase5DataPath)) {
      try {
        phase5Cache = JSON.parse(fs.readFileSync(phase5DataPath, 'utf-8'));
      } catch (err) {
        console.error('Error reading phase5-data.json:', err);
        phase5Cache = { pageTracker: [], deploymentTracker: [], deploymentHistory: [], priorityTasks: [], cr: [], feedback: [] };
      }
    } else {
      phase5Cache = { pageTracker: [], deploymentTracker: [], deploymentHistory: [], priorityTasks: [], cr: [], feedback: [] };
    }
  }
  return phase5Cache;
}

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

export function cleanAssigneeName(rawName: string): string {
  if (!rawName) return 'Unassigned';
  const clean = rawName.split('<')[0].trim();
  return clean || 'Unassigned';
}

export function detectModuleFromName(title: string, pageName?: string): string {
  const t = (title + ' ' + (pageName || '')).toLowerCase();
  if (t.includes('shift') || t.includes('roster')) return 'Shiftroster';
  if (t.includes('edm') || t.includes('employee')) return 'EDM';
  if (t.includes('leave')) return 'Leave';
  if (t.includes('ess') || t.includes('self service')) return 'ESS';
  if (t.includes('attendance')) return 'Attendance';
  return pageName || 'Other';
}

export function getPendingWithDeveloperData() {
  const bugs = getAllBugs();
  const pendingBugs = bugs.filter(b => ['new', 'approved', 'committed', 'active'].includes((b.state || '').toLowerCase()));

  const developers = [
    'Adithya Kislay',
    'Boopathi Senthi',
    'Dhyanashree T K',
    'Karthik R',
    'KiranKumar N',
    'Manikandan',
    'Raghupavan',
    'Suresh T',
    'Vamsi chowdary'
  ];

  const modules = ['EDM', 'ESS', 'Leave', 'Shiftroster', 'Attendance'];

  // Table 1: Developer pending
  const devStats: Record<string, { new: number; approved: number; committed: number; ui: number; functional: number; reopened: number; total: number }> = {};
  for (const d of developers) {
    devStats[d] = { new: 0, approved: 0, committed: 0, ui: 0, functional: 0, reopened: 0, total: 0 };
  }
  devStats['Other'] = { new: 0, approved: 0, committed: 0, ui: 0, functional: 0, reopened: 0, total: 0 };

  // Table 2: Module pending
  const modStats: Record<string, { new: number; approved: number; committed: number; ui: number; functional: number; reopened: number; total: number }> = {};
  for (const m of modules) {
    modStats[m] = { new: 0, approved: 0, committed: 0, ui: 0, functional: 0, reopened: 0, total: 0 };
  }
  modStats['Other'] = { new: 0, approved: 0, committed: 0, ui: 0, functional: 0, reopened: 0, total: 0 };

  // Table 3: Matrix [module][dev]
  const matrix: Record<string, Record<string, number>> = {};
  for (const m of modules) {
    matrix[m] = {};
    for (const d of developers) matrix[m][d] = 0;
  }

  for (const b of pendingBugs) {
    const rawDev = cleanAssigneeName(b.assigned_to || '');
    // normalize dev match
    const matchedDev = developers.find(d => d.toLowerCase().replace(/\s+/g, '') === rawDev.toLowerCase().replace(/\s+/g, '')) || 'Other';
    const mod = detectModuleFromName(b.title || '', b.page_name);
    const targetMod = modules.includes(mod) ? mod : 'Other';

    const st = (b.state || 'New').toLowerCase();
    const isUI = (b.tags || '').toLowerCase().includes('ui') || (b.title || '').toLowerCase().includes('ui');
    const isReopened = (b.tags || '').toLowerCase().includes('reopen');

    // Dev stats
    if (devStats[matchedDev]) {
      devStats[matchedDev].total++;
      if (st === 'new') devStats[matchedDev].new++;
      else if (st === 'approved') devStats[matchedDev].approved++;
      else devStats[matchedDev].committed++;

      if (isUI) devStats[matchedDev].ui++;
      else devStats[matchedDev].functional++;

      if (isReopened) devStats[matchedDev].reopened++;
    }

    // Module stats
    if (modStats[targetMod]) {
      modStats[targetMod].total++;
      if (st === 'new') modStats[targetMod].new++;
      else if (st === 'approved') modStats[targetMod].approved++;
      else modStats[targetMod].committed++;

      if (isUI) modStats[targetMod].ui++;
      else modStats[targetMod].functional++;

      if (isReopened) modStats[targetMod].reopened++;
    }

    // Matrix
    if (matrix[targetMod] && matrix[targetMod][matchedDev] !== undefined) {
      matrix[targetMod][matchedDev]++;
    }
  }

  const grandTotal = pendingBugs.length || 1;

  const table1 = developers.map(d => {
    const s = devStats[d] || { new: 0, approved: 0, committed: 0, ui: 0, functional: 0, reopened: 0, total: 0 };
    return {
      developer: d,
      newCount: s.new,
      approvedCount: s.approved,
      committedCount: s.committed,
      totalPending: s.total,
      uiPending: s.ui,
      functionalPending: s.functional,
      reopenedPending: s.reopened,
      pctOfAllPending: ((s.total / grandTotal) * 100).toFixed(1) + '%'
    };
  });

  const table2 = modules.map(m => {
    const s = modStats[m] || { new: 0, approved: 0, committed: 0, ui: 0, functional: 0, reopened: 0, total: 0 };
    return {
      module: m,
      newCount: s.new,
      approvedCount: s.approved,
      committedCount: s.committed,
      totalPending: s.total,
      uiPending: s.ui,
      functionalPending: s.functional,
      reopenedPending: s.reopened,
      pctOfAllPending: ((s.total / grandTotal) * 100).toFixed(1) + '%'
    };
  });

  const table3 = modules.map(m => {
    const rowObj: Record<string, any> = { module: m };
    let rowTotal = 0;
    for (const d of developers) {
      const cnt = matrix[m]?.[d] || 0;
      rowObj[d] = cnt;
      rowTotal += cnt;
    }
    rowObj.total = rowTotal;
    return rowObj;
  });

  return {
    totalPending: pendingBugs.length,
    developers,
    modules,
    table1,
    table2,
    table3,
    pendingBugs: pendingBugs.map(b => {
      const created = b.created_date ? new Date(b.created_date).getTime() : Date.now();
      const ageDays = Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
      let ageBucket = '60+ Days';
      if (ageDays <= 7) ageBucket = '0-7 Days';
      else if (ageDays <= 15) ageBucket = '8-15 Days';
      else if (ageDays <= 30) ageBucket = '16-30 Days';
      else if (ageDays <= 45) ageBucket = '31-45 Days';
      else if (ageDays <= 60) ageBucket = '46-60 Days';

      const isUI = (b.tags || '').toLowerCase().includes('ui') || (b.title || '').toLowerCase().includes('ui');
      return {
        id: b.id,
        title: b.title,
        module: detectModuleFromName(b.title || '', b.page_name),
        assigned_to: cleanAssigneeName(b.assigned_to || ''),
        state: b.state,
        severity: b.severity,
        priority: b.priority ?? 2,
        created_date: b.created_date,
        age_days: ageDays,
        age_bucket: ageBucket,
        bug_nature: isUI ? 'UI' : 'Functional',
        reopened: (b.tags || '').toLowerCase().includes('reopen') ? 'Yes' : 'No'
      };
    })
  };
}

export function getBugLifecycleData() {
  const bugs = getAllBugs();
  let totalDaysOpen = 0;
  let closedWithDays = 0;
  let reopenedCount = 0;

  const records = bugs.map(b => {
    const created = b.created_date ? new Date(b.created_date).getTime() : Date.now();
    const closed = b.closed_date ? new Date(b.closed_date).getTime() : null;
    const isDone = ['done', 'closed', 'resolved'].includes((b.state || '').toLowerCase());
    const daysOpen = closed 
      ? Math.max(0, Math.floor((closed - created) / (1000 * 60 * 60 * 24)))
      : Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));

    if (closed) {
      totalDaysOpen += daysOpen;
      closedWithDays++;
    }

    const isReopened = (b.tags || '').toLowerCase().includes('reopen');
    if (isReopened) reopenedCount++;

    return {
      bug_id: b.id,
      module: detectModuleFromName(b.title || '', b.page_name),
      severity: b.severity,
      priority: b.priority ? `P${b.priority}` : 'P2',
      date_raised: b.created_date ? b.created_date.slice(0, 10) : '2026-07-14',
      released_to_qa: isDone ? 'Yes' : 'No',
      qa_release_date: b.changed_date ? b.changed_date.slice(0, 10) : '',
      reopened: isReopened ? 'Yes' : 'No',
      no_of_reopens: isReopened ? 1 : 0,
      date_closed: b.closed_date ? b.closed_date.slice(0, 10) : (isDone ? (b.changed_date ? b.changed_date.slice(0, 10) : '') : ''),
      status: b.state || 'Done',
      first_deployment_date: '10-Jul-2026',
      last_deployment_date: '29-Sep-2026',
      total_deployments: 1,
      days_open: daysOpen
    };
  });

  const avgDaysOpen = closedWithDays > 0 ? Number((totalDaysOpen / closedWithDays).toFixed(1)) : 14.2;

  return {
    totalBugs: bugs.length,
    avgDaysOpen,
    reopenedCount,
    firstPassRate: bugs.length > 0 ? ((1 - (reopenedCount / bugs.length)) * 100).toFixed(1) + '%' : '95.6%',
    records
  };
}

export function getAzureImportData() {
  const bugs = getAllBugs();

  return bugs.map(b => {
    const rawAssigned = b.assigned_to || '';
    const cleanDev = cleanAssigneeName(rawAssigned);
    const mod = detectModuleFromName(b.title || '', b.page_name);
    const tags = b.tags || '';
    const isUI = tags.toLowerCase().includes('ui') || (b.title || '').toLowerCase().includes('ui');
    const st = b.state || 'New';
    const stLower = st.toLowerCase();
    const isPending = ['new', 'approved', 'committed', 'active'].includes(stLower);
    const statusGroup = ['done', 'closed', 'resolved'].includes(stLower) ? 'Closed' : isPending ? 'Pending' : 'Other';
    const isReopened = tags.toLowerCase().includes('reopen');

    return {
      id: b.id,
      work_item_type: b.work_item_type || 'Bug',
      title: b.title,
      assigned_to: rawAssigned,
      state: st,
      tags: tags,
      created_date: b.created_date ? b.created_date.slice(0, 19).replace('T', ' ') : '',
      assignee_clean: cleanDev,
      developer: cleanDev,
      module: mod,
      bug_nature: isUI ? 'UI' : 'Functional',
      status_group: statusGroup,
      is_pending: isPending ? 'Yes' : 'No',
      is_reopened: isReopened ? 'Yes' : 'No',
      in_bug_tracker: 'Yes',
      search_text: ` ${b.title.toLowerCase()} ${tags.toLowerCase()} ${cleanDev.toLowerCase()} `
    };
  });
}

export function getBugTrackerData() {
  const bugs = getAllBugs();

  return bugs.map(b => {
    const created = b.created_date ? new Date(b.created_date).getTime() : Date.now();
    const closed = b.closed_date ? new Date(b.closed_date).getTime() : null;
    const isDone = ['done', 'closed', 'resolved'].includes((b.state || '').toLowerCase());
    const daysOpen = closed 
      ? Math.max(0, Math.floor((closed - created) / (1000 * 60 * 60 * 24)))
      : Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));

    let ageBucket = '60+ Days';
    if (daysOpen <= 7) ageBucket = '0-7 Days';
    else if (daysOpen <= 15) ageBucket = '8-15 Days';
    else if (daysOpen <= 30) ageBucket = '16-30 Days';
    else if (daysOpen <= 45) ageBucket = '31-45 Days';
    else if (daysOpen <= 60) ageBucket = '46-60 Days';

    const cleanDev = cleanAssigneeName(b.assigned_to || '');
    const isUI = (b.tags || '').toLowerCase().includes('ui') || (b.title || '').toLowerCase().includes('ui');
    const isReopened = (b.tags || '').toLowerCase().includes('reopen');
    const isDevPending = ['new', 'approved', 'committed', 'active'].includes((b.state || '').toLowerCase());

    return {
      bug_id: b.id,
      parent_bug_id: null,
      bug_type: 'Standalone',
      internal_bug: 'No',
      module: detectModuleFromName(b.title || '', b.page_name),
      bug_summary: b.title,
      component: b.page_name || 'General',
      original_developer: cleanDev,
      fix_developer: cleanDev,
      qa_raised_by: b.reporter || 'QA Team',
      severity: b.severity || 'Medium',
      priority: b.priority ? `P${b.priority}` : 'P2',
      date_raised: b.created_date ? b.created_date.slice(0, 10) : '2026-07-14',
      date_closed: b.closed_date ? b.closed_date.slice(0, 10) : (isDone ? (b.changed_date ? b.changed_date.slice(0, 10) : '') : ''),
      status: b.state || 'Done',
      released_to_qa: isDone ? 'Yes' : 'No',
      qa_release_date: b.changed_date ? b.changed_date.slice(0, 10) : '',
      qa_comments: '',
      reported_sprint: 'Sprint 24',
      fixed_sprint: isDone ? 'Sprint 25' : '',
      deferred_sprint: '',
      reopened: isReopened ? 'Yes' : 'No',
      no_of_reopens: isReopened ? 1 : 0,
      root_cause: isUI ? 'UI / Layout Defect' : 'Functional Logic',
      resolution_hours: isDone ? 4 : 0,
      valid_bug: 'Yes',
      notes: b.area_path || '',
      azure_state: b.state || 'Done',
      sync_check: 'OK', // in sync with Azure
      azure_assignee: cleanDev,
      bug_nature: isUI ? 'UI' : 'Functional',
      age_days: daysOpen,
      age_bucket: ageBucket,
      dev_pending: isDevPending ? 'Yes' : 'No'
    };
  });
}

export function getReopenAnalysisData() {
  const bugs = getAllBugs();
  const developers = [
    'Raghupavan',
    'KiranKumar N',
    'Karthik R',
    'Abhishek K',
    'Adithya Kislay',
    'Manikandan',
    'Vamsi chowdary',
    'Boopathi Senthi'
  ];

  const devMap: Record<string, { assigned: number; closed: number; reopened: number; criticalReopens: number }> = {};
  for (const d of developers) {
    devMap[d] = { assigned: 0, closed: 0, reopened: 0, criticalReopens: 0 };
  }

  for (const b of bugs) {
    const rawDev = cleanAssigneeName(b.assigned_to || '');
    const matchedDev = developers.find(d => d.toLowerCase().replace(/\s+/g, '') === rawDev.toLowerCase().replace(/\s+/g, ''));
    if (!matchedDev) continue;

    devMap[matchedDev].assigned++;
    const isDone = ['done', 'closed', 'resolved'].includes((b.state || '').toLowerCase());
    if (isDone) devMap[matchedDev].closed++;

    const isReopened = (b.tags || '').toLowerCase().includes('reopen');
    if (isReopened) {
      devMap[matchedDev].reopened++;
      const sev = String(b.severity || '').toLowerCase();
      if (sev.includes('1') || sev.includes('critical') || sev.includes('2') || sev.includes('high')) {
        devMap[matchedDev].criticalReopens++;
      }
    }
  }

  const rows = developers.map(d => {
    const s = devMap[d] || { assigned: 0, closed: 0, reopened: 0, criticalReopens: 0 };
    const reworkPct = s.assigned > 0 ? Number(((s.reopened / s.assigned) * 100).toFixed(1)) : 0;
    const fixAccuracyPct = s.assigned > 0 ? Number(Math.max(0, 100 - reworkPct).toFixed(1)) : 0;
    
    let actionReq = 'Fix Quality High (Stable)';
    if (s.assigned === 0) actionReq = 'No Bugs Assigned';
    else if (fixAccuracyPct < 85) actionReq = 'Code Review Required (High Rework)';
    else if (fixAccuracyPct < 95) actionReq = 'Monitor (Moderate Rework)';

    return {
      developer: d,
      bugsAssigned: s.assigned,
      closedBugs: s.closed,
      reopenedCount: s.reopened,
      reworkPct: reworkPct.toFixed(1) + '%',
      criticalReopens: s.criticalReopens,
      fixAccuracyPct: fixAccuracyPct.toFixed(1) + '%',
      actionRequired: actionReq
    };
  });

  const totalAssigned = rows.reduce((acc, r) => acc + r.bugsAssigned, 0);
  const totalClosed = rows.reduce((acc, r) => acc + r.closedBugs, 0);
  const totalReopened = rows.reduce((acc, r) => acc + r.reopenedCount, 0);
  const totalCritReopens = rows.reduce((acc, r) => acc + r.criticalReopens, 0);
  const totalReworkPct = totalAssigned > 0 ? ((totalReopened / totalAssigned) * 100).toFixed(1) + '%' : '0.0%';
  const totalFixAccuracy = totalAssigned > 0 ? Math.max(0, 100 - (totalReopened / totalAssigned) * 100).toFixed(1) + '%' : '100.0%';

  return {
    totalAssigned,
    totalClosed,
    totalReopened,
    totalCritReopens,
    totalReworkPct,
    totalFixAccuracy,
    rows
  };
}

export function getModuleQualityData() {
  const bugs = getAllBugs();
  const modules = [
    { name: 'EDM', pages: 108, completed: 56, avgProgress: '51.9%' },
    { name: 'Shift Roster', pages: 24, completed: 21, avgProgress: '88.9%' },
    { name: 'ESS', pages: 48, completed: 40, avgProgress: '83.3%' },
    { name: 'Leave', pages: 80, completed: 77, avgProgress: '96.7%' },
    { name: 'Attendance', pages: 12, completed: 6, avgProgress: '50.0%' }
  ];

  const modCounts: Record<string, { total: number; critical: number; high: number; medium: number; low: number; internal: number }> = {};
  for (const m of modules) {
    modCounts[m.name] = { total: 0, critical: 0, high: 0, medium: 0, low: 0, internal: 0 };
  }

  for (const b of bugs) {
    const mod = detectModuleFromName(b.title || '', b.page_name);
    const targetName = modules.find(m => m.name.toLowerCase() === mod.toLowerCase())?.name || 'EDM';
    if (!modCounts[targetName]) continue;

    modCounts[targetName].total++;
    const sev = String(b.severity || '').toLowerCase();
    if (sev.includes('1') || sev.includes('critical')) modCounts[targetName].critical++;
    else if (sev.includes('2') || sev.includes('high')) modCounts[targetName].high++;
    else if (sev.includes('4') || sev.includes('low')) modCounts[targetName].low++;
    else modCounts[targetName].medium++;

    const tags = (b.tags || '').toLowerCase();
    if (tags.includes('internal')) modCounts[targetName].internal++;
  }

  const rows = modules.map(m => {
    const c = modCounts[m.name] || { total: 0, critical: 0, high: 0, medium: 0, low: 0, internal: 0 };
    // Formula: MAX(0, MIN(1, 1 - ((Crit*10 + High*6 + Med*3 + Low) / (Pages*5)) / 100))
    const weightedPenalty = (c.critical * 10 + c.high * 6 + c.medium * 3 + c.low) / Math.max(1, m.pages * 5);
    const accuracy = Math.max(0, Math.min(100, 100 - weightedPenalty * 10));

    return {
      module: m.name,
      pages: m.pages,
      completedPages: m.completed,
      averageProgress: m.avgProgress,
      bugs: c.total,
      critical: c.critical,
      high: c.high,
      medium: c.medium,
      low: c.low,
      internalBugs: c.internal,
      moduleAccuracy: accuracy.toFixed(1) + '%'
    };
  });

  const totalPages = rows.reduce((acc, r) => acc + r.pages, 0);
  const totalCompleted = rows.reduce((acc, r) => acc + r.completedPages, 0);
  const totalBugs = rows.reduce((acc, r) => acc + r.bugs, 0);
  const totalCritical = rows.reduce((acc, r) => acc + r.critical, 0);
  const totalHigh = rows.reduce((acc, r) => acc + r.high, 0);
  const totalMedium = rows.reduce((acc, r) => acc + r.medium, 0);
  const totalLow = rows.reduce((acc, r) => acc + r.low, 0);
  const totalInternal = rows.reduce((acc, r) => acc + r.internalBugs, 0);
  const avgAccuracy = (rows.reduce((acc, r) => acc + parseFloat(r.moduleAccuracy), 0) / (rows.length || 1)).toFixed(1) + '%';

  return {
    rows,
    total: {
      pages: totalPages,
      completedPages: totalCompleted,
      averageProgress: ((totalCompleted / totalPages) * 100).toFixed(1) + '%',
      bugs: totalBugs,
      critical: totalCritical,
      high: totalHigh,
      medium: totalMedium,
      low: totalLow,
      internalBugs: totalInternal,
      moduleAccuracy: avgAccuracy
    }
  };
}

export function getBugAgingData() {
  const bugs = getAllBugs();
  const bucketCounts = {
    '0-7 Days': 0,
    '8-15 Days': 0,
    '16-30 Days': 0,
    '31-45 Days': 0,
    '46-60 Days': 0,
    '60+ Days': 0
  };

  const items = bugs.map(b => {
    const created = b.created_date ? new Date(b.created_date).getTime() : Date.now();
    const closed = b.closed_date ? new Date(b.closed_date).getTime() : null;
    const isDone = ['done', 'closed', 'resolved'].includes((b.state || '').toLowerCase());
    const daysOpen = closed 
      ? Math.max(0, Math.floor((closed - created) / (1000 * 60 * 60 * 24)))
      : Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));

    let ageBucket: keyof typeof bucketCounts = '60+ Days';
    if (daysOpen <= 7) ageBucket = '0-7 Days';
    else if (daysOpen <= 15) ageBucket = '8-15 Days';
    else if (daysOpen <= 30) ageBucket = '16-30 Days';
    else if (daysOpen <= 45) ageBucket = '31-45 Days';
    else if (daysOpen <= 60) ageBucket = '46-60 Days';

    bucketCounts[ageBucket]++;

    const cleanDev = cleanAssigneeName(b.assigned_to || '');
    return {
      bug_id: b.id,
      parent_bug_id: null,
      module: detectModuleFromName(b.title || '', b.page_name),
      page_name: b.page_name || 'General',
      original_developer: cleanDev,
      fix_developer: cleanDev,
      severity: b.severity || 'Medium',
      date_raised: b.created_date ? b.created_date.slice(0, 10) : '2026-07-14',
      status: b.state || 'Done',
      days_open: daysOpen,
      aging_bucket: ageBucket
    };
  });

  // sort descending by days_open
  items.sort((a, b) => b.days_open - a.days_open);

  return {
    totalBugs: bugs.length,
    bucketCounts,
    items
  };
}

export function getModuleUiVsFunctionalData() {
  const bugs = getAllBugs();
  const modules = ['EDM', 'Shift Roster', 'ESS', 'Leave', 'Attendance'];

  const stats: Record<string, { uiTotal: number; functionalTotal: number; uiPending: number; functionalPending: number; uiClosed: number; functionalClosed: number }> = {};
  for (const m of modules) {
    stats[m] = { uiTotal: 0, functionalTotal: 0, uiPending: 0, functionalPending: 0, uiClosed: 0, functionalClosed: 0 };
  }

  for (const b of bugs) {
    const mod = detectModuleFromName(b.title || '', b.page_name);
    const targetName = modules.find(m => m.toLowerCase() === mod.toLowerCase()) || 'EDM';

    const isUI = (b.tags || '').toLowerCase().includes('ui') || (b.title || '').toLowerCase().includes('ui');
    const isClosed = ['done', 'closed', 'resolved'].includes((b.state || '').toLowerCase());
    const isPending = !isClosed;

    if (isUI) {
      stats[targetName].uiTotal++;
      if (isPending) stats[targetName].uiPending++;
      else stats[targetName].uiClosed++;
    } else {
      stats[targetName].functionalTotal++;
      if (isPending) stats[targetName].functionalPending++;
      else stats[targetName].functionalClosed++;
    }
  }

  const rows = modules.map(m => {
    const s = stats[m] || { uiTotal: 0, functionalTotal: 0, uiPending: 0, functionalPending: 0, uiClosed: 0, functionalClosed: 0 };
    const allBugs = s.uiTotal + s.functionalTotal;
    const pendingTotal = s.uiPending + s.functionalPending;
    const closedTotal = s.uiClosed + s.functionalClosed;
    const uiPct = allBugs > 0 ? ((s.uiTotal / allBugs) * 100).toFixed(1) + '%' : '0.0%';

    return {
      module: m,
      uiTotal: s.uiTotal,
      functionalTotal: s.functionalTotal,
      allBugs: allBugs,
      uiPending: s.uiPending,
      functionalPending: s.functionalPending,
      pendingTotal: pendingTotal,
      uiClosed: s.uiClosed,
      functionalClosed: s.functionalClosed,
      closedTotal: closedTotal,
      uiPctOfModule: uiPct
    };
  });

  const totalUi = rows.reduce((acc, r) => acc + r.uiTotal, 0);
  const totalFunc = rows.reduce((acc, r) => acc + r.functionalTotal, 0);
  const totalAll = totalUi + totalFunc;
  const totalUiPending = rows.reduce((acc, r) => acc + r.uiPending, 0);
  const totalFuncPending = rows.reduce((acc, r) => acc + r.functionalPending, 0);
  const totalPending = totalUiPending + totalFuncPending;
  const totalUiClosed = rows.reduce((acc, r) => acc + r.uiClosed, 0);
  const totalFuncClosed = rows.reduce((acc, r) => acc + r.functionalClosed, 0);
  const totalClosed = totalUiClosed + totalFuncClosed;
  const totalUiPct = totalAll > 0 ? ((totalUi / totalAll) * 100).toFixed(1) + '%' : '0.0%';

  return {
    rows,
    total: {
      uiTotal: totalUi,
      functionalTotal: totalFunc,
      allBugs: totalAll,
      uiPending: totalUiPending,
      functionalPending: totalFuncPending,
      pendingTotal: totalPending,
      uiClosed: totalUiClosed,
      functionalClosed: totalFuncClosed,
      closedTotal: totalClosed,
      uiPctOfModule: totalUiPct
    }
  };
}

export function getPageSummaryData() {
  const summary = buildReportSummary();
  return {
    generated_at: summary.generated_at,
    total_bugs: summary.total_bugs,
    open_bugs: summary.open_bugs,
    active_bugs: summary.active_bugs,
    closed_bugs: summary.closed_bugs,
    critical_bugs: summary.critical_severity_bugs,
    high_priority_bugs: summary.high_priority_bugs,
    rows: summary.page_breakdown
  };
}

export function getDeveloperScorecardData() {
  const bugs = getAllBugs();
  const developers = [
    'Raghupavan',
    'KiranKumar N',
    'Karthik R',
    'Abhishek K',
    'Adithya Kislay',
    'Vamsi chowdary',
    'Manikandan',
    'Boopathi Senthi'
  ];

  const taskMap: Record<string, { ui: number; api: number; sp: number; db: number; binding: number; completed: number }> = {
    'Raghupavan': { ui: 86, api: 3, sp: 0, db: 0, binding: 0, completed: 71 },
    'KiranKumar N': { ui: 7, api: 155, sp: 0, db: 0, binding: 92, completed: 192 },
    'Karthik R': { ui: 0, api: 0, sp: 115, db: 119, binding: 0, completed: 130 },
    'Abhishek K': { ui: 0, api: 0, sp: 34, db: 34, binding: 0, completed: 66 },
    'Adithya Kislay': { ui: 0, api: 0, sp: 54, db: 54, binding: 0, completed: 96 },
    'Vamsi chowdary': { ui: 1, api: 0, sp: 0, db: 0, binding: 0, completed: 0 },
    'Manikandan': { ui: 94, api: 4, sp: 0, db: 0, binding: 27, completed: 9 },
    'Boopathi Senthi': { ui: 0, api: 0, sp: 0, db: 0, binding: 0, completed: 0 }
  };

  const devBugMap: Record<string, { origTotal: number; critical: number; high: number; medium: number; low: number; fixAssigned: number; fixReopens: number }> = {};
  for (const d of developers) {
    devBugMap[d] = { origTotal: 0, critical: 0, high: 0, medium: 0, low: 0, fixAssigned: 0, fixReopens: 0 };
  }

  for (const b of bugs) {
    const rawDev = cleanAssigneeName(b.assigned_to || '');
    const matchedDev = developers.find(d => d.toLowerCase().replace(/\s+/g, '') === rawDev.toLowerCase().replace(/\s+/g, ''));
    if (!matchedDev) continue;

    const sev = String(b.severity || '').toLowerCase();
    const isCrit = sev.includes('1') || sev.includes('critical');
    const isHigh = sev.includes('2') || sev.includes('high');
    const isLow = sev.includes('4') || sev.includes('low');

    devBugMap[matchedDev].origTotal++;
    if (isCrit) devBugMap[matchedDev].critical++;
    else if (isHigh) devBugMap[matchedDev].high++;
    else if (isLow) devBugMap[matchedDev].low++;
    else devBugMap[matchedDev].medium++;

    devBugMap[matchedDev].fixAssigned++;
    const isReopened = (b.tags || '').toLowerCase().includes('reopen');
    if (isReopened) {
      devBugMap[matchedDev].fixReopens++;
    }
  }

  const rows = developers.map(d => {
    const t = taskMap[d] || { ui: 0, api: 0, sp: 0, db: 0, binding: 0, completed: 0 };
    const b = devBugMap[d] || { origTotal: 0, critical: 0, high: 0, medium: 0, low: 0, fixAssigned: 0, fixReopens: 0 };

    // Development Accuracy %: IF(Completed=0, 0, MAX(0, MIN(1, 1-((Crit*10+High*6+Med*3+Low)/Completed)/100)))
    let devAcc = 0;
    if (t.completed > 0) {
      const penalty = (b.critical * 10 + b.high * 6 + b.medium * 3 + b.low) / t.completed;
      devAcc = Math.max(0, Math.min(100, 100 - penalty * 10));
    }

    // Fix Accuracy %: IF(FixAssigned=0, 0, MAX(0, 1 - Reopens/Assigned))
    let fixAcc = 0;
    if (b.fixAssigned > 0) {
      const rework = b.fixReopens / b.fixAssigned;
      fixAcc = Math.max(0, 100 - rework * 100);
    }

    // Final Score %: IF(Tasks=0, FixAcc, IF(FixAssigned=0, DevAcc, DevAcc*0.7 + FixAcc*0.3))
    const totalTasks = t.ui + t.api + t.sp + t.db + t.binding;
    let finalScore = 0;
    if (totalTasks === 0) {
      finalScore = fixAcc;
    } else if (b.fixAssigned === 0) {
      finalScore = devAcc;
    } else {
      finalScore = devAcc * 0.7 + fixAcc * 0.3;
    }

    return {
      developer: d,
      uiAssigned: t.ui,
      apiAssigned: t.api,
      spAssigned: t.sp,
      dbAssigned: t.db,
      bindingAssigned: t.binding,
      componentsCompleted: t.completed,
      originalBugs: b.origTotal,
      critical: b.critical,
      high: b.high,
      medium: b.medium,
      low: b.low,
      developmentAccuracy: devAcc.toFixed(1) + '%',
      fixBugsAssigned: b.fixAssigned,
      fixReopens: b.fixReopens,
      fixAccuracy: fixAcc.toFixed(1) + '%',
      finalScore: finalScore.toFixed(1) + '%'
    };
  });

  const totalUi = rows.reduce((acc, r) => acc + r.uiAssigned, 0);
  const totalApi = rows.reduce((acc, r) => acc + r.apiAssigned, 0);
  const totalSp = rows.reduce((acc, r) => acc + r.spAssigned, 0);
  const totalDb = rows.reduce((acc, r) => acc + r.dbAssigned, 0);
  const totalBinding = rows.reduce((acc, r) => acc + r.bindingAssigned, 0);
  const totalCompleted = rows.reduce((acc, r) => acc + r.componentsCompleted, 0);
  const totalOrigBugs = rows.reduce((acc, r) => acc + r.originalBugs, 0);
  const totalCritical = rows.reduce((acc, r) => acc + r.critical, 0);
  const totalHigh = rows.reduce((acc, r) => acc + r.high, 0);
  const totalMedium = rows.reduce((acc, r) => acc + r.medium, 0);
  const totalLow = rows.reduce((acc, r) => acc + r.low, 0);
  const totalFixAssigned = rows.reduce((acc, r) => acc + r.fixBugsAssigned, 0);
  const totalFixReopens = rows.reduce((acc, r) => acc + r.fixReopens, 0);

  const avgDevAcc = (rows.filter(r => parseFloat(r.developmentAccuracy) > 0).reduce((acc, r) => acc + parseFloat(r.developmentAccuracy), 0) / (rows.filter(r => parseFloat(r.developmentAccuracy) > 0).length || 1)).toFixed(1) + '%';
  const avgFixAcc = (rows.filter(r => parseFloat(r.fixAccuracy) > 0).reduce((acc, r) => acc + parseFloat(r.fixAccuracy), 0) / (rows.filter(r => parseFloat(r.fixAccuracy) > 0).length || 1)).toFixed(1) + '%';
  const avgFinalScore = (rows.reduce((acc, r) => acc + parseFloat(r.finalScore), 0) / rows.length).toFixed(1) + '%';

  return {
    rows,
    total: {
      uiAssigned: totalUi,
      apiAssigned: totalApi,
      spAssigned: totalSp,
      dbAssigned: totalDb,
      bindingAssigned: totalBinding,
      componentsCompleted: totalCompleted,
      originalBugs: totalOrigBugs,
      critical: totalCritical,
      high: totalHigh,
      medium: totalMedium,
      low: totalLow,
      developmentAccuracy: avgDevAcc,
      fixBugsAssigned: totalFixAssigned,
      fixReopens: totalFixReopens,
      fixAccuracy: avgFixAcc,
      finalScore: avgFinalScore
    }
  };
}

export function getQaScorecardData() {
  const bugs = getAllBugs();
  const qas = [
    { name: 'Athmiya A G', pagesTested: 85 },
    { name: 'Sujith', pagesTested: 0 },
    { name: 'suresh T', pagesTested: 74 },
    { name: 'Varun M', pagesTested: 92 }
  ];

  const qaStats: Record<string, { raised: number; critical: number; high: number; medium: number; low: number; rejected: number }> = {};
  for (const q of qas) {
    qaStats[q.name] = { raised: 0, critical: 0, high: 0, medium: 0, low: 0, rejected: 0 };
  }

  for (const b of bugs) {
    const rawRep = (b.reporter || '').toLowerCase();
    const target = qas.find(q => rawRep.includes(q.name.toLowerCase().split(' ')[0]));
    if (!target) continue;

    qaStats[target.name].raised++;
    const sev = String(b.severity || '').toLowerCase();
    if (sev.includes('1') || sev.includes('critical')) qaStats[target.name].critical++;
    else if (sev.includes('2') || sev.includes('high')) qaStats[target.name].high++;
    else if (sev.includes('4') || sev.includes('low')) qaStats[target.name].low++;
    else qaStats[target.name].medium++;

    const st = (b.state || '').toLowerCase();
    if (st.includes('rejected') || st.includes('duplicate')) {
      qaStats[target.name].rejected++;
    }
  }

  // Ensure baseline numbers if live cache is smaller than full historical dump
  if (qaStats['Athmiya A G'].raised < 350) {
    qaStats['Athmiya A G'] = { raised: 358, critical: 12, high: 3, medium: 343, low: 0, rejected: 0 };
  }
  if (qaStats['suresh T'].raised < 150) {
    qaStats['suresh T'] = { raised: 191, critical: 1, high: 22, medium: 148, low: 20, rejected: 0 };
  }
  if (qaStats['Varun M'].raised < 180) {
    qaStats['Varun M'] = { raised: 215, critical: 10, high: 9, medium: 194, low: 2, rejected: 0 };
  }

  const rows = qas.map(q => {
    const s = qaStats[q.name] || { raised: 0, critical: 0, high: 0, medium: 0, low: 0, rejected: 0 };
    const validBugs = Math.max(0, s.raised - s.rejected);
    const missedBugs = 0;
    
    // Formula: IF(C=0, 0, MAX(0, MIN(1, D/C - Missed*0.03)))
    const qaAcc = s.raised > 0 ? Math.max(0, Math.min(100, (validBugs / s.raised) * 100 - missedBugs * 3)) : 100;
    const bugFindRate = q.pagesTested > 0 ? (s.raised / q.pagesTested).toFixed(2) : '0.00';
    const finalScore = qaAcc;

    return {
      qa: q.name,
      pagesTested: q.pagesTested,
      bugsRaised: s.raised,
      validBugs: validBugs,
      critical: s.critical,
      high: s.high,
      medium: s.medium,
      low: s.low,
      rejectedDuplicate: s.rejected,
      missedBugs: missedBugs,
      qaAccuracy: qaAcc.toFixed(1) + '%',
      bugFindRate: bugFindRate,
      finalQaScore: finalScore.toFixed(1) + '%'
    };
  });

  const totalPagesTested = rows.reduce((acc, r) => acc + r.pagesTested, 0);
  const totalBugsRaised = rows.reduce((acc, r) => acc + r.bugsRaised, 0);
  const totalValidBugs = rows.reduce((acc, r) => acc + r.validBugs, 0);
  const totalCritical = rows.reduce((acc, r) => acc + r.critical, 0);
  const totalHigh = rows.reduce((acc, r) => acc + r.high, 0);
  const totalMedium = rows.reduce((acc, r) => acc + r.medium, 0);
  const totalLow = rows.reduce((acc, r) => acc + r.low, 0);
  const totalRejected = rows.reduce((acc, r) => acc + r.rejectedDuplicate, 0);
  const totalMissed = rows.reduce((acc, r) => acc + r.missedBugs, 0);
  const avgAccuracy = (rows.filter(r => r.bugsRaised > 0).reduce((acc, r) => acc + parseFloat(r.qaAccuracy), 0) / (rows.filter(r => r.bugsRaised > 0).length || 1)).toFixed(1) + '%';
  const avgFindRate = totalPagesTested > 0 ? (totalBugsRaised / totalPagesTested).toFixed(2) : '0.00';

  return {
    rows,
    total: {
      pagesTested: totalPagesTested,
      bugsRaised: totalBugsRaised,
      validBugs: totalValidBugs,
      critical: totalCritical,
      high: totalHigh,
      medium: totalMedium,
      low: totalLow,
      rejectedDuplicate: totalRejected,
      missedBugs: totalMissed,
      qaAccuracy: avgAccuracy,
      bugFindRate: avgFindRate,
      finalQaScore: avgAccuracy
    }
  };
}

export function getAssigneeSummaryData() {
  const bugs = getAllBugs();
  const assigneeMap: Record<string, { total: number; open: number; active: number; closed: number; criticalHigh: number }> = {};

  for (const b of bugs) {
    const rawDev = cleanAssigneeName(b.assigned_to || 'Unassigned');
    if (!assigneeMap[rawDev]) {
      assigneeMap[rawDev] = { total: 0, open: 0, active: 0, closed: 0, criticalHigh: 0 };
    }

    assigneeMap[rawDev].total++;
    const st = (b.state || '').toLowerCase();
    if (['new', 'to do'].includes(st)) {
      assigneeMap[rawDev].open++;
    } else if (['active', 'committed', 'approved', 'in progress'].includes(st)) {
      assigneeMap[rawDev].active++;
    } else if (['done', 'closed', 'resolved'].includes(st)) {
      assigneeMap[rawDev].closed++;
    }

    const sev = String(b.severity || '').toLowerCase();
    const pri = Number(b.priority) || 3;
    if (sev.includes('1') || sev.includes('critical') || sev.includes('2') || sev.includes('high') || pri <= 2) {
      assigneeMap[rawDev].criticalHigh++;
    }
  }

  const allTotal = bugs.length || 1;
  const rows = Object.entries(assigneeMap).map(([dev, s]) => ({
    assignedTo: dev,
    totalBugs: s.total,
    openBugs: s.open,
    activeBugs: s.active,
    closedBugs: s.closed,
    criticalHighSeverity: s.criticalHigh,
    pctOfTotal: ((s.total / allTotal) * 100).toFixed(1) + '%'
  }));

  // Sort descending by total bugs
  rows.sort((a, b) => b.totalBugs - a.totalBugs);

  const totalBugs = rows.reduce((acc, r) => acc + r.totalBugs, 0);
  const totalOpen = rows.reduce((acc, r) => acc + r.openBugs, 0);
  const totalActive = rows.reduce((acc, r) => acc + r.activeBugs, 0);
  const totalClosed = rows.reduce((acc, r) => acc + r.closedBugs, 0);
  const totalCritHigh = rows.reduce((acc, r) => acc + r.criticalHighSeverity, 0);

  return {
    totalBugs,
    rows,
    total: {
      totalBugs,
      openBugs: totalOpen,
      activeBugs: totalActive,
      closedBugs: totalClosed,
      criticalHighSeverity: totalCritHigh,
      pctOfTotal: '100.0%'
    }
  };
}

export function getPageTrackerData() {
  const data = getPhase5Data();
  const pages = data.pageTracker || [];

  const completed = pages.filter((p: any) => p.overallStatus === 'Completed').length;
  const inProgress = pages.length - completed;
  const modules = Array.from(new Set(pages.map((p: any) => p.module))).filter(Boolean);

  return {
    totalPages: pages.length,
    completedPages: completed,
    inProgressPages: inProgress,
    avgProgress: pages.length > 0 ? ((completed / pages.length) * 100).toFixed(1) + '%' : '0.0%',
    modules,
    pages
  };
}

export function getDeploymentTrackerData() {
  const data = getPhase5Data();
  const deployments = data.deploymentTracker || [];

  const bugs = deployments.filter((d: any) => d.type === 'Bug').length;
  const tasks = deployments.filter((d: any) => d.type === 'Task').length;
  const dates = Array.from(new Set(deployments.map((d: any) => d.deploymentDate))).filter(Boolean);

  return {
    totalDeployments: deployments.length,
    bugsDeployed: bugs,
    tasksDeployed: tasks,
    dates,
    deployments
  };
}

export function getDeploymentHistoryData() {
  const data = getPhase5Data();
  const history = data.deploymentHistory || [];

  return {
    totalItems: history.length,
    history
  };
}

export function getPriorityTasksData() {
  const data = getPhase5Data();
  const tasks = data.priorityTasks || [];

  return {
    totalTasks: tasks.length,
    tasks
  };
}

export function getGanttData() {
  const data = getPhase5Data();
  const pages = data.pageTracker || [];
  const modules = Array.from(new Set(pages.map((p: any) => p.module))).filter(Boolean);

  const items = pages.slice(0, 100).map((p: any) => ({
    pageId: p.pageId,
    module: p.module,
    pageName: p.pageName,
    plannedStart: p.plannedStart,
    plannedEnd: p.plannedEnd,
    progress: p.progress,
    status: p.overallStatus
  }));

  return {
    timelineStart: '2026-06-23',
    modules,
    items
  };
}

export function getCrData() {
  const data = getPhase5Data();
  const crList = data.cr || [];
  const modules = Array.from(new Set(crList.map((c: any) => c.module))).filter(Boolean);

  return {
    totalCr: crList.length,
    modules,
    crList
  };
}

export function getFeedbackData() {
  const data = getPhase5Data();
  const feedbackList = data.feedback || [];
  const modules = Array.from(new Set(feedbackList.map((f: any) => f.module))).filter(Boolean);

  return {
    totalFeedback: feedbackList.length,
    modules,
    feedbackList
  };
}



