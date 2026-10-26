import { Router } from 'express';
import { bugsRouter } from './bugs.routes.js';
import { chatRouter } from './chat.routes.js';
import { excelRouter } from './excel.routes.js';
import { reportsRouter } from './reports.routes.js';
import { settingsRouter } from './settings.routes.js';
import { syncRouter } from './sync.routes.js';
import { config } from '../config/index.js';

import { isPostgres } from '../database/index.js';

export const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'Azure Bug Assistant',
    version: '1.0.0',
    mock_mode: config.MOCK_MODE,
    database: isPostgres ? 'postgresql (azure_bugs_db)' : 'sqlite',
  });
});

apiRouter.use('/bugs', bugsRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/excel', excelRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/sync', syncRouter);
