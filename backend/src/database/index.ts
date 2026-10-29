import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/index.js';
import type { BugItem, SyncLogEntry } from '../types/index.js';

const { Pool } = pg;

export const isPostgres =
  config.DATABASE_URL.startsWith('postgres://') || config.DATABASE_URL.startsWith('postgresql://');

let pgPool: pg.Pool | null = null;
let sqliteDb: DatabaseSync | null = null;

// In-memory cache for blazing fast read operations
const bugsCache = new Map<number, BugItem>();
const settingsCache = new Map<string, string>();
const chatCache: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> = [];
const syncLogsCache: SyncLogEntry[] = [];
const customDeploymentsCache: any[] = [];

export function getPgPool(): pg.Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pgPool;
}

export function getSqliteDb(): DatabaseSync {
  if (!sqliteDb) {
    const dbPath = config.DATABASE_URL.replace('sqlite:///', '').replace('sqlite://', '');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    sqliteDb = new DatabaseSync(dbPath);
  }
  return sqliteDb;
}

export function getDb(): any {
  if (isPostgres) {
    return getPgPool();
  }
  return getSqliteDb();
}

function rowToBug(row: any): BugItem {
  return {
    id: Number(row.id),
    work_item_type: String(row.work_item_type || 'Bug'),
    title: String(row.title || ''),
    description: String(row.description || ''),
    repro_steps: String(row.repro_steps || ''),
    acceptance_criteria: String(row.acceptance_criteria || ''),
    state: String(row.state || 'New'),
    reason: String(row.reason || ''),
    severity: String(row.severity || '3 - Medium'),
    priority: Number(row.priority ?? 2),
    assigned_to: String(row.assigned_to || 'Unassigned'),
    assigned_to_email: String(row.assigned_to_email || ''),
    reporter: String(row.reporter || 'Unknown'),
    created_date: String(row.created_date || ''),
    changed_date: String(row.changed_date || ''),
    closed_date: String(row.closed_date || ''),
    area_path: String(row.area_path || ''),
    iteration_path: String(row.iteration_path || ''),
    tags: String(row.tags || ''),
    project_name: String(row.project_name || ''),
    page_name: String(row.page_name || 'Unclassified'),
    manual_page_override: row.manual_page_override ?? null,
    ai_summary: String(row.ai_summary_json || ''),
    bug_url: String(row.bug_url || ''),
    last_synced: String(row.last_synced || ''),
  };
}

