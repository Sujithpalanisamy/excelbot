import { Router } from 'express';
import { SyncRequestSchema } from '../validators/schemas.js';
import { syncService } from '../services/sync-service.js';
import { getSyncLogs, getLastSyncLog } from '../database/index.js';

export const syncRouter = Router();

syncRouter.post('/now', async (req, res, next) => {
  try {
    const parsed = SyncRequestSchema.parse(req.body || {});
    const result = await syncService.syncNow(parsed.mode);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

syncRouter.get('/status', (req, res, next) => {
  try {
    const status = syncService.getStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

syncRouter.get('/logs', (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    res.json({
      logs: getSyncLogs(isNaN(limit) ? 20 : limit),
      last_sync: getLastSyncLog(),
    });
  } catch (err) {
    next(err);
  }
});
