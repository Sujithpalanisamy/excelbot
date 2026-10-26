import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import path from 'node:path';
import fs from 'node:fs';
import { config, getWorkspaceRoot } from '../config/index.js';

const { Pool } = pg;

async function migrate() {
  console.log('=== Starting SQLite to PostgreSQL Migration ===');

  // 1. Locate SQLite DB
  const workspaceRoot = getWorkspaceRoot();
  const sqlitePath = path.join(workspaceRoot, 'azure_bugs.db');
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite database not found at: ${sqlitePath}`);
  }

  const sqlite = new DatabaseSync(sqlitePath);
  console.log(`[1/4] Connected to SQLite database: ${sqlitePath}`);

  // 2. Connect to PostgreSQL
  const pgUrl = process.env.DATABASE_URL?.startsWith('postgres')
    ? process.env.DATABASE_URL
    : 'postgresql://postgres:Password@123@localhost:5432/azure_bugs_db';

  console.log(`[2/4] Connecting to PostgreSQL: ${pgUrl.replace(/:[^:@]+@/, ':****@')}`);
  const pool = new Pool({ connectionString: pgUrl });

  // Test connection
  await pool.query('SELECT 1');
  console.log('      PostgreSQL connection established successfully.');

  // 3. Create Schema in PostgreSQL
  console.log('[3/4] Creating tables and indexes in PostgreSQL...');
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

    CREATE INDEX IF NOT EXISTS idx_bugs_page_name ON bugs(page_name);
    CREATE INDEX IF NOT EXISTS idx_bugs_state ON bugs(state);
    CREATE INDEX IF NOT EXISTS idx_bugs_assigned_to ON bugs(assigned_to);
  `);

  // 4. Migrate Data
  console.log('[4/4] Transferring records...');

  // A. Bugs
  const bugs = sqlite.prepare('SELECT * FROM bugs').all() as any[];
  console.log(`      Found ${bugs.length} bugs in SQLite. Migrating to PostgreSQL...`);

  const bugInsertQuery = `
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const b of bugs) {
      await client.query(bugInsertQuery, [
        b.id,
        b.work_item_type || 'Bug',
        b.title || '',
        b.description || '',
        b.repro_steps || '',
        b.acceptance_criteria || '',
        b.state || 'New',
        b.reason || '',
        b.severity || '3 - Medium',
        b.priority ?? 2,
        b.assigned_to || 'Unassigned',
        b.assigned_to_email || '',
        b.reporter || 'Unknown',
        b.created_date || '',
        b.changed_date || '',
        b.closed_date || '',
        b.area_path || '',
        b.iteration_path || '',
        b.tags || '',
        b.project_name || '',
        b.page_name || 'Unclassified',
        b.manual_page_override || null,
        b.ai_summary_json || null,
        b.bug_url || '',
        b.last_synced || ''
      ]);
    }

    // B. App Settings
    const settings = sqlite.prepare('SELECT * FROM app_settings').all() as any[];
    for (const s of settings) {
      await client.query(
        'INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [s.key, s.value]
      );
    }

    // C. Sync Logs
    const syncLogs = sqlite.prepare('SELECT * FROM sync_logs').all() as any[];
    for (const sl of syncLogs) {
      await client.query(`
        INSERT INTO sync_logs (timestamp, mode, status, duration_seconds, total_found, new_inserted, existing_updated, details_json, error_message)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        sl.timestamp, sl.mode, sl.status, sl.duration_seconds || 0.0,
        sl.total_found || 0, sl.new_inserted || 0, sl.existing_updated || 0,
        sl.details_json || '', sl.error_message || ''
      ]);
    }

    await client.query('COMMIT');
    console.log(`      ✓ Migrated ${bugs.length} bugs`);
    console.log(`      ✓ Migrated ${settings.length} settings`);
    console.log(`      ✓ Migrated ${syncLogs.length} sync logs`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n======================================================');
  console.log('🎉 Migration to PostgreSQL Completed Successfully!');
  console.log('======================================================\n');
}

migrate().catch(err => {
  console.error('[FATAL] Migration failed:', err);
  process.exit(1);
});