export async function initDb(): Promise<void> {
  if (isPostgres) {
    const pool = getPgPool();
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bugs (
          id INTEGER PRIMARY KEY,
          work_item_type TEXT DEFAULT 'Bug',
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          repro_steps TEXT DEFAULT '',
          acceptance_criteria TEXT DEFAULT '',
          state TEXT DEFAULT 'New',
          reason TEXT DEFAULT '',
          severity TEXT DEFAULT '3 - Medium',
          priority INTEGER DEFAULT 2,
          assigned_to TEXT DEFAULT 'Unassigned',
          assigned_to_email TEXT DEFAULT '',
          reporter TEXT DEFAULT 'Unknown',
          created_date TEXT DEFAULT '',
          changed_date TEXT DEFAULT '',
          closed_date TEXT DEFAULT '',
          area_path TEXT DEFAULT '',
          iteration_path TEXT DEFAULT '',
          tags TEXT DEFAULT '',
          project_name TEXT DEFAULT '',
          page_name TEXT DEFAULT 'Unclassified',
          manual_page_override TEXT DEFAULT NULL,
          ai_summary_json TEXT DEFAULT NULL,
          bug_url TEXT DEFAULT '',
          last_synced TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chat_history (
          id SERIAL PRIMARY KEY,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sync_logs (
          id SERIAL PRIMARY KEY,
          timestamp TEXT NOT NULL,
          mode TEXT NOT NULL,
          status TEXT NOT NULL,
          duration_seconds DOUBLE PRECISION DEFAULT 0.0,
          total_found INTEGER DEFAULT 0,
          new_inserted INTEGER DEFAULT 0,
          existing_updated INTEGER DEFAULT 0,
          details_json TEXT DEFAULT '',
          error_message TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS custom_deployments (
          id SERIAL PRIMARY KEY,
          deployment_date TEXT NOT NULL,
          type TEXT DEFAULT 'Bug',
          item_name TEXT NOT NULL,
          developers TEXT DEFAULT '',
          severity TEXT DEFAULT '3 - Medium',
          priority TEXT DEFAULT 'P2',
          status TEXT DEFAULT 'Completed',
          qa_status TEXT DEFAULT 'Closed',
          environment TEXT DEFAULT 'Production',
          notes TEXT DEFAULT '',
          bugs_count INTEGER DEFAULT 1,
          tasks_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT ''
        );

        CREATE INDEX IF NOT EXISTS idx_bugs_page_name ON bugs(page_name);
        CREATE INDEX IF NOT EXISTS idx_bugs_state ON bugs(state);
        CREATE INDEX IF NOT EXISTS idx_bugs_assigned_to ON bugs(assigned_to);
      `);

      // Pre-warm memory cache from PostgreSQL
      const [bugsRes, settingsRes, logsRes, deploymentsRes] = await Promise.all([
        pool.query('SELECT * FROM bugs ORDER BY id DESC'),
        pool.query('SELECT * FROM app_settings'),
        pool.query('SELECT * FROM sync_logs ORDER BY id DESC LIMIT 50'),
        pool.query('SELECT * FROM custom_deployments ORDER BY id DESC'),
      ]);

      for (const row of bugsRes.rows) {
        bugsCache.set(Number(row.id), rowToBug(row));
      }
      for (const row of settingsRes.rows) {
        settingsCache.set(row.key, row.value);
      }
      customDeploymentsCache.length = 0;
      for (const row of deploymentsRes.rows) {
        customDeploymentsCache.push(row);
      }
      syncLogsCache.length = 0;
      for (const row of logsRes.rows) {
        syncLogsCache.push({
          id: Number(row.id),
          timestamp: String(row.timestamp),
          mode: String(row.mode),
          status: String(row.status),
          duration_seconds: Number(row.duration_seconds),
          total_found: Number(row.total_found),
          new_inserted: Number(row.new_inserted),
          existing_updated: Number(row.existing_updated),
          details_json: row.details_json,
          error_message: row.error_message,
        });
      }
      console.log(`[Database] PostgreSQL ready. Loaded ${bugsCache.size} bugs, ${settingsCache.size} settings into memory cache.`);
    } catch (err: any) {
      console.error('[Database] Failed to initialize PostgreSQL:', err.message);
    }
  } else {
    // SQLite setup
    const db = getSqliteDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS bugs (
        id INTEGER PRIMARY KEY,
        work_item_type TEXT DEFAULT 'Bug',
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        repro_steps TEXT DEFAULT '',
        acceptance_criteria TEXT DEFAULT '',
        state TEXT DEFAULT 'New',
        reason TEXT DEFAULT '',
        severity TEXT DEFAULT '3 - Medium',
        priority INTEGER DEFAULT 2,
        assigned_to TEXT DEFAULT 'Unassigned',
        assigned_to_email TEXT DEFAULT '',
        reporter TEXT DEFAULT 'Unknown',
        created_date TEXT DEFAULT '',
        changed_date TEXT DEFAULT '',
        closed_date TEXT DEFAULT '',
        area_path TEXT DEFAULT '',
        iteration_path TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        project_name TEXT DEFAULT '',
        page_name TEXT DEFAULT 'Unclassified',
        manual_page_override TEXT DEFAULT NULL,
        ai_summary_json TEXT DEFAULT NULL,
        bug_url TEXT DEFAULT '',
        last_synced TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        duration_seconds REAL DEFAULT 0.0,
        total_found INTEGER DEFAULT 0,
        new_inserted INTEGER DEFAULT 0,
        existing_updated INTEGER DEFAULT 0,
        details_json TEXT DEFAULT '',
        error_message TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS custom_deployments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deployment_date TEXT NOT NULL,
        type TEXT DEFAULT 'Bug',
        item_name TEXT NOT NULL,
        developers TEXT DEFAULT '',
        severity TEXT DEFAULT '3 - Medium',
        priority TEXT DEFAULT 'P2',
        status TEXT DEFAULT 'Completed',
        qa_status TEXT DEFAULT 'Closed',
        environment TEXT DEFAULT 'Production',
        notes TEXT DEFAULT '',
        bugs_count INTEGER DEFAULT 1,
        tasks_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT ''
      );

      CREATE INDEX IF NOT EXISTS idx_bugs_page_name ON bugs(page_name);
      CREATE INDEX IF NOT EXISTS idx_bugs_state ON bugs(state);
      CREATE INDEX IF NOT EXISTS idx_bugs_assigned_to ON bugs(assigned_to);
    `);

    // Load into cache
    const rows = db.prepare('SELECT * FROM bugs ORDER BY id DESC').all() as any[];
    for (const r of rows) {
      bugsCache.set(Number(r.id), rowToBug(r));
    }
    const settings = db.prepare('SELECT * FROM app_settings').all() as any[];
    for (const s of settings) {
      settingsCache.set(s.key, s.value);
    }
    try {
      const deployments = db.prepare('SELECT * FROM custom_deployments ORDER BY id DESC').all() as any[];
      customDeploymentsCache.length = 0;
      customDeploymentsCache.push(...deployments);
    } catch {}
  }
}

export function upsertBug(bug: BugItem, manualPage?: string | null): BugItem {
  const existing = bugsCache.get(bug.id);

  let effectivePage = bug.page_name;
  let override = manualPage ?? null;
  let cachedSummary = bug.ai_summary || null;

  if (existing) {
    const existingOverride = existing.manual_page_override;
    const existingSummary = existing.ai_summary;
    if (manualPage !== undefined && manualPage !== null) {
      override = manualPage;
      effectivePage = manualPage;
    } else if (existingOverride) {
      override = existingOverride;
      effectivePage = existingOverride;
    }

    if (!cachedSummary && existingSummary) {
      cachedSummary = existingSummary;
    }
  } else if (manualPage !== undefined && manualPage !== null) {
    override = manualPage;
    effectivePage = manualPage;
  }

  const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const updatedBug: BugItem = {
    ...bug,
    page_name: effectivePage,
    manual_page_override: override,
    ai_summary: cachedSummary || '',
    last_synced: nowIso,
  };

  // Update in-memory cache
  bugsCache.set(bug.id, updatedBug);

  // Persist to DB
  if (isPostgres) {
    const pool = getPgPool();
    const query = `
      INSERT INTO bugs (
        id, work_item_type, title, description, repro_steps, acceptance_criteria,
        state, reason, severity, priority, assigned_to, assigned_to_email,
        reporter, created_date, changed_date, closed_date, area_path,
        iteration_path, tags, project_name, page_name, manual_page_override,
        ai_summary_json, bug_url, last_synced
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT (id) DO UPDATE SET
        work_item_type = EXCLUDED.work_item_type,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        repro_steps = EXCLUDED.repro_steps,
        acceptance_criteria = EXCLUDED.acceptance_criteria,
        state = EXCLUDED.state,
        reason = EXCLUDED.reason,
        severity = EXCLUDED.severity,
        priority = EXCLUDED.priority,
        assigned_to = EXCLUDED.assigned_to,
        assigned_to_email = EXCLUDED.assigned_to_email,
        reporter = EXCLUDED.reporter,
        created_date = EXCLUDED.created_date,
        changed_date = EXCLUDED.changed_date,
        closed_date = EXCLUDED.closed_date,
        area_path = EXCLUDED.area_path,
        iteration_path = EXCLUDED.iteration_path,
        tags = EXCLUDED.tags,
        project_name = EXCLUDED.project_name,
        page_name = EXCLUDED.page_name,
        manual_page_override = EXCLUDED.manual_page_override,
        ai_summary_json = COALESCE(EXCLUDED.ai_summary_json, bugs.ai_summary_json),
        bug_url = EXCLUDED.bug_url,
        last_synced = EXCLUDED.last_synced;
    `;
    pool.query(query, [
      updatedBug.id,
      updatedBug.work_item_type || 'Bug',
      updatedBug.title || '',
      updatedBug.description || '',
      updatedBug.repro_steps || '',
      updatedBug.acceptance_criteria || '',
      updatedBug.state || 'New',
      updatedBug.reason || '',
      updatedBug.severity || '3 - Medium',
      updatedBug.priority ?? 2,
      updatedBug.assigned_to || 'Unassigned',
      updatedBug.assigned_to_email || '',
      updatedBug.reporter || 'Unknown',
      updatedBug.created_date || '',
      updatedBug.changed_date || '',
      updatedBug.closed_date || '',
      updatedBug.area_path || '',
      updatedBug.iteration_path || '',
      updatedBug.tags || '',
      updatedBug.project_name || '',
      updatedBug.page_name,
      updatedBug.manual_page_override,
      updatedBug.ai_summary || null,
      updatedBug.bug_url || '',
      nowIso
    ]).catch(err => console.error('[Database] PostgreSQL upsertBug error:', err.message));
  } else {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT INTO bugs (
        id, work_item_type, title, description, repro_steps, acceptance_criteria,
        state, reason, severity, priority, assigned_to, assigned_to_email,
        reporter, created_date, changed_date, closed_date, area_path,
        iteration_path, tags, project_name, page_name, manual_page_override,
        ai_summary_json, bug_url, last_synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        work_item_type=excluded.work_item_type,
        title=excluded.title,
        description=excluded.description,
        repro_steps=excluded.repro_steps,
        acceptance_criteria=excluded.acceptance_criteria,
        state=excluded.state,
        reason=excluded.reason,
        severity=excluded.severity,
        priority=excluded.priority,
        assigned_to=excluded.assigned_to,
        assigned_to_email=excluded.assigned_to_email,
        reporter=excluded.reporter,
        created_date=excluded.created_date,
        changed_date=excluded.changed_date,
        closed_date=excluded.closed_date,
        area_path=excluded.area_path,
        iteration_path=excluded.iteration_path,
        tags=excluded.tags,
        project_name=excluded.project_name,
        page_name=excluded.page_name,
        manual_page_override=excluded.manual_page_override,
        ai_summary_json=COALESCE(excluded.ai_summary_json, bugs.ai_summary_json),
        bug_url=excluded.bug_url,
        last_synced=excluded.last_synced
    `);
    stmt.run(
      updatedBug.id,
      updatedBug.work_item_type || 'Bug',
      updatedBug.title || '',
      updatedBug.description || '',
      updatedBug.repro_steps || '',
      updatedBug.acceptance_criteria || '',
      updatedBug.state || 'New',
      updatedBug.reason || '',
      updatedBug.severity || '3 - Medium',
      updatedBug.priority ?? 2,
      updatedBug.assigned_to || 'Unassigned',
      updatedBug.assigned_to_email || '',
      updatedBug.reporter || 'Unknown',
      updatedBug.created_date || '',
      updatedBug.changed_date || '',
      updatedBug.closed_date || '',
      updatedBug.area_path || '',
      updatedBug.iteration_path || '',
      updatedBug.tags || '',
      updatedBug.project_name || '',
      updatedBug.page_name,
      updatedBug.manual_page_override ?? null,
      updatedBug.ai_summary ?? null,
      updatedBug.bug_url || '',
      nowIso
    );
  }

  return updatedBug;
}

export function upsertBugsBulk(bugs: BugItem[]): void {
  if (!bugs || bugs.length === 0) return;
  for (const b of bugs) {
    upsertBug(b);
  }
}

export function getBug(bugId: number): BugItem | null {
  return bugsCache.get(bugId) || null;
}

export function getAllBugs(filters?: {
  search?: string;
  page_name?: string;
  state?: string;
  severity?: string;
  priority?: number;
  assigned_to?: string;
}): BugItem[] {
  let list = Array.from(bugsCache.values());

  // Guarantee 100% unique items (deduplicated by ID and normalized title)
  const seenIds = new Set<number>();
  const seenTitles = new Set<string>();
  const uniqueList: BugItem[] = [];

  for (const b of list) {
    if (seenIds.has(b.id)) continue;
    const normTitle = (b.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (normTitle && seenTitles.has(normTitle)) continue;

    seenIds.add(b.id);
    if (normTitle) seenTitles.add(normTitle);
    uniqueList.push(b);
  }
  list = uniqueList;

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(b =>
      b.id.toString().includes(q) ||
      (b.title || '').toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q) ||
      (b.tags || '').toLowerCase().includes(q)
    );
  }

  if (filters?.page_name) {
    list = list.filter(b => b.page_name === filters.page_name);
  }

  if (filters?.state) {
    list = list.filter(b => b.state === filters.state);
  }

  if (filters?.severity) {
    list = list.filter(b => b.severity === filters.severity);
  }

  if (filters?.priority !== undefined && filters?.priority !== null) {
    list = list.filter(b => b.priority === filters.priority);
  }

  if (filters?.assigned_to) {
    list = list.filter(b => b.assigned_to === filters.assigned_to);
  }

  list.sort((a, b) => b.id - a.id);
  return list;
}

export async function deleteBug(bugId: number): Promise<boolean> {
  bugsCache.delete(bugId);
  if (isPostgres) {
    const pool = getPgPool();
    await pool.query('DELETE FROM bugs WHERE id = $1', [bugId]);
  } else {
    const db = getSqliteDb();
    db.prepare('DELETE FROM bugs WHERE id = ?').run(bugId);
  }
  return true;
}

export async function clearAllBugs(): Promise<void> {
  bugsCache.clear();
  if (isPostgres) {
    const pool = getPgPool();
    await pool.query('TRUNCATE TABLE bugs');
  } else {
    const db = getSqliteDb();
    db.prepare('DELETE FROM bugs').run();
  }
}

export async function reloadBugsCache(): Promise<number> {
  bugsCache.clear();
  if (isPostgres) {
    const pool = getPgPool();
    const res = await pool.query('SELECT * FROM bugs ORDER BY id DESC');
    for (const row of res.rows) {
      bugsCache.set(Number(row.id), rowToBug(row));
    }
  } else {
    const db = getSqliteDb();
    const rows = db.prepare('SELECT * FROM bugs ORDER BY id DESC').all() as any[];
    for (const r of rows) {
      bugsCache.set(Number(r.id), rowToBug(r));
    }
  }
  return bugsCache.size;
}

export function setManualPage(bugId: number, pageName: string): boolean {
  const bug = bugsCache.get(bugId);
  if (!bug) return false;

  bug.page_name = pageName;
  bug.manual_page_override = pageName;
  bugsCache.set(bugId, bug);

  if (isPostgres) {
    const pool = getPgPool();
    pool.query('UPDATE bugs SET page_name = $1, manual_page_override = $2 WHERE id = $3', [pageName, pageName, bugId])
      .catch(err => console.error('[Database] setManualPage error:', err.message));
  } else {
    const db = getSqliteDb();
    db.prepare('UPDATE bugs SET page_name = ?, manual_page_override = ? WHERE id = ?').run(pageName, pageName, bugId);
  }
  return true;
}

export function getManualPage(bugId: number): string | null {
  return bugsCache.get(bugId)?.manual_page_override || null;
}

export function saveAiSummary(bugId: number, summaryJson: string): void {
  const bug = bugsCache.get(bugId);
  if (bug) {
    bug.ai_summary = summaryJson;
    bugsCache.set(bugId, bug);
  }

  if (isPostgres) {
    const pool = getPgPool();
    pool.query('UPDATE bugs SET ai_summary_json = $1 WHERE id = $2', [summaryJson, bugId])
      .catch(err => console.error('[Database] saveAiSummary error:', err.message));
  } else {
    const db = getSqliteDb();
    db.prepare('UPDATE bugs SET ai_summary_json = ? WHERE id = ?').run(summaryJson, bugId);
  }
}

export function getAiSummary(bugId: number): string | null {
  return bugsCache.get(bugId)?.ai_summary || null;
}

export function saveSetting(key: string, value: string): void {
  settingsCache.set(key, value);

  if (isPostgres) {
    const pool = getPgPool();
    pool.query(
      'INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, value]
    ).catch(err => console.error('[Database] saveSetting error:', err.message));
  } else {
    const db = getSqliteDb();
    db.prepare(`
      INSERT INTO app_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `).run(key, value);
  }
}

export function getSetting(key: string, defaultValue = ''): string {
  return settingsCache.get(key) ?? defaultValue;
}

export function getSettings(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of settingsCache.entries()) {
    result[k] = v;
  }
  return result;
}

export function saveChatMessage(role: string, content: string): void {
  const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
  chatCache.push({ role: role as 'user' | 'assistant', content, timestamp: nowIso });

  if (isPostgres) {
    const pool = getPgPool();
    pool.query('INSERT INTO chat_history (role, content, created_at) VALUES ($1, $2, $3)', [role, content, nowIso])
      .catch(err => console.error('[Database] saveChatMessage error:', err.message));
  } else {
    const db = getSqliteDb();
    db.prepare('INSERT INTO chat_history (role, content, created_at) VALUES (?, ?, ?)').run(role, content, nowIso);
  }
}

export function getChatHistory(limit = 50): Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> {
  return chatCache.slice(-limit);
}

export function saveSyncLog(logData: {
  timestamp?: string;
  mode?: string;
  status?: string;
  duration_seconds?: number;
  total_found?: number;
  new_inserted?: number;
  existing_updated?: number;
  details?: any;
  error_message?: string;
}): number {
  const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const entry: SyncLogEntry = {
    id: Date.now(),
    timestamp: logData.timestamp || nowIso,
    mode: logData.mode || 'incremental',
    status: logData.status || 'SUCCESS',
    duration_seconds: Number(logData.duration_seconds || 0),
    total_found: Number(logData.total_found || 0),
    new_inserted: Number(logData.new_inserted || 0),
    existing_updated: Number(logData.existing_updated || 0),
    details_json: JSON.stringify(logData.details || {}),
    error_message: logData.error_message || '',
  };

  syncLogsCache.unshift(entry);
  if (syncLogsCache.length > 50) syncLogsCache.pop();

  if (isPostgres) {
    const pool = getPgPool();
    pool.query(`
      INSERT INTO sync_logs (timestamp, mode, status, duration_seconds, total_found, new_inserted, existing_updated, details_json, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      entry.timestamp, entry.mode, entry.status, entry.duration_seconds ?? 0,
      entry.total_found ?? 0, entry.new_inserted ?? 0, entry.existing_updated ?? 0,
      entry.details_json, entry.error_message || ''
    ]).catch(err => console.error('[Database] saveSyncLog error:', err.message));
    return entry.id ?? Date.now();
  } else {
    const db = getSqliteDb();
    const res = db.prepare(`
      INSERT INTO sync_logs (
        timestamp, mode, status, duration_seconds, total_found,
        new_inserted, existing_updated, details_json, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.timestamp, entry.mode, entry.status, entry.duration_seconds ?? 0,
      entry.total_found ?? 0, entry.new_inserted ?? 0, entry.existing_updated ?? 0,
      entry.details_json || '', entry.error_message || ''
    );
    return Number(res.lastInsertRowid);
  }
}

export function getLastSyncLog(): SyncLogEntry | null {
  return syncLogsCache[0] || null;
}

export function getSyncLogs(limit = 20): SyncLogEntry[] {
  return syncLogsCache.slice(0, limit);
}

export function getAllCustomDeployments(): any[] {
  return [...customDeploymentsCache];
}

export async function insertCustomDeployment(data: {
  deployment_date: string;
  type?: string;
  item_name: string;
  developers?: string;
  severity?: string;
  priority?: string;
  status?: string;
  qa_status?: string;
  environment?: string;
  notes?: string;
  bugs_count?: number;
  tasks_count?: number;
}): Promise<any> {
  const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const entry: any = {
    id: Date.now(),
    deployment_date: data.deployment_date,
    type: data.type || 'Bug',
    item_name: data.item_name,
    developers: data.developers || 'Team',
    severity: data.severity || '3 - Medium',
    priority: data.priority || 'P2',
    status: data.status || 'Completed',
    qa_status: data.qa_status || 'Closed',
    environment: data.environment || 'Production',
    notes: data.notes || '',
    bugs_count: Number(data.bugs_count ?? 1),
    tasks_count: Number(data.tasks_count ?? 0),
    created_at: nowIso,
  };

  if (isPostgres) {
    const pool = getPgPool();
    const res = await pool.query(`
      INSERT INTO custom_deployments (
        deployment_date, type, item_name, developers, severity,
        priority, status, qa_status, environment, notes, bugs_count, tasks_count, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      entry.deployment_date, entry.type, entry.item_name, entry.developers, entry.severity,
      entry.priority, entry.status, entry.qa_status, entry.environment, entry.notes,
      entry.bugs_count, entry.tasks_count, entry.created_at
    ]);
    if (res.rows && res.rows[0]) {
      entry.id = Number(res.rows[0].id);
    }
  } else {
    const db = getSqliteDb();
    const res = db.prepare(`
      INSERT INTO custom_deployments (
        deployment_date, type, item_name, developers, severity,
        priority, status, qa_status, environment, notes, bugs_count, tasks_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.deployment_date, entry.type, entry.item_name, entry.developers, entry.severity,
      entry.priority, entry.status, entry.qa_status, entry.environment, entry.notes,
      entry.bugs_count, entry.tasks_count, entry.created_at
    );
    entry.id = Number(res.lastInsertRowid);
  }

  customDeploymentsCache.unshift(entry);
  return entry;
}

export async function deleteCustomDeployment(id: number): Promise<boolean> {
  const index = customDeploymentsCache.findIndex(d => Number(d.id) === Number(id));
  if (index !== -1) {
    customDeploymentsCache.splice(index, 1);
  }

  if (isPostgres) {
    const pool = getPgPool();
    await pool.query('DELETE FROM custom_deployments WHERE id = $1', [id]);
  } else {
    const db = getSqliteDb();
    db.prepare('DELETE FROM custom_deployments WHERE id = ?').run(id);
  }
  return true;
}

