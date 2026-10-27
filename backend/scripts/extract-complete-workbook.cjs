const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function extractCompleteWorkbook() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.resolve(__dirname, '../../Development_QA_Accuracy_Tracker_Automated_UPDATED (4) (6) (1).xlsx');
  console.log('Loading workbook from:', filePath);
  await wb.xlsx.readFile(filePath);

  const getCleanVal = (cell) => {
    if (!cell) return '';
    let v = cell.value;
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') {
      if (v.result !== undefined && v.result !== null) return v.result;
      if (v.text !== undefined) return v.text;
      if (v.richText) return v.richText.map(t => t.text).join('');
      if (v instanceof Date) return v.toISOString().split('T')[0];
    }
    if (v instanceof Date) return v.toISOString().split('T')[0];
    return String(v).trim();
  };

  const getNumericVal = (cell) => {
    const v = getCleanVal(cell);
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  // -------------------------------------------------------------
  // 1. Page Tracker (Rows 4+)
  // -------------------------------------------------------------
  const sPage = wb.getWorksheet('Page Tracker');
  const pageTracker = [];
  if (sPage) {
    for (let r = 4; r <= sPage.rowCount; r++) {
      const row = sPage.getRow(r);
      const pageId = getCleanVal(row.getCell(1)) || r - 3;
      const module = getCleanVal(row.getCell(2));
      const release = getCleanVal(row.getCell(3));
      const plannedSprint = getCleanVal(row.getCell(4));
      const actualSprint = getCleanVal(row.getCell(5));
      const pageName = getCleanVal(row.getCell(6));
      const complexity = getCleanVal(row.getCell(7));
      const uiDev = getCleanVal(row.getCell(8));
      const apiDev = getCleanVal(row.getCell(9));
      const spDev = getCleanVal(row.getCell(10));
      const dbDev = getCleanVal(row.getCell(11));
      const bindingDev = getCleanVal(row.getCell(12));
      const qa = getCleanVal(row.getCell(13));
      const plannedStart = getCleanVal(row.getCell(14));
      const plannedEnd = getCleanVal(row.getCell(15));
      const actualEnd = getCleanVal(row.getCell(16));
      const overallStatus = getCleanVal(row.getCell(17)) || 'Not Started';
      const firstPass = getCleanVal(row.getCell(19));
      const uiStatus = getCleanVal(row.getCell(20));
      const apiStatus = getCleanVal(row.getCell(21));
      const spStatus = getCleanVal(row.getCell(22));
      const dbStatus = getCleanVal(row.getCell(23));
      const bindingStatus = getCleanVal(row.getCell(24));
      const rawProg = getCleanVal(row.getCell(25));
      let progress = '0%';
      if (typeof rawProg === 'number') progress = `${Math.round(rawProg * 100)}%`;
      else if (rawProg) progress = String(rawProg).endsWith('%') ? rawProg : `${rawProg}%`;

      if (module || pageName || uiDev) {
        pageTracker.push({
          pageId,
          module,
          release,
          plannedSprint,
          actualSprint,
          pageName: pageName || `Page ${pageId}`,
          complexity: complexity || 'Medium',
          uiDev,
          apiDev,
          spDev,
          dbDev,
          bindingDev,
          qa,
          plannedStart,
          plannedEnd,
          actualEnd,
          overallStatus,
          firstPass,
          uiStatus,
          apiStatus,
          spStatus,
          dbStatus,
          bindingStatus,
          progress
        });
      }
    }
  }
  console.log('Extracted pageTracker rows:', pageTracker.length);

  // -------------------------------------------------------------
  // 2. Deployment Tracker (Rows 5+)
  // -------------------------------------------------------------
  const sDep = wb.getWorksheet('Deployment Tracker');
  const deploymentTracker = [];
  if (sDep) {
    for (let r = 5; r <= sDep.rowCount; r++) {
      const row = sDep.getRow(r);
      const type = getCleanVal(row.getCell(1));
      const id = getCleanVal(row.getCell(2));
      const deploymentDate = getCleanVal(row.getCell(3));
      const itemName = getCleanVal(row.getCell(5));
      const developers = getCleanVal(row.getCell(6));
      const severity = getCleanVal(row.getCell(7));
      const priority = getCleanVal(row.getCell(8));
      const status = getCleanVal(row.getCell(9));
      const qaStatus = getCleanVal(row.getCell(10));
      const qaAssigned = getCleanVal(row.getCell(11));
      const notes = getCleanVal(row.getCell(12));
      const duplicate = getCleanVal(row.getCell(13));
      const deploymentGroup = getCleanVal(row.getCell(14));
      const workedDate = getCleanVal(row.getCell(15));
      const latestDeployment = getCleanVal(row.getCell(16));

      if (type || id || itemName || deploymentDate) {
        deploymentTracker.push({
          type: type || 'Bug',
          id: id || r,
          deploymentDate,
          itemName,
          developers,
          severity,
          priority,
          status,
          qaStatus,
          qaAssigned,
          notes,
          duplicate,
          deploymentGroup,
          workedDate,
          latestDeployment
        });
      }
    }
  }
  console.log('Extracted deploymentTracker rows:', deploymentTracker.length);

  // -------------------------------------------------------------
  // 3. Deployment History (Rows 4+)
  // -------------------------------------------------------------
  const sDepHist = wb.getWorksheet('Deployment History');
  const deploymentHistory = [];
  if (sDepHist) {
    for (let r = 4; r <= sDepHist.rowCount; r++) {
      const row = sDepHist.getRow(r);
      const type = getCleanVal(row.getCell(1));
      const id = getCleanVal(row.getCell(2));
      const itemName = getCleanVal(row.getCell(3));
      const deploymentDate = getCleanVal(row.getCell(4));
      const status = getCleanVal(row.getCell(5));
      const qaStatus = getCleanVal(row.getCell(6));
      const qaAssigned = getCleanVal(row.getCell(7));
      const notes = getCleanVal(row.getCell(8));
      const currentStatus = getCleanVal(row.getCell(9));

      if (type || id || itemName) {
        deploymentHistory.push({
          type,
          id,
          itemName,
          deploymentDate,
          status,
          qaStatus,
          qaAssigned,
          notes,
          currentStatus
        });
      }
    }
  }
  console.log('Extracted deploymentHistory rows:', deploymentHistory.length);

  // -------------------------------------------------------------
  // 4. Priority tasks (Rows 2+)
  // -------------------------------------------------------------
  const sPrio = wb.getWorksheet('Priority tasks');
  const priorityTasks = [];
  if (sPrio) {
    for (let r = 2; r <= sPrio.rowCount; r++) {
      const row = sPrio.getRow(r);
      const taskName = getCleanVal(row.getCell(1));
      const notes = getCleanVal(row.getCell(2));
      if (taskName) {
        priorityTasks.push({
          id: r - 1,
          taskName,
          notes
        });
      }
    }
  }
  console.log('Extracted priorityTasks rows:', priorityTasks.length);

  // -------------------------------------------------------------
  // 5. CR (Rows 2+)
  // -------------------------------------------------------------
  const sCr = wb.getWorksheet('CR');
  const cr = [];
  if (sCr) {
    for (let r = 2; r <= sCr.rowCount; r++) {
      const row = sCr.getRow(r);
      const module = getCleanVal(row.getCell(1));
      const summary = getCleanVal(row.getCell(2));
      const status = getCleanVal(row.getCell(3)) || 'Open';
      if (module || summary) {
        cr.push({
          id: r - 1,
          module,
          summary,
          status
        });
      }
    }
  }
  console.log('Extracted CR rows:', cr.length);

  // -------------------------------------------------------------
  // 6. Feedback (Rows 2+)
  // -------------------------------------------------------------
  const sFb = wb.getWorksheet('Feedback');
  const feedback = [];
  if (sFb) {
    for (let r = 2; r <= sFb.rowCount; r++) {
      const row = sFb.getRow(r);
      const module = getCleanVal(row.getCell(1));
      const issue = getCleanVal(row.getCell(2));
      const reportedBy = getCleanVal(row.getCell(3));
      if (module || issue) {
        feedback.push({
          id: r - 1,
          module,
          issue,
          reportedBy
        });
      }
    }
  }
  console.log('Extracted feedback rows:', feedback.length);

  // -------------------------------------------------------------
  // 7. Reports Catalog (Rows 2+)
  // -------------------------------------------------------------
  const sRep = wb.getWorksheet('Reports');
  const reports = [];
  if (sRep) {
    for (let r = 2; r <= sRep.rowCount; r++) {
      const row = sRep.getRow(r);
      const module = getCleanVal(row.getCell(1));
      const reportName = getCleanVal(row.getCell(2));
      const used = getCleanVal(row.getCell(3)) || 'Active';
      if (module || reportName) {
        reports.push({
          id: r - 1,
          module,
          name: reportName,
          used
        });
      }
    }
  }
  console.log('Extracted reports catalog rows:', reports.length);

  // -------------------------------------------------------------
  // Save Phase 5 + Reports data
  // -------------------------------------------------------------
  const phase5Data = {
    pageTracker,
    deploymentTracker,
    deploymentHistory,
    priorityTasks,
    cr,
    feedback,
    reports
  };
  fs.writeFileSync(
    path.resolve(__dirname, '../src/data/phase5-data.json'),
    JSON.stringify(phase5Data, null, 2)
  );
  console.log('Saved phase5-data.json successfully.');

  // -------------------------------------------------------------
  // 8. Lists (Sheet 12)
  // -------------------------------------------------------------
  const sLists = wb.getWorksheet('Lists');
  const listsData = {
    complexities: [],
    pageStatuses: [],
    severities: [],
    priorities: [],
    bugStatuses: [],
    rootCauses: [],
    components: [],
    bugTypes: [],
    developers: [],
    qaTeam: [],
    sprints: []
  };
  if (sLists) {
    for (let r = 2; r <= sLists.rowCount; r++) {
      const row = sLists.getRow(r);
      const c1 = getCleanVal(row.getCell(1));
      const c2 = getCleanVal(row.getCell(2));
      const c3 = getCleanVal(row.getCell(3));
      const c4 = getCleanVal(row.getCell(4));
      const c5 = getCleanVal(row.getCell(5));
      const c6 = getCleanVal(row.getCell(6));
      const c8 = getCleanVal(row.getCell(8));
      const c9 = getCleanVal(row.getCell(9));
      const c10 = getCleanVal(row.getCell(10));
      const c11 = getCleanVal(row.getCell(11));
      const c12 = getCleanVal(row.getCell(12));

      if (c1 && !listsData.complexities.includes(c1)) listsData.complexities.push(c1);
      if (c2 && !listsData.pageStatuses.includes(c2)) listsData.pageStatuses.push(c2);
      if (c3 && !listsData.severities.includes(c3)) listsData.severities.push(c3);
      if (c4 && !listsData.priorities.includes(c4)) listsData.priorities.push(c4);
      if (c5 && !listsData.bugStatuses.includes(c5)) listsData.bugStatuses.push(c5);
      if (c6 && !listsData.rootCauses.includes(c6)) listsData.rootCauses.push(c6);
      if (c8 && !listsData.components.includes(c8)) listsData.components.push(c8);
      if (c9 && !listsData.bugTypes.includes(c9)) listsData.bugTypes.push(c9);
      if (c10 && !listsData.developers.includes(c10)) listsData.developers.push(c10);
      if (c11 && !listsData.qaTeam.includes(c11)) listsData.qaTeam.push(c11);
      if (c12 && !listsData.sprints.includes(c12)) listsData.sprints.push(c12);
    }
  }

  // -------------------------------------------------------------
  // 9. Instructions (Sheet 13)
  // -------------------------------------------------------------
  const sInst = wb.getWorksheet('Instructions');
  const instructionsData = {
    title: 'HOW TO USE THIS TRACKING MATRIX',
    steps: [],
    colorCodes: [
      { role: 'Formula Cells', code: '#FFF2CC', desc: 'Auto-calculated. Do not edit.' },
      { role: 'Headers / Banners', code: '#1B365D', desc: 'Sheet headers and section dividers' },
      { role: 'Table Headers', code: '#2B5B84', desc: 'Main column headings' },
      { role: 'Data Rows', code: '#FFFFFF', desc: 'Standard data entry rows' },
      { role: 'Totals', code: '#F2F2F2', desc: 'Summary and aggregation rows' }
    ],
    rules: [
      'Enter one row per page or bug.',
      'Do not overwrite formulas in yellow cells.',
      'Ensure ID values match between Azure Import and Bug Tracker.'
    ]
  };
  if (sInst) {
    for (let r = 4; r <= 25; r++) {
      const row = sInst.getRow(r);
      const step = getCleanVal(row.getCell(1));
      const guidance = getCleanVal(row.getCell(2));
      if (step || guidance) {
        instructionsData.steps.push({ step, guidance });
      }
    }
  }

  // -------------------------------------------------------------
  // 10. miscellaneous (Sheet 16)
  // -------------------------------------------------------------
  const sMisc = wb.getWorksheet('miscellaneous');
  const miscData = {
    nurtureManage: [],
    pwAdmin: [],
    fields: []
  };
  if (sMisc) {
    for (let r = 2; r <= sMisc.rowCount; r++) {
      const row = sMisc.getRow(r);
      const c1 = getCleanVal(row.getCell(1));
      const c2 = getCleanVal(row.getCell(2));
      const c3 = getCleanVal(row.getCell(3));
      const c4 = getCleanVal(row.getCell(4));
      const c8 = getCleanVal(row.getCell(8));
      const c9 = getCleanVal(row.getCell(9));
      if (c1 || c2) miscData.nurtureManage.push({ item: c1, notes: c2 });
      if (c3 || c4) miscData.pwAdmin.push({ item: c3, notes: c4 });
      if (c8 || c9) miscData.fields.push({ item: c8, notes: c9 });
    }
  }

  // -------------------------------------------------------------
  // 11. Mapping (Sheet 21)
  // -------------------------------------------------------------
  const sMap = wb.getWorksheet('Mapping');
  const mappingData = {
    developerMappings: [],
    moduleKeywords: [],
    uiKeywords: [],
    defaultModule: 'EDM',
    defaultNature: 'Functional',
    reportModules: [],
    reportDevelopers: []
  };
  if (sMap) {
    for (let r = 4; r <= sMap.rowCount; r++) {
      const row = sMap.getRow(r);
      const azureName = getCleanVal(row.getCell(1));
      const reportName = getCleanVal(row.getCell(2));
      const modKw = getCleanVal(row.getCell(4));
      const modVal = getCleanVal(row.getCell(5));
      const uiKw = getCleanVal(row.getCell(7));
      const repMod = getCleanVal(row.getCell(11));
      const repDev = getCleanVal(row.getCell(12));

      if (azureName) mappingData.developerMappings.push({ azureAssignee: azureName, cleanName: reportName || azureName });
      if (modKw) mappingData.moduleKeywords.push({ keyword: modKw, module: modVal });
      if (uiKw && !mappingData.uiKeywords.includes(uiKw)) mappingData.uiKeywords.push(uiKw);
      if (repMod && !mappingData.reportModules.includes(repMod)) mappingData.reportModules.push(repMod);
      if (repDev && !mappingData.reportDevelopers.includes(repDev)) mappingData.reportDevelopers.push(repDev);
    }
  }

  const phase6Data = {
    lists: listsData,
    instructions: instructionsData,
    misc: miscData,
    mapping: mappingData
  };
  fs.writeFileSync(
    path.resolve(__dirname, '../src/data/phase6-data.json'),
    JSON.stringify(phase6Data, null, 2)
  );
  console.log('Saved phase6-data.json successfully.');

  // -------------------------------------------------------------
  // 12. Dashboard Extra Data (Rows 135-209)
  // -------------------------------------------------------------
  const sDash = wb.getWorksheet('Dashboard');
  const dailyTimeline = [];
  if (sDash) {
    for (let r = 136; r <= 208; r++) {
      const row = sDash.getRow(r);
      const dateVal = row.getCell(1).value;
      const raised = getNumericVal(row.getCell(2));
      const reopened = getNumericVal(row.getCell(3));
      const closed = getNumericVal(row.getCell(4));
      const pending = getNumericVal(row.getCell(5));
      if (dateVal) {
        let dStr = dateVal instanceof Date ? dateVal.toISOString().split('T')[0] : String(dateVal);
        dailyTimeline.push({ date: dStr, raised, reopened, closed, pending });
      }
    }
  }

  const dashboardExtra = {
    dailyTimeline,
    p1Issues: { totalBugs: 169, fixed: 154, pending: 15 },
    oct15Release: { totalBugs: 60, closed: 47, reopened: 7, pending: 6 },
    quickStats: { yesterday: 5, pendingFromQa: 131, pendingFromDev: 108 }
  };
  fs.writeFileSync(
    path.resolve(__dirname, '../src/data/dashboard-extra.json'),
    JSON.stringify(dashboardExtra, null, 2)
  );
  console.log('Saved dashboard-extra.json successfully.');
}

extractCompleteWorkbook().catch(console.error);
