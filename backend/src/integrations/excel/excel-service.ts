import path from 'node:path';
import fs from 'node:fs';
import ExcelJS from 'exceljs';
import { config } from '../../config/index.js';
import type { BugItem } from '../../types/index.js';

export const ALL_BUGS_COLUMNS = [
  'Bug ID', 'Title', 'Description', 'Repro Steps', 'State', 'Severity',
  'Priority', 'Assigned To', 'Reporter', 'Created Date', 'Changed Date',
  'Closed Date', 'Area Path', 'Iteration Path', 'Tags', 'Page Name',
  'AI Summary', 'Bug URL', 'Last Synced'
];

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A8A' },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

const SECTION_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0F766E' },
};
const SECTION_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

const TOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2E8F0' },
};
const TOTAL_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FF0F172A' },
};

const ZEBRA_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' },
};
const WHITE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFFFF' },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

export function sanitizeSheetName(name: string): string {
  const clean = name.replace(/[\\/*?:\[\]]/g, '_').trim().slice(0, 31);
  return clean || 'Report';
}

export function formatDateStr(val?: string | null): string {
  if (!val) return '';
  try {
    let cleanVal = val.replace('Z', '').replace('T', ' ');
    if (cleanVal.includes('.')) {
      cleanVal = cleanVal.split('.')[0];
    }
    return cleanVal;
  } catch {
    return String(val);
  }
}

function styleHeaderRow(
  ws: ExcelJS.Worksheet,
  rowNumber: number,
  columns: string[],
  fill: ExcelJS.Fill = HEADER_FILL,
  font: Partial<ExcelJS.Font> = HEADER_FONT
) {
  const row = ws.getRow(rowNumber);
  columns.forEach((colName, idx) => {
    const cell = row.getCell(idx + 1);
    cell.value = colName;
    cell.fill = fill;
    cell.font = font;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });
  row.height = 28;
}

function autoFitColumns(ws: ExcelJS.Worksheet, maxBounds: Record<number, number> = {}) {
  ws.columns.forEach((col, colIdx) => {
    let maxLen = 0;
    col.eachCell?.({ includeEmpty: false }, cell => {
      const valStr = cell.value ? String(cell.value) : '';
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    const cap = maxBounds[colIdx + 1] || 40;
    col.width = Math.max(12, Math.min(maxLen + 3, cap));
  });
}

export class ExcelService {
  public outputDir: string;
  public filename: string;
  public filePath: string;

  constructor(outputDir?: string, filename?: string) {
    this.outputDir = outputDir || config.EXCEL_OUTPUT_DIR;
    this.filename = filename || 'Azure_Bug_Assistant.xlsx';
    this.filePath = path.join(this.outputDir, this.filename);
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private async loadOrCreateWorkbook(): Promise<ExcelJS.Workbook> {
    const wb = new ExcelJS.Workbook();
    if (fs.existsSync(this.filePath)) {
      try {
        await wb.xlsx.readFile(this.filePath);
        return wb;
      } catch {
        // Corrupted or locked; return fresh workbook
        return new ExcelJS.Workbook();
      }
    }
    return wb;
  }

  private async safeSave(wb: ExcelJS.Workbook, successMsg: string): Promise<[boolean, string]> {
    try {
      await wb.xlsx.writeFile(this.filePath);
      return [true, successMsg];
    } catch (exc: any) {
      return [
        false,
        `Cannot write to '${path.basename(this.filePath)}' because it is open in Microsoft Excel. Please close Excel and try again: ${exc.message}`,
      ];
    }
  }

  public async saveOrUpdateBugs(
    newOrUpdatedBugs: BugItem[],
    allCurrentBugs: BugItem[]
  ): Promise<[boolean, string]> {
    try {
      const wb = await this.loadOrCreateWorkbook();

      // SHEET 1: All Bugs
      let wsBugs = wb.getWorksheet('All Bugs');
      if (!wsBugs) {
        wsBugs = wb.addWorksheet('All Bugs');
        styleHeaderRow(wsBugs, 1, ALL_BUGS_COLUMNS);
      }

      // Index existing bug IDs
      const existingIdRows = new Map<number, number>();
      for (let r = 2; r <= wsBugs.rowCount; r++) {
        const cellVal = wsBugs.getCell(r, 1).value;
        if (cellVal !== null && cellVal !== undefined) {
          const num = Number(cellVal);
          if (!isNaN(num) && num > 0) {
            existingIdRows.set(num, r);
          }
        }
      }

      const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

      for (const bug of newOrUpdatedBugs) {
        const rowData = [
          bug.id,
          bug.title,
          bug.description,
          bug.repro_steps,
          bug.state,
          bug.severity,
          bug.priority,
          bug.assigned_to,
          bug.reporter,
          formatDateStr(bug.created_date),
          formatDateStr(bug.changed_date),
          formatDateStr(bug.closed_date),
          bug.area_path,
          bug.iteration_path,
          bug.tags,
          bug.page_name,
          bug.ai_summary || '',
          bug.bug_url,
          formatDateStr(bug.last_synced || nowIso),
        ];

        if (existingIdRows.has(bug.id)) {
          const targetRow = existingIdRows.get(bug.id)!;
          const row = wsBugs.getRow(targetRow);
          rowData.forEach((val, idx) => {
            const cell = row.getCell(idx + 1);
            cell.value = val;
            cell.border = THIN_BORDER;
            cell.alignment = {
              vertical: 'middle',
              wrapText: [2, 3, 4, 17].includes(idx + 1),
            };
          });
        } else {
          const row = wsBugs.addRow(rowData);
          const newRowIdx = row.number;
          existingIdRows.set(bug.id, newRowIdx);
          const fill = newRowIdx % 2 === 0 ? ZEBRA_FILL : WHITE_FILL;
          rowData.forEach((_, idx) => {
            const cell = row.getCell(idx + 1);
            cell.fill = fill;
            cell.border = THIN_BORDER;
            cell.alignment = {
              vertical: 'middle',
              wrapText: [2, 3, 4, 17].includes(idx + 1),
            };
          });
        }
      }

      // Freeze header & auto-filter
      wsBugs.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
      if (wsBugs.rowCount > 1) {
        wsBugs.autoFilter = `A1:S${wsBugs.rowCount}`;
      }
      autoFitColumns(wsBugs, { 2: 45, 3: 50, 4: 50, 15: 30, 17: 50, 18: 40 });

      // SHEET 2: Page Summary
      this.generatePageSummarySheet(wb, allCurrentBugs);

      // SHEET 3: Assignee Summary
      this.generateAssigneeSummarySheet(wb, allCurrentBugs);

      // SHEET 4: Report
      this.generateReportSheet(wb, allCurrentBugs);

      return await this.safeSave(wb, `Successfully saved ${newOrUpdatedBugs.length} bug(s) to '${path.basename(this.filePath)}'.`);
    } catch (exc: any) {
      return [false, `Failed writing to Excel: ${exc.message}`];
    }
  }

  private generatePageSummarySheet(wb: ExcelJS.Workbook, bugs: BugItem[]) {
    const sheetName = 'Page Summary';
    const oldSheet = wb.getWorksheet(sheetName);
    if (oldSheet) wb.removeWorksheet(oldSheet.id);

    const ws = wb.addWorksheet(sheetName);
    const headers = [
      'Page Name', 'Total Bugs', 'Open Bugs', 'Active Bugs',
      'Closed Bugs', 'Critical / High Severity', 'High Priority',
    ];
    styleHeaderRow(ws, 1, headers, SECTION_FILL, SECTION_FONT);

    const groups: Record<string, { total: number; open: number; active: number; closed: number; critical: number; high_pri: number }> = {};

    for (const b of bugs) {
      const page = b.page_name || 'Unclassified';
      if (!groups[page]) {
        groups[page] = { total: 0, open: 0, active: 0, closed: 0, critical: 0, high_pri: 0 };
      }
      groups[page].total += 1;

      const st = (b.state || '').toLowerCase();
      if (['new', 'proposed', 'to do'].includes(st)) {
        groups[page].open += 1;
      } else if (['active', 'in progress', 'committed', 'investigating'].includes(st)) {
        groups[page].active += 1;
      } else if (['closed', 'done', 'completed', 'resolved', 'fixed'].includes(st)) {
        groups[page].closed += 1;
      }

      const sev = String(b.severity || '').toLowerCase();
      if (sev.includes('1') || sev.includes('critical') || sev.includes('2') || sev.includes('high')) {
        groups[page].critical += 1;
      }

      if (b.priority === 1) {
        groups[page].high_pri += 1;
      }
    }

    let rowNum = 2;
    let totalAll = 0, totalOpen = 0, totalActive = 0, totalClosed = 0, totalCrit = 0, totalPri = 0;

    for (const pageName of Object.keys(groups).sort()) {
      const stats = groups[pageName];
      totalAll += stats.total;
      totalOpen += stats.open;
      totalActive += stats.active;
      totalClosed += stats.closed;
      totalCrit += stats.critical;
      totalPri += stats.high_pri;

      const row = ws.addRow([
        pageName, stats.total, stats.open, stats.active,
        stats.closed, stats.critical, stats.high_pri,
      ]);

      const fill = rowNum % 2 === 0 ? ZEBRA_FILL : WHITE_FILL;
      for (let c = 1; c <= headers.length; c++) {
        const cell = row.getCell(c);
        cell.fill = fill;
        cell.border = THIN_BORDER;
        cell.alignment = { horizontal: c > 1 ? 'center' : 'left', vertical: 'middle' };
      }
      rowNum++;
    }

    // Totals Row
    const totalsRow = ws.addRow(['TOTAL', totalAll, totalOpen, totalActive, totalClosed, totalCrit, totalPri]);
    for (let c = 1; c <= headers.length; c++) {
      const cell = totalsRow.getCell(c);
      cell.fill = TOTAL_FILL;
      cell.font = TOTAL_FONT;
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: c > 1 ? 'center' : 'left', vertical: 'middle' };
    }

    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    if (ws.rowCount > 2) {
      ws.autoFilter = `A1:G${ws.rowCount - 1}`;
    }
    autoFitColumns(ws);
  }

  private generateAssigneeSummarySheet(wb: ExcelJS.Workbook, bugs: BugItem[]) {
    const sheetName = 'Assignee Summary';
    const oldSheet = wb.getWorksheet(sheetName);
    if (oldSheet) wb.removeWorksheet(oldSheet.id);

    const ws = wb.addWorksheet(sheetName);
    const headers = ['Assigned To', 'Total Bugs', 'Open Bugs', 'Active Bugs', 'Closed Bugs', 'Critical / High Severity'];
    styleHeaderRow(ws, 1, headers, SECTION_FILL, SECTION_FONT);

    const groups: Record<string, { total: number; open: number; active: number; closed: number; critical: number }> = {};

    for (const b of bugs) {
      const assignee = b.assigned_to || 'Unassigned';
      if (!groups[assignee]) {
        groups[assignee] = { total: 0, open: 0, active: 0, closed: 0, critical: 0 };
      }
      groups[assignee].total += 1;

      const st = (b.state || '').toLowerCase();
      if (['new', 'proposed', 'to do'].includes(st)) {
        groups[assignee].open += 1;
      } else if (['active', 'in progress', 'committed', 'investigating'].includes(st)) {
        groups[assignee].active += 1;
      } else if (['closed', 'done', 'completed', 'resolved', 'fixed'].includes(st)) {
        groups[assignee].closed += 1;
      }

      const sev = String(b.severity || '').toLowerCase();
      if (sev.includes('1') || sev.includes('critical') || sev.includes('2') || sev.includes('high')) {
        groups[assignee].critical += 1;
      }
    }

    let rowNum = 2;
    let totalAll = 0, totalOpen = 0, totalActive = 0, totalClosed = 0, totalCrit = 0;

    for (const person of Object.keys(groups).sort()) {
      const stats = groups[person];
      totalAll += stats.total;
      totalOpen += stats.open;
      totalActive += stats.active;
      totalClosed += stats.closed;
      totalCrit += stats.critical;

      const row = ws.addRow([person, stats.total, stats.open, stats.active, stats.closed, stats.critical]);
      const fill = rowNum % 2 === 0 ? ZEBRA_FILL : WHITE_FILL;
      for (let c = 1; c <= headers.length; c++) {
        const cell = row.getCell(c);
        cell.fill = fill;
        cell.border = THIN_BORDER;
        cell.alignment = { horizontal: c > 1 ? 'center' : 'left', vertical: 'middle' };
      }
      rowNum++;
    }

    const totalsRow = ws.addRow(['TOTAL', totalAll, totalOpen, totalActive, totalClosed, totalCrit]);
    for (let c = 1; c <= headers.length; c++) {
      const cell = totalsRow.getCell(c);
      cell.fill = TOTAL_FILL;
      cell.font = TOTAL_FONT;
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: c > 1 ? 'center' : 'left', vertical: 'middle' };
    }

    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    if (ws.rowCount > 2) {
      ws.autoFilter = `A1:F${ws.rowCount - 1}`;
    }
    autoFitColumns(ws);
  }

  private generateReportSheet(wb: ExcelJS.Workbook, bugs: BugItem[]) {
    const sheetName = 'Report';
    const oldSheet = wb.getWorksheet(sheetName);
    if (oldSheet) wb.removeWorksheet(oldSheet.id);

    const ws = wb.addWorksheet(sheetName);

    // Title block
    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'Azure DevOps Bug Assistant - Executive QA Report';
    titleCell.fill = HEADER_FILL;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 36;

    const genTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    ws.getCell('A3').value = 'Report Generated At:';
    ws.getCell('B3').value = genTime;
    ws.getCell('A3').font = { bold: true };

    ws.getCell('A4').value = 'Total Bugs Analyzed:';
    ws.getCell('B4').value = bugs.length;
    ws.getCell('A4').font = { bold: true };

    const statusMap: Record<string, number> = { New: 0, Active: 0, Resolved: 0, Closed: 0 };
    const sevMap: Record<string, number> = { '1 - Critical': 0, '2 - High': 0, '3 - Medium': 0, '4 - Low': 0 };

    for (const b of bugs) {
      const st = b.state || 'New';
      if (['New', 'Proposed', 'To Do'].includes(st)) {
        statusMap['New']++;
      } else if (['Active', 'In Progress', 'Committed', 'Investigating'].includes(st)) {
        statusMap['Active']++;
      } else if (['Resolved', 'Fixed'].includes(st)) {
        statusMap['Resolved']++;
      } else if (['Closed', 'Done', 'Completed'].includes(st)) {
        statusMap['Closed']++;
      }

      const sev = String(b.severity || '');
      if (sev.includes('1')) {
        sevMap['1 - Critical']++;
      } else if (sev.includes('2')) {
        sevMap['2 - High']++;
      } else if (sev.includes('4')) {
        sevMap['4 - Low']++;
      } else {
        sevMap['3 - Medium']++;
      }
    }

    ws.getCell('A6').value = 'State Distribution';
    ws.getCell('A6').font = { bold: true, size: 11, color: { argb: 'FF1E3A8A' } };
    ws.getCell('D6').value = 'Severity Distribution';
    ws.getCell('D6').font = { bold: true, size: 11, color: { argb: 'FF1E3A8A' } };

    let currR = 7;
    for (const [stName, count] of Object.entries(statusMap)) {
      const c1 = ws.getCell(`A${currR}`);
      c1.value = stName;
      c1.border = THIN_BORDER;
      const c2 = ws.getCell(`B${currR}`);
      c2.value = count;
      c2.border = THIN_BORDER;
      currR++;
    }

    currR = 7;
    for (const [sevName, count] of Object.entries(sevMap)) {
      const c1 = ws.getCell(`D${currR}`);
      c1.value = sevName;
      c1.border = THIN_BORDER;
      const c2 = ws.getCell(`E${currR}`);
      c2.value = count;
      c2.border = THIN_BORDER;
      currR++;
    }

    // Detailed bugs list starting at row 13
    const sectionCell = ws.getCell('A13');
    sectionCell.value = 'Detailed Work Items Listing';
    sectionCell.font = { bold: true, size: 12, color: { argb: 'FF0F766E' } };

    const detailCols = ['ID', 'Title', 'Module / Page', 'State', 'Severity', 'Priority', 'Assigned To'];
    styleHeaderRow(ws, 14, detailCols, SECTION_FILL, SECTION_FONT);

    let rIdx = 15;
    for (const b of bugs) {
      const row = ws.getRow(rIdx);
      const rowVals = [b.id, b.title, b.page_name, b.state, b.severity, b.priority, b.assigned_to];
      rowVals.forEach((val, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = val;
        cell.fill = rIdx % 2 === 0 ? ZEBRA_FILL : WHITE_FILL;
        cell.border = THIN_BORDER;
        cell.alignment = { horizontal: [1, 4, 5, 6].includes(cIdx + 1) ? 'center' : 'left', vertical: 'middle' };
      });
      rIdx++;
    }

    autoFitColumns(ws, { 2: 50 });
  }

  public async exportSpecificPageReport(pageName: string, bugs: BugItem[]): Promise<[boolean, string]> {
    try {
      const wb = await this.loadOrCreateWorkbook();
      const safeName = sanitizeSheetName(`${pageName} Report`);

      const oldSheet = wb.getWorksheet(safeName);
      if (oldSheet) wb.removeWorksheet(oldSheet.id);

      const ws = wb.addWorksheet(safeName);
      const pageBugs = bugs.filter(b => (b.page_name || '').toLowerCase() === pageName.toLowerCase());

      ws.mergeCells('A1:G1');
      const headerCell = ws.getCell('A1');
      headerCell.value = `HRMS Module Bug Report: ${pageName}`;
      headerCell.fill = HEADER_FILL;
      headerCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(1).height = 32;

      ws.getCell('A3').value = 'Generated At:';
      ws.getCell('B3').value = new Date().toISOString().replace('T', ' ').slice(0, 19);
      ws.getCell('A3').font = { bold: true };

      ws.getCell('A4').value = 'Total Bugs in Module:';
      ws.getCell('B4').value = pageBugs.length;
      ws.getCell('A4').font = { bold: true };

      const cols = ['Bug ID', 'Title', 'State', 'Severity', 'Priority', 'Assigned To', 'Last Synced'];
      styleHeaderRow(ws, 6, cols, SECTION_FILL, SECTION_FONT);

      let rIdx = 7;
      for (const b of pageBugs) {
        const row = ws.getRow(rIdx);
        const rowVals = [b.id, b.title, b.state, b.severity, b.priority, b.assigned_to, b.last_synced];
        rowVals.forEach((val, cIdx) => {
          const cell = row.getCell(cIdx + 1);
          cell.value = val;
          cell.fill = rIdx % 2 === 0 ? ZEBRA_FILL : WHITE_FILL;
          cell.border = THIN_BORDER;
          cell.alignment = { horizontal: [1, 3, 4, 5, 7].includes(cIdx + 1) ? 'center' : 'left', vertical: 'middle' };
        });
        rIdx++;
      }

      autoFitColumns(ws, { 2: 50 });
      return await this.safeSave(wb, `Generated page report sheet '${safeName}' in Excel workbook.`);
    } catch (exc: any) {
      return [false, `Error generating page report: ${exc.message}`];
    }
  }
}

export const excelService = new ExcelService();
