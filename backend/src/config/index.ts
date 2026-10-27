import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

// Resolve project root (parent of backend)
const backendDir = path.resolve(import.meta.dirname, '..', '..');
const workspaceRoot = path.resolve(backendDir, '..');

// Load .env from workspace root or backend dir
const rootEnvPath = path.join(workspaceRoot, '.env');
const backendEnvPath = path.join(backendDir, '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

export interface AppConfig {
  AZURE_DEVOPS_BASE_URL: string;
  AZURE_DEVOPS_ORG: string;
  AZURE_DEVOPS_PROJECT: string;
  AZURE_DEVOPS_PAT: string;
  MOCK_MODE: boolean;
  BACKEND_HOST: string;
  BACKEND_PORT: number;
  EXCEL_OUTPUT_DIR: string;
  EXCEL_FILE_NAME: string;
  DATABASE_URL: string;
  AI_ENABLED: boolean;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  WORKSPACE_ROOT: string;
  BACKEND_DIR: string;
}

function resolveDatabasePath(): string {
  if (process.env.DATABASE_URL) {
    const val = process.env.DATABASE_URL.trim();
    if (val.startsWith('postgres://') || val.startsWith('postgresql://')) {
      return val;
    }
    const raw = val.replace('sqlite:///', '').replace('sqlite://', '');
    if (path.isAbsolute(raw)) return raw;
    if (fs.existsSync(path.join(backendDir, raw))) return path.join(backendDir, raw);
    return path.resolve(workspaceRoot, raw);
  }
  if (fs.existsSync(path.join(backendDir, 'azure_bugs.db'))) {
    return path.join(backendDir, 'azure_bugs.db');
  }
  return path.join(workspaceRoot, 'azure_bugs.db');
}

export const config: AppConfig = {
  AZURE_DEVOPS_BASE_URL: process.env.AZURE_DEVOPS_BASE_URL || 'http://10.0.0.6:8080/tfs',
  AZURE_DEVOPS_ORG: process.env.AZURE_DEVOPS_ORG || 'DefaultCollection',
  AZURE_DEVOPS_PROJECT: process.env.AZURE_DEVOPS_PROJECT || 'HRMSEcoSystem',
  AZURE_DEVOPS_PAT: process.env.AZURE_DEVOPS_PAT || '',
  MOCK_MODE: (process.env.MOCK_MODE || 'false').toLowerCase() === 'true',
  BACKEND_HOST: process.env.BACKEND_HOST || '127.0.0.1',
  BACKEND_PORT: parseInt(process.env.BACKEND_PORT || '8000', 10),
  EXCEL_OUTPUT_DIR: process.env.EXCEL_OUTPUT_DIR ? path.resolve(workspaceRoot, process.env.EXCEL_OUTPUT_DIR) : path.join(workspaceRoot, 'output'),
  EXCEL_FILE_NAME: process.env.EXCEL_FILE_NAME || 'Development_QA_Accuracy_Tracker_Automated_UPDATED (4) (6) (1).xlsx',
  DATABASE_URL: resolveDatabasePath(),
  AI_ENABLED: (process.env.AI_ENABLED || 'false').toLowerCase() === 'true',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  WORKSPACE_ROOT: workspaceRoot,
  BACKEND_DIR: backendDir,
};

// Ensure output directory exists
if (!fs.existsSync(config.EXCEL_OUTPUT_DIR)) {
  fs.mkdirSync(config.EXCEL_OUTPUT_DIR, { recursive: true });
}

export function maskSecret(secret?: string | null): string {
  if (!secret) return '';
  if (secret.length <= 6) return '******';
  return secret.slice(0, 3) + '...' + secret.slice(-3);
}

export function getWorkspaceRoot(): string {
  return config.WORKSPACE_ROOT;
}
