import path from 'node:path';
import fs from 'node:fs';
import ExcelJS from 'exceljs';
import { config, getWorkspaceRoot } from '../../config/index.js';
import type { BugItem } from '../../types/index.js';

export function cleanSeverity(rawSev: any): string {
  const s = String(rawSev || '').toLowerCase();
  if (s.includes('1') || s.includes('critical')) return 'Critical';
  if (s.includes('2') || s.includes('high')) return 'High';
  if (s.includes('3') || s.includes('medium')) return 'Medium';
  if (s.includes('4') || s.includes('low')) return 'Low';
  return String(rawSev || 'Medium');
}

export function cleanPriority(rawPri: any): string {
  const s = String(rawPri || '').trim().toUpperCase();
  if (s.startsWith('P')) return s;
  const val = parseInt(s, 10);
  if (!isNaN(val)) return `P${val}`;
  return s || 'P2';
}

export function parseIsoOrStrToDt(val: any): any {
  if (!val) return null;
  if (val instanceof Date) return val;
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  return s;
}

export class TrackerService {
  public workspaceRoot: string;
  public backupDir: string;
  private unlockWatcherTimer: NodeJS.Timeout | null = null;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || getWorkspaceRoot();
    this.backupDir = path.join(this.workspaceRoot, 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  public isFileLocked(filePath: string): boolean {
    if (!fs.existsSync(filePath)) return false;
    try {
      const fd = fs.openSync(filePath, 'r+');
      fs.closeSync(fd);
      return false;
    } catch {
      return true;
    }
  }

  public applyPendingIfUnlocked(targetPath?: string): boolean {
    const target = targetPath || this.findWorkbookPath();
    const stem = path.basename(target, path.extname(target));
    const pendingFile = path.join(path.dirname(target), `${stem}.pending.tmp`);
    if (fs.existsSync(pendingFile) && !this.isFileLocked(target)) {
      try {
        fs.copyFileSync(pendingFile, target);
        fs.unlinkSync(pendingFile);
        console.log(`[TrackerService] Microsoft Excel was closed. Successfully applied queued updates to '${path.basename(target)}'.`);
        return true;
      } catch (err: any) {
        console.warn(`[TrackerService] Could not apply pending updates to '${path.basename(target)}': ${err.message}`);
      }
    }
    return false;
  }

  public startUnlockWatcher(trackerPath: string, pendingFile: string): void {
    if (this.unlockWatcherTimer) {
      clearInterval(this.unlockWatcherTimer);
      this.unlockWatcherTimer = null;
    }

    let attempts = 0;
    const maxAttempts = 60; // 60 * 2.5s = 2.5 minutes

    this.unlockWatcherTimer = setInterval(() => {
      attempts++;
      if (!fs.existsSync(pendingFile)) {
        if (this.unlockWatcherTimer) clearInterval(this.unlockWatcherTimer);
        this.unlockWatcherTimer = null;
        return;
      }

      if (!this.isFileLocked(trackerPath)) {
        try {
          fs.copyFileSync(pendingFile, trackerPath);
          fs.unlinkSync(pendingFile);
          console.log(`[TrackerService] Excel was closed. Successfully updated '${path.basename(trackerPath)}'.`);
        } catch (err: any) {
          console.error(`[TrackerService] Failed applying pending updates to '${path.basename(trackerPath)}':`, err.message);
        } finally {
          if (this.unlockWatcherTimer) clearInterval(this.unlockWatcherTimer);
          this.unlockWatcherTimer = null;
        }
      } else if (attempts >= maxAttempts) {
        if (this.unlockWatcherTimer) clearInterval(this.unlockWatcherTimer);
        this.unlockWatcherTimer = null;
      }
    }, 2500);
  }

  public findWorkbookPath(): string {
    if (config.EXCEL_FILE_NAME) {
      const configured = path.isAbsolute(config.EXCEL_FILE_NAME)
        ? config.EXCEL_FILE_NAME
        : path.join(this.workspaceRoot, config.EXCEL_FILE_NAME);
      if (fs.existsSync(configured) && !this.isFileLocked(configured)) return configured;
      if (fs.existsSync(configured)) return configured;
    }

    const pOrig = path.join(this.workspaceRoot, 'Development_QA_Accuracy_Tracker_Automated_UPDATED (2).xlsx');
    const pCopy = path.join(this.workspaceRoot, 'Development_QA_Accuracy_Tracker_Automated_UPDATED (2) - Copy.xlsx');

    if (fs.existsSync(pOrig) && !this.isFileLocked(pOrig)) return pOrig;
    if (fs.existsSync(pCopy) && !this.isFileLocked(pCopy)) return pCopy;
    if (fs.existsSync(pOrig)) return pOrig;
    if (fs.existsSync(pCopy)) return pCopy;

    const candidates = [
      path.join(this.workspaceRoot, 'output', 'Development_QA_Accuracy_Tracker_Automated_UPDATED (2) - Copy.xlsx'),
      path.join(this.workspaceRoot, 'output', 'Development_QA_Accuracy_Tracker_Automated_UPDATED (2).xlsx'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }

    throw new Error(
      `QA Tracker workbook not found in workspace: ${this.workspaceRoot}. ` +
      `Expected 'Development_QA_Accuracy_Tracker_Automated_UPDATED (2) - Copy.xlsx' or 'Development_QA_Accuracy_Tracker_Automated_UPDATED (2).xlsx'.`
    );
  }

  public createBackup(workbookPath?: string): string {
    const target = workbookPath || this.findWorkbookPath();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const stem = path.basename(target, path.extname(target));
    const backupFile = path.join(this.backupDir, `${stem}_BACKUP_${ts}.xlsx`);
    fs.copyFileSync(target, backupFile);
    return backupFile;
  }

  public async syncBugsToTracker(bugs: BugItem[]): Promise<{
    success: boolean;
    message: string;
    inserted_count: number;
    updated_count: number;
    total_processed: number;
    tracker_file: string;
    backup_file?: string;
    excel_open_warning?: boolean;
    status_changed_bugs?: Array<{ id: number; title: string; old_state: string; new_state: string }>;
  }> {
    if (!bugs || bugs.length === 0) {
      return {
        success: true,
        message: 'No bugs to synchronize.',
        inserted_count: 0,
        updated_count: 0,
        total_processed: 0,
        tracker_file: '',
      };
    }

    const trackerPath = this.findWorkbookPath();
    const backupPath = this.createBackup(trackerPath);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(trackerPath);

    const wsAi = wb.getWorksheet('Azure Import');
    const wsBt = wb.getWorksheet('Bug Tracker');

    if (!wsAi || !wsBt) {
      throw new Error(`Workbook '${path.basename(trackerPath)}' is missing required sheets 'Azure Import' and/or 'Bug Tracker'.`);
    }

    // Step 3: Index existing bugs in Azure Import
    const aiIdRows = new Map<number, number>();
    let aiLastDataRow = 3;
    for (let r = 4; r <= wsAi.rowCount; r++) {
      const val = wsAi.getCell(r, 1).value;
      if (val !== null && val !== undefined && String(val).trim()) {
        const num = Number(val);
        if (!isNaN(num)) {
          aiIdRows.set(num, r);
          if (r > aiLastDataRow) aiLastDataRow = r;
        }
      }
    }

    // Step 4: Index existing bugs in Bug Tracker
    const btIdRows = new Map<number, number>();
    let btLastDataRow = 3;
    for (let r = 4; r <= wsBt.rowCount; r++) {
      const val = wsBt.getCell(r, 1).value;
      if (val !== null && val !== undefined && String(val).trim()) {
        const num = Number(val);
        if (!isNaN(num)) {
          btIdRows.set(num, r);
          if (r > btLastDataRow) btLastDataRow = r;
        }
      }
    }

    let insertedAi = 0;
    let updatedAi = 0;
    let insertedBt = 0;
    let updatedBt = 0;
    const statusChangedBugs: Array<{ id: number; title: string; old_state: string; new_state: string }> = [];

    // Step 5: Update or Insert (Sorted ascending by ID so newer bugs always append at the bottom)
    const sortedBugs = [...bugs].sort((a, b) => a.id - b.id);
    for (const bug of sortedBugs) {
      const assignedDisplay = bug.assigned_to_email
        ? `${bug.assigned_to} <${bug.assigned_to_email}>`
        : (bug.assigned_to || '');

      const createdDt = parseIsoOrStrToDt(bug.created_date);
      const closedDt = parseIsoOrStrToDt(bug.closed_date);
      const sevClean = cleanSeverity(bug.severity);
      const priClean = cleanPriority(bug.priority);

      // --- A. AZURE IMPORT ---
      if (aiIdRows.has(bug.id)) {
        const rAi = aiIdRows.get(bug.id)!;
        const oldState = String(wsAi.getCell(rAi, 5).value || '');
        if (oldState && oldState !== bug.state) {
          statusChangedBugs.push({
            id: bug.id,
            title: bug.title,
            old_state: oldState,
            new_state: bug.state,
          });
        }
        wsAi.getCell(rAi, 2).value = bug.work_item_type || 'Bug';
        wsAi.getCell(rAi, 3).value = bug.title;
        wsAi.getCell(rAi, 4).value = assignedDisplay;
        wsAi.getCell(rAi, 5).value = bug.state;
        wsAi.getCell(rAi, 6).value = bug.tags || '';
        if (createdDt) wsAi.getCell(rAi, 7).value = createdDt;
        updatedAi++;
      } else {
        aiLastDataRow++;
        const rAi = aiLastDataRow;
        aiIdRows.set(bug.id, rAi);
        wsAi.getCell(rAi, 1).value = bug.id;
        wsAi.getCell(rAi, 2).value = bug.work_item_type || 'Bug';
        wsAi.getCell(rAi, 3).value = bug.title;
        wsAi.getCell(rAi, 4).value = assignedDisplay;
        wsAi.getCell(rAi, 5).value = bug.state;
        wsAi.getCell(rAi, 6).value = bug.tags || '';
        if (createdDt) wsAi.getCell(rAi, 7).value = createdDt;

        // Formulas in Columns H to P
        wsAi.getCell(rAi, 8).value = { formula: `IF($A${rAi}="","",TRIM(LEFT($D${rAi},FIND("<",$D${rAi}&"<")-1)))` };
        wsAi.getCell(rAi, 9).value = { formula: `IF($A${rAi}="","",IFERROR(INDEX(Mapping!$B$4:$B$43,MATCH($H${rAi},Mapping!$A$4:$A$43,0)),$H${rAi}))` };
        wsAi.getCell(rAi, 10).value = { formula: `IF($A${rAi}="","",IFERROR(INDEX('Bug Tracker'!$E$4:$E$4978,MATCH($A${rAi},'Bug Tracker'!$A$4:$A$4978,0)),IFERROR(INDEX(Mapping!$E$4:$E$43,MATCH(1,INDEX(ISNUMBER(SEARCH(Mapping!$D$4:$D$43,$P${rAi}))*(Mapping!$D$4:$D$43<>""),0),0)),Mapping!$I$4)))` };
        wsAi.getCell(rAi, 11).value = { formula: `IF($A${rAi}="","",IF(ISNUMBER(SEARCH(";ui;",";"&SUBSTITUTE(LOWER($F${rAi}),"; ",";")&";")),"UI",IF(ISNUMBER(SEARCH(";functional;",";"&SUBSTITUTE(LOWER($F${rAi}),"; ",";")&";")),"Functional",IF(SUMPRODUCT(--ISNUMBER(SEARCH(Mapping!$G$4:$G$63,$P${rAi})),--(Mapping!$G$4:$G$63<>""))>0,"UI",Mapping!$J$4))))` };
        wsAi.getCell(rAi, 12).value = { formula: `IF($A${rAi}="","",IF($E${rAi}="Done","Closed","Pending"))` };
        wsAi.getCell(rAi, 13).value = { formula: `IF($A${rAi}="","",IF(OR($E${rAi}="New",$E${rAi}="Approved",$E${rAi}="Committed"),1,0))` };
        wsAi.getCell(rAi, 14).value = { formula: `IF($A${rAi}="","",IF(ISNUMBER(SEARCH("reopen",$F${rAi})),"Yes","No"))` };
        wsAi.getCell(rAi, 15).value = { formula: `IF($A${rAi}="","",IF(COUNTIF('Bug Tracker'!$A$4:$A$4978,$A${rAi})>0,"Existing","NEW - add to Bug Tracker"))` };
        wsAi.getCell(rAi, 16).value = { formula: `IF($A${rAi}="",""," "&LOWER(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE($C${rAi},","," "),"."," "),"/"," "))&" ")` };
        insertedAi++;
      }

      // --- B. BUG TRACKER ---
      let btStatus = 'New';
      if (['Done', 'Closed', 'Resolved'].includes(bug.state)) {
        btStatus = 'Done';
      } else if (['Committed', 'Active', 'In Progress'].includes(bug.state)) {
        btStatus = 'Committed';
      }

      if (btIdRows.has(bug.id)) {
        const rBt = btIdRows.get(bug.id)!;
        wsBt.getCell(rBt, 6).value = bug.title;
        wsBt.getCell(rBt, 11).value = sevClean;
        wsBt.getCell(rBt, 12).value = priClean;
        wsBt.getCell(rBt, 15).value = btStatus;
        if (bug.assigned_to) {
          wsBt.getCell(rBt, 9).value = bug.assigned_to;
        }
        if (closedDt && ['Done', 'Closed', 'Resolved'].includes(bug.state)) {
          wsBt.getCell(rBt, 14).value = closedDt;
        }
        updatedBt++;
      } else {
        btLastDataRow++;
        const rBt = btLastDataRow;
        btIdRows.set(bug.id, rBt);
        wsBt.getCell(rBt, 1).value = bug.id;
        wsBt.getCell(rBt, 3).value = 'Bug';
        wsBt.getCell(rBt, 5).value = bug.page_name || 'Unclassified';
        wsBt.getCell(rBt, 6).value = bug.title;
        wsBt.getCell(rBt, 8).value = bug.assigned_to || '';
        wsBt.getCell(rBt, 9).value = bug.assigned_to || '';
        wsBt.getCell(rBt, 10).value = bug.reporter || '';
        wsBt.getCell(rBt, 11).value = sevClean;
        wsBt.getCell(rBt, 12).value = priClean;
        if (createdDt) wsBt.getCell(rBt, 13).value = createdDt;
        if (closedDt && ['Done', 'Closed', 'Resolved'].includes(bug.state)) {
          wsBt.getCell(rBt, 14).value = closedDt;
        }
        wsBt.getCell(rBt, 15).value = btStatus;

        // Formulas in columns AB:AH
        wsBt.getCell(rBt, 28).value = { formula: `IF($A${rBt}="","",IFERROR(INDEX('Azure Import'!$E$4:$E$4978,MATCH($A${rBt},'Azure Import'!$A$4:$A$4978,0)),"Not in Azure file"))` };
        wsBt.getCell(rBt, 29).value = { formula: `IF($A${rBt}="","",IF(AB${rBt}="Not in Azure file","Check",IF(AND(AB${rBt}="Done",$O${rBt}="Done"),"OK",IF(AND(AB${rBt}<>"Done",$O${rBt}<>"Done"),"OK","Pending"))))` };
        wsBt.getCell(rBt, 30).value = { formula: `IF($A${rBt}="","",IFERROR(INDEX('Azure Import'!$I$4:$I$4978,MATCH($A${rBt},'Azure Import'!$A$4:$A$4978,0)),""))` };
        wsBt.getCell(rBt, 31).value = { formula: `IF($A${rBt}="","",IFERROR(INDEX('Azure Import'!$K$4:$K$4978,MATCH($A${rBt},'Azure Import'!$A$4:$A$4978,0)),""))` };
        wsBt.getCell(rBt, 32).value = { formula: `IF($A${rBt}="","",IF($M${rBt}="","",Dashboard!$B$79-$M${rBt}))` };
        wsBt.getCell(rBt, 33).value = { formula: `IF($A${rBt}="","",IF($AF${rBt}="","",IF($AF${rBt}<=7,"0-7 Days",IF($AF${rBt}<=15,"8-15 Days",IF($AF${rBt}<=30,"16-30 Days",IF($AF${rBt}<=45,"31-45 Days",IF($AF${rBt}<=60,"46-60 Days","60+ Days")))))))` };
        wsBt.getCell(rBt, 34).value = { formula: `IF($A${rBt}="","",IF(OR($AB${rBt}="New",$AB${rBt}="Approved",$AB${rBt}="Committed"),"Yes","No"))` };
        insertedBt++;
      }
    }

    // Step 6: Refresh Dashboard Sheet
    const wsDash = wb.getWorksheet('Dashboard');
    if (wsDash) {
      wsDash.getCell('B8').value = { formula: "COUNTA('Bug Tracker'!$A$4:$A$4978)" };
      wsDash.getCell('B9').value = { formula: 'COUNTIF(\'Bug Tracker\'!$O$4:$O$4978,"New")+COUNTIF(\'Bug Tracker\'!$O$4:$O$4978,"Committed")' };
      wsDash.getCell('B10').value = { formula: 'COUNTIF(\'Bug Tracker\'!$O$4:$O$4978,"Done")' };

      wsDash.getCell('B15').value = { formula: 'COUNTIF(\'Bug Tracker\'!$O$4:$O$4978,"New")' };
      wsDash.getCell('B16').value = { formula: 'COUNTIF(\'Bug Tracker\'!$O$4:$O$4978,"Committed")' };
      wsDash.getCell('B17').value = { formula: 'COUNTIF(\'Bug Tracker\'!$O$4:$O$4978,"Done")' };
      wsDash.getCell('B18').value = { formula: 'SUM(B15:B17)' };

      wsDash.getCell('E15').value = { formula: 'COUNTIF(\'Bug Tracker\'!$K$4:$K$4978,"Critical")' };
      wsDash.getCell('E16').value = { formula: 'COUNTIF(\'Bug Tracker\'!$K$4:$K$4978,"High")' };
      wsDash.getCell('E17').value = { formula: 'COUNTIF(\'Bug Tracker\'!$K$4:$K$4978,"Medium")' };
      wsDash.getCell('E18').value = { formula: 'COUNTIF(\'Bug Tracker\'!$K$4:$K$4978,"Low")' };

      wsDash.getCell('F8').value = { formula: "IFERROR(SUM('Bug Tracker'!$W$4:$W$4978)/COUNTA('Bug Tracker'!$A$4:$A$4978),0)" };
      wsDash.getCell('F9').value = { formula: 'IFERROR(COUNTIF(\'Bug Tracker\'!$K$4:$K$4978,"Critical")/COUNTA(\'Bug Tracker\'!$A$4:$A$4978),0)' };
      wsDash.getCell('F10').value = { formula: 'IFERROR(COUNTIF(\'Bug Tracker\'!$O$4:$O$4978,"Done")/COUNTA(\'Bug Tracker\'!$A$4:$A$4978),0)' };
    }

    // Step 7: Atomic Save via temporary file
    const stem = path.basename(trackerPath, path.extname(trackerPath));
    const tempFile = path.join(path.dirname(trackerPath), `${stem}.tmp.xlsx`);

    try {
      await wb.xlsx.writeFile(tempFile);
      // Integrity check
      const verifyWb = new ExcelJS.Workbook();
      await verifyWb.xlsx.readFile(tempFile);
      if (!verifyWb.getWorksheet('Azure Import')) {
        throw new Error('Temp workbook failed integrity verification.');
      }
    } catch (exc: any) {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      throw new Error(`Failed generating verified update for tracker workbook: ${exc.message}`);
    }

    // Update companion file if exists and unlocked
    const otherCandidate = trackerPath.includes('Copy')
      ? path.join(this.workspaceRoot, 'Development_QA_Accuracy_Tracker_Automated_UPDATED (2).xlsx')
      : path.join(this.workspaceRoot, 'Development_QA_Accuracy_Tracker_Automated_UPDATED (2) - Copy.xlsx');

    if (fs.existsSync(otherCandidate) && !this.isFileLocked(otherCandidate)) {
      try {
        fs.copyFileSync(tempFile, otherCandidate);
      } catch {
        // Continue
      }
    }

    // Check if target is locked by Excel
    if (this.isFileLocked(trackerPath)) {
      const pendingFile = path.join(path.dirname(trackerPath), `${stem}.pending.tmp`);
      try {
        fs.copyFileSync(tempFile, pendingFile);
      } catch {
        // Continue
      }
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

      this.startUnlockWatcher(trackerPath, pendingFile);

      return {
        success: false,
        message: `Primary workbook '${path.basename(trackerPath)}' is currently open in Microsoft Excel. Close Excel to apply updates directly to your workbook. (Your updates are queued and will update automatically once Excel is closed).`,
        inserted_count: 0,
        updated_count: 0,
        total_processed: bugs.length,
        status_changed_bugs: statusChangedBugs,
        tracker_file: trackerPath,
        backup_file: backupPath,
        excel_open_warning: true,
      };
    }

    // Safely replace target workbook directly in-place (no _LATEST duplicate file)
    try {
      fs.copyFileSync(tempFile, trackerPath);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch (saveErr: any) {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      throw new Error(`Failed writing updates to '${path.basename(trackerPath)}': ${saveErr.message}`);
    }

    return {
      success: true,
      message: `Successfully updated '${path.basename(trackerPath)}'. Added ${insertedAi} new bug(s), updated ${updatedAi} existing bug(s). All report sheets refreshed.`,
      inserted_count: insertedAi,
      updated_count: updatedAi,
      total_processed: bugs.length,
      status_changed_bugs: statusChangedBugs,
      tracker_file: trackerPath,
      backup_file: backupPath,
      excel_open_warning: false,
    };
  }
}

export const trackerService = new TrackerService();
