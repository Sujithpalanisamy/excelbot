import { Router } from 'express';
import { SettingsUpdateSchema } from '../validators/schemas.js';
import { config, maskSecret } from '../config/index.js';
import { getSetting, saveSetting, getAllBugs, isPostgres } from '../database/index.js';
import type { SettingsStatusResponse } from '../types/index.js';

export const settingsRouter = Router();

settingsRouter.get('/status', (req, res, next) => {
  try {
    const dbServer = getSetting('AZURE_DEVOPS_BASE_URL', config.AZURE_DEVOPS_BASE_URL);
    const dbOrg = getSetting('AZURE_DEVOPS_ORG', config.AZURE_DEVOPS_ORG);
    const dbProj = getSetting('AZURE_DEVOPS_PROJECT', config.AZURE_DEVOPS_PROJECT);
    const dbPat = getSetting('AZURE_DEVOPS_PAT', config.AZURE_DEVOPS_PAT);
    const dbMock = getSetting('MOCK_MODE', String(config.MOCK_MODE)).toLowerCase() === 'true';
    const dbAi = getSetting('AI_ENABLED', String(config.AI_ENABLED)).toLowerCase() === 'true';
    const dbAiKey = getSetting('OPENAI_API_KEY', config.OPENAI_API_KEY);

    const allBugs = getAllBugs();

    const response: SettingsStatusResponse = {
      server_url: dbServer,
      organization: dbOrg,
      project: dbProj,
      pat_configured: Boolean(dbPat),
      pat_masked: maskSecret(dbPat),
      mock_mode: dbMock,
      ai_enabled: dbAi,
      ai_key_configured: Boolean(dbAiKey),
      excel_output_path: config.EXCEL_OUTPUT_DIR,
      total_cached_bugs: allBugs.length,
      database: isPostgres ? 'PostgreSQL (azure_bugs_db)' : 'SQLite',
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

settingsRouter.post('/update', (req, res, next) => {
  try {
    const parsed = SettingsUpdateSchema.parse(req.body);

    if (parsed.server_url !== undefined) {
      saveSetting('AZURE_DEVOPS_BASE_URL', parsed.server_url.trim());
      config.AZURE_DEVOPS_BASE_URL = parsed.server_url.trim();
    }
    if (parsed.organization !== undefined) {
      saveSetting('AZURE_DEVOPS_ORG', parsed.organization.trim());
      config.AZURE_DEVOPS_ORG = parsed.organization.trim();
    }
    if (parsed.project !== undefined) {
      saveSetting('AZURE_DEVOPS_PROJECT', parsed.project.trim());
      config.AZURE_DEVOPS_PROJECT = parsed.project.trim();
    }
    if (parsed.pat !== undefined) {
      saveSetting('AZURE_DEVOPS_PAT', parsed.pat.trim());
      config.AZURE_DEVOPS_PAT = parsed.pat.trim();
    }
    if (parsed.mock_mode !== undefined) {
      saveSetting('MOCK_MODE', String(parsed.mock_mode));
      config.MOCK_MODE = parsed.mock_mode;
    }
    if (parsed.ai_enabled !== undefined) {
      saveSetting('AI_ENABLED', String(parsed.ai_enabled));
      config.AI_ENABLED = parsed.ai_enabled;
    }
    if (parsed.openai_api_key !== undefined) {
      saveSetting('OPENAI_API_KEY', parsed.openai_api_key.trim());
      config.OPENAI_API_KEY = parsed.openai_api_key.trim();
    }

    res.json({ success: true, message: 'Settings updated successfully.' });
  } catch (err) {
    next(err);
  }
});
