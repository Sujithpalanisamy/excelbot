import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { config, getWorkspaceRoot } from '../config/index.js';

const { Pool } = pg;

export async function deduplicateDatabase(): Promise<{
  removedCount: number;
  remainingCount: number;
  duplicateDetails: Array<{ removedId: number; keptId: number; title: string }>;
}> {
  console.log('=== Checking for Duplicate Bugs in Database ===');
  const pgUrl = config.DATABASE_URL.startsWith('postgres')
    ? config.DATABASE_URL
    : 'postgresql://postgres:postgres@localhost:5432/azure_bugs_db';

  const pool = new Pool({ connectionString: pgUrl });
  const duplicates: Array<{ removedId: number; keptId: number; title: string }> = [];

  try {
    const res = await pool.query('SELECT id, title, page_name, manual_page_override, ai_summary_json, created_date FROM bugs ORDER BY id DESC');
    console.log(`Found ${res.rows.length} total bugs in PostgreSQL database.`);

    const titleMap = new Map<string, any>();
    const idsToRemove: number[] = [];

    for (const row of res.rows) {
      const normalizedTitle = row.title.trim().toLowerCase().replace(/\s+/g, ' ');
      if (titleMap.has(normalizedTitle)) {
        const kept = titleMap.get(normalizedTitle);
        // Prefer keeping the one with manual override or AI summary, else higher ID
        let keepRow = kept;
        let removeRow = row;

        if (!kept.manual_page_override && row.manual_page_override) {
          keepRow = row;
          removeRow = kept;
          titleMap.set(normalizedTitle, row);
        }

        idsToRemove.push(removeRow.id);
        duplicates.push({
          removedId: removeRow.id,
          keptId: keepRow.id,
          title: row.title.trim(),
        });
      } else {
        titleMap.set(normalizedTitle, row);
      }
    }

    if (idsToRemove.length > 0) {
      console.log(`Found ${idsToRemove.length} duplicate bugs to remove:`, idsToRemove);
      for (const d of duplicates) {
        console.log(` - Removing duplicate Bug #${d.removedId} (keeping canonical #${d.keptId}): "${d.title}"`);
      }

      await pool.query('DELETE FROM bugs WHERE id = ANY($1)', [idsToRemove]);
      console.log(`Successfully removed ${idsToRemove.length} duplicate bugs from PostgreSQL.`);

      // Also clean SQLite if present
      const workspaceRoot = getWorkspaceRoot();
      const sqlitePath = path.join(workspaceRoot, 'azure_bugs.db');
      if (fs.existsSync(sqlitePath)) {
        try {
          const sqlite = new DatabaseSync(sqlitePath);
          for (const id of idsToRemove) {
            sqlite.prepare('DELETE FROM bugs WHERE id = ?').run(id);
          }
          console.log(`Also removed duplicates from SQLite cache.`);
        } catch (err: any) {
          console.warn(`SQLite cleanup note:`, err.message);
        }
      }
    } else {
      console.log('No duplicate bugs found in the database. All records are unique!');
    }

    const finalCount = await pool.query('SELECT count(*) FROM bugs');
    const remainingCount = Number(finalCount.rows[0].count);
    console.log(`Final unique bugs count: ${remainingCount}`);

    return {
      removedCount: idsToRemove.length,
      remainingCount,
      duplicateDetails: duplicates,
    };
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1].endsWith('deduplicate.ts')) {
  deduplicateDatabase()
    .then((result) => {
      console.log(`Deduplication finished. Removed: ${result.removedCount}, Remaining: ${result.remainingCount}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Deduplication failed:', err);
      process.exit(1);
    });
}
