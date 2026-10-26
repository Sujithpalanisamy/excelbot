import { app } from './app.js';
import { config } from './config/index.js';
import { initDb, getSetting } from './database/index.js';
import { syncService } from './services/sync-service.js';

await initDb();

const host = config.BACKEND_HOST || '127.0.0.1';
const port = config.BACKEND_PORT || 8000;

const server = app.listen(port, host, () => {
  console.log(`[Azure Bug Assistant] Node.js Express server running at http://${host}:${port}`);
  console.log(`[Azure Bug Assistant] Health check at http://${host}:${port}/api/health`);
});

import { trackerService } from './integrations/excel/tracker-service.js';

// Background auto-sync loop (polls every 1 minute so newly raised bugs sync automatically)
const AUTO_SYNC_INTERVAL_MS = 60 * 1000;
let autoSyncTimer: NodeJS.Timeout | null = null;

async function runAutoSyncCheck() {
  try {
    // If workbook was previously locked, check if it's now unlocked and apply pending updates
    trackerService.applyPendingIfUnlocked();

    const isMock = getSetting('MOCK_MODE', String(config.MOCK_MODE)).toLowerCase() === 'true';
    const serverUrl = getSetting('AZURE_DEVOPS_BASE_URL', config.AZURE_DEVOPS_BASE_URL);
    if (!isMock && serverUrl) {
      await syncService.syncNow('incremental');
    }
  } catch (err: any) {
    console.error('[AutoSync] Error during background sync:', err.message);
  }
}

// Initial check after 5 seconds, then recurring every minute
const initialTimer = setTimeout(() => {
  runAutoSyncCheck();
  autoSyncTimer = setInterval(runAutoSyncCheck, AUTO_SYNC_INTERVAL_MS);
}, 5000);

// Graceful shutdown
function shutdown() {
  console.log('\n[Azure Bug Assistant] Shutting down gracefully...');
  clearTimeout(initialTimer);
  if (autoSyncTimer) clearInterval(autoSyncTimer);
  server.close(() => {
    console.log('[Azure Bug Assistant] Server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
