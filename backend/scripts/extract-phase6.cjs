const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function extractPhase6() {
  const wb = new ExcelJS.Workbook();
  const filePath = path.resolve(__dirname, '../../Development_QA_Accuracy_Tracker_Automated_UPDATED (2).xlsx');
  console.log('Loading workbook from:', filePath);
  await wb.xlsx.readFile(filePath);

  // 1. Sheet 14: Lists
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
      const getVal = (col) => {
        const v = row.getCell(col).value;
        if (!v) return null;
        return typeof v === 'object' ? (v.result || v.text || '') : String(v).trim();
      };

      const cComplexity = getVal(1);
      const cPageStatus = getVal(2);
      const cSeverity = getVal(3);
      const cPriority = getVal(4);
      const cBugStatus = getVal(5);
      const cRootCause = getVal(6);
      const cComponent = getVal(8);
      const cBugType = getVal(9);
      const cDeveloper = getVal(10);
      const cQa = getVal(11);
      const cSprint = getVal(12);

      if (cComplexity) listsData.complexities.push(cComplexity);
      if (cPageStatus) listsData.pageStatuses.push(cPageStatus);
      if (cSeverity) listsData.severities.push(cSeverity);
      if (cPriority) listsData.priorities.push(cPriority);
      if (cBugStatus) listsData.bugStatuses.push(cBugStatus);
      if (cRootCause) listsData.rootCauses.push(cRootCause);
      if (cComponent) listsData.components.push(cComponent);
      if (cBugType) listsData.bugTypes.push(cBugType);
      if (cDeveloper) listsData.developers.push(cDeveloper);
      if (cQa) listsData.qaTeam.push(cQa);
      if (cSprint) listsData.sprints.push(cSprint);
    }
  }

  // 2. Sheet 15: Instructions
  const sInstructions = wb.getWorksheet('Instructions');
  const instructionsData = {
    title: 'HOW TO USE THIS TRACKING MATRIX',
    steps: [],
    colorCodes: [
      { role: 'Table Headers', code: '#1B365D', desc: 'Dark Navy Blue — Primary Section Banners & Column Headers' },
      { role: 'Calculated Totals', code: '#FFF2CC', desc: 'Soft Yellow — Formula-Driven Sum / Average Summary Rows' },
      { role: 'Section Subtitles', code: '#D9E1F2', desc: 'Soft Blue — Module Groups & Table Headers' },
      { role: 'Critical Severity', code: '#FCE4D6', desc: 'Soft Red/Peach — High Defect Alerts & Urgent Focus' },
      { role: 'High Severity', code: '#FFF2CC', desc: 'Soft Yellow — Priority Attention Items' },
      { role: 'Completed / Pass', code: '#E2EFDA', desc: 'Soft Green — 100% Verified Milestones & Passes' }
    ],
    rules: [
      'Enter one row per page in Page Tracker with assigned developers across UI, API, SP, DB and Binding.',
      'Log every bug in Bug Tracker. Original Developer created the component; Fix Developer resolves the defect.',
      'For parent bugs, leave Parent Bug ID blank and select Parent. For internal child bugs, link the Parent ID.',
      'Set Reopened? to Yes and increment No. of Reopens whenever a fix fails QA retesting.',
      'Developer Scorecard & QA Scorecard auto-calculate based on active bug states and testing metrics.',
      'Dashboard formulas recalculate in real-time. Do not type over calculated cells.'
    ]
  };

  if (sInstructions) {
    for (let r = 4; r <= sInstructions.rowCount; r++) {
      const row = sInstructions.getRow(r);
      const step = row.getCell(1).value;
      const guidance = row.getCell(2).value;
      if (step || guidance) {
        instructionsData.steps.push({
          step: String(step || '').trim(),
          guidance: String(guidance || '').trim()
        });
      }
    }
  }

  // 3. Sheet 18: miscellaneous
  const sMisc = wb.getWorksheet('miscellaneous');
  const miscData = {
    nurtureManage: [],
    pwAdmin: [],
    fields: []
  };

  if (sMisc) {
    for (let r = 2; r <= sMisc.rowCount; r++) {
      const row = sMisc.getRow(r);
      const getVal = (col) => {
        const v = row.getCell(col).value;
        if (!v) return '';
        return typeof v === 'object' ? (v.result || v.text || '') : String(v).trim();
      };

      const nmItem = getVal(1);
      const nmNotes = getVal(2);
      const pwItem = getVal(3);
      const pwNotes = getVal(4);
      const fItem = getVal(5);
      const fNotes = getVal(6);

      if (nmItem || nmNotes) {
        miscData.nurtureManage.push({ item: nmItem, notes: nmNotes });
      }
      if (pwItem || pwNotes) {
        miscData.pwAdmin.push({ item: pwItem, notes: pwNotes });
      }
      if (fItem || fNotes) {
        miscData.fields.push({ item: fItem, notes: fNotes });
      }
    }
  }

  // 4. Sheet 22: Mapping
  const sMapping = wb.getWorksheet('Mapping');
  const mappingData = {
    developerMappings: [],
    moduleKeywords: [],
    uiKeywords: [],
    defaultModule: 'EDM',
    defaultNature: 'Functional',
    reportModules: [],
    reportDevelopers: []
  };

  if (sMapping) {
    for (let r = 4; r <= sMapping.rowCount; r++) {
      const row = sMapping.getRow(r);
      const getVal = (col) => {
        const v = row.getCell(col).value;
        if (!v) return '';
        return typeof v === 'object' ? (v.result || v.text || '') : String(v).trim();
      };

      const azAssigned = getVal(1);
      const devClean = getVal(2);
      const modKw = getVal(4);
      const modName = getVal(5);
      const uiKw = getVal(7);
      const repMod = getVal(11);
      const repDev = getVal(12);

      if (azAssigned && devClean) {
        mappingData.developerMappings.push({ azureAssignee: azAssigned, cleanName: devClean });
      }
      if (modKw && modName) {
        mappingData.moduleKeywords.push({ keyword: modKw, module: modName });
      }
      if (uiKw) {
        mappingData.uiKeywords.push(uiKw);
      }
      if (repMod) {
        mappingData.reportModules.push(repMod);
      }
      if (repDev) {
        mappingData.reportDevelopers.push(repDev);
      }
    }
  }

  const outPath = path.resolve(__dirname, '../src/data/phase6-data.json');
  fs.writeFileSync(outPath, JSON.stringify({ lists: listsData, instructions: instructionsData, misc: miscData, mapping: mappingData }, null, 2));
  console.log('Phase 6 extraction complete ->', outPath);
  console.log('Lists:', Object.keys(listsData).map(k => `${k}: ${listsData[k].length}`).join(', '));
  console.log('Instructions steps:', instructionsData.steps.length);
  console.log('Misc items:', `nurture: ${miscData.nurtureManage.length}, pwAdmin: ${miscData.pwAdmin.length}, fields: ${miscData.fields.length}`);
  console.log('Mapping:', `devs: ${mappingData.developerMappings.length}, modKw: ${mappingData.moduleKeywords.length}, uiKw: ${mappingData.uiKeywords.length}`);
}

extractPhase6().catch(err => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
