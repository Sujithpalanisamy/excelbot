const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function compareWorkbooks() {
  const oldPath = path.resolve(__dirname, '../../backups/Development_QA_Accuracy_Tracker_Automated_UPDATED (2)_ORIGINAL_20261019_184116.xlsx');
  const newPath = path.resolve(__dirname, '../../Development_QA_Accuracy_Tracker_Automated_UPDATED (4) (6) (1).xlsx');

  console.log('Loading old workbook...');
  const wbOld = new ExcelJS.Workbook();
  await wbOld.xlsx.readFile(oldPath);

  console.log('Loading new workbook...');
  const wbNew = new ExcelJS.Workbook();
  await wbNew.xlsx.readFile(newPath);

  console.log('\n=== SHEET COMPARISON ===');
  const oldSheets = wbOld.worksheets.map(s => s.name);
  const newSheets = wbNew.worksheets.map(s => s.name);

  console.log('Old sheets count:', oldSheets.length);
  console.log('New sheets count:', newSheets.length);

  for (const name of newSheets) {
    const sNew = wbNew.getWorksheet(name);
    const sOld = wbOld.getWorksheet(name);

    if (!sOld) {
      console.log(`[NEW SHEET ADDED] ${name}: Rows=${sNew.rowCount}, Cols=${sNew.columnCount}`);
    } else {
      const rowDiff = sNew.rowCount - sOld.rowCount;
      const colDiff = sNew.columnCount - sOld.columnCount;
      if (rowDiff !== 0 || colDiff !== 0) {
        console.log(`[DIFF] ${name}: Rows: ${sOld.rowCount} -> ${sNew.rowCount} (${rowDiff > 0 ? '+' : ''}${rowDiff}), Cols: ${sOld.columnCount} -> ${sNew.columnCount} (${colDiff > 0 ? '+' : ''}${colDiff})`);
      }
    }
  }

  // Check Dashboard sheet in new workbook row by row to see all tables and sections!
  console.log('\n=== NEW DASHBOARD SECTIONS (Sheet 1) ===');
  const sDash = wbNew.getWorksheet('Dashboard');
  for (let r = 1; r <= Math.min(sDash.rowCount, 130); r++) {
    const row = sDash.getRow(r);
    const rowText = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
      .map(c => {
        const v = row.getCell(c).value;
        if (!v) return '';
        return typeof v === 'object' ? (v.result || v.text || '') : String(v);
      })
      .filter(Boolean)
      .join(' | ');

    if (rowText) {
      console.log(`R${r}: ${rowText.slice(0, 140)}`);
    }
  }
}

compareWorkbooks().catch(console.error);
