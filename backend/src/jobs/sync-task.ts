/**
 * Standalone Azure DevOps Bug Synchronization Task
 * Can be run on-demand or scheduled via Windows Task Scheduler.
 * Does NOT require a web browser to be open.
 */
import { initDb } from '../database/index.js';
import { syncService } from '../services/sync-service.js';

async function main() {
  await initDb();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${now}] Starting scheduled Azure DevOps synchronization (Node.js)...`);

  const result = await syncService.syncNow('incremental');
  const finishedNow = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${finishedNow}] Result: ${result.message || 'Complete'}`);
  console.log(`  Inserted: ${result.new_bugs_inserted || 0} new bug(s)`);
  console.log(`  Updated:  ${result.existing_bugs_updated || 0} existing bug(s)`);
  console.log(`  Total:    ${result.total_found || 0} bug(s) processed`);

  if (result.tracker_file) {
    console.log(`  Tracker File: ${result.tracker_file}`);
  }

  if (!result.success) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[FATAL] Sync task failed:', err);
  process.exit(1);
});
