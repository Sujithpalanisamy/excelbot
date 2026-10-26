import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Save,
  Server,
  Loader2,
  Database
} from 'lucide-react';
import type { SettingsStatusResponse, SettingsUpdateRequest } from '../types';

interface SettingsModalProps {
  currentSettings: SettingsStatusResponse | null;
  onClose: () => void;
  onSave: (updated: SettingsUpdateRequest) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentSettings,
  onClose,
  onSave,
}) => {
  const [serverUrl, setServerUrl] = useState(currentSettings?.server_url || 'http://10.0.0.6:8080/tfs');
  const [org, setOrg] = useState(currentSettings?.organization || 'DefaultCollection');
  const [project, setProject] = useState(currentSettings?.project || 'HRMSEcoSystem');
  const [pat, setPat] = useState('');
  const [mockMode, setMockMode] = useState(currentSettings?.mock_mode ?? false);
  const [aiEnabled, setAiEnabled] = useState(currentSettings?.ai_enabled ?? false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setServerUrl(currentSettings.server_url || 'http://10.0.0.6:8080/tfs');
      setOrg(currentSettings.organization || 'DefaultCollection');
      setProject(currentSettings.project || 'HRMSEcoSystem');
      setMockMode(currentSettings.mock_mode);
      setAiEnabled(currentSettings.ai_enabled);
    }
  }, [currentSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload: SettingsUpdateRequest = {
        server_url: serverUrl.trim(),
        organization: org.trim(),
        project: project.trim(),
        mock_mode: mockMode,
        ai_enabled: aiEnabled,
      };
      if (pat.trim()) {
        payload.pat = pat.trim();
      }
      if (openaiKey.trim()) {
        payload.openai_api_key = openaiKey.trim();
      }

      await onSave(payload);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-2xs" aria-hidden="true">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base sm:text-lg font-bold font-display text-slate-900">
                Application Settings & Azure Connection
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Configure Azure DevOps credentials, local database environment, and QA assistance preferences
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings-modal"
            type="button"
            onClick={onClose}
            aria-label="Close application settings modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Settings configuration form">
          {/* Mock Mode Switch */}
          <div className={`p-3.5 rounded-lg border transition-colors ${
            mockMode
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 font-display">
                  <Server className={`w-4 h-4 ${mockMode ? 'text-amber-600' : 'text-slate-600'}`} aria-hidden="true" />
                  <span>Sandbox / Mock Mode</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, uses realistic simulated HRMS bugs for testing without requiring a live Azure subscription.
                </p>
              </div>

              <button
                id="btn-toggle-mock-mode"
                type="button"
                role="switch"
                aria-checked={mockMode}
                aria-label="Toggle Sandbox Mock Mode"
                onClick={() => setMockMode(!mockMode)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                  mockMode ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${
                    mockMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Azure DevOps Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-display">
              Azure DevOps / TFS Server Configuration
            </h3>

            <div>
              <label htmlFor="settings-server-url" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Server Base URL
              </label>
              <input
                id="settings-server-url"
                name="server_url"
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://10.0.0.6:8080/tfs or https://dev.azure.com"
                className="w-full px-3 py-1.5 text-xs rounded-md bg-white border border-slate-300 text-slate-900 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none shadow-2xs font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                For on-premise Azure DevOps Server / TFS, use your base URL (e.g. <code>http://10.0.0.6:8080/tfs</code>).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="settings-org" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Collection / Organization
                </label>
                <input
                  id="settings-org"
                  name="organization"
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="e.g. DefaultCollection"
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-white border border-slate-300 text-slate-900 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none shadow-2xs font-mono"
                />
              </div>

              <div>
                <label htmlFor="settings-project" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Project Name
                </label>
                <input
                  id="settings-project"
                  name="project"
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. HRMSEcoSystem"
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-white border border-slate-300 text-slate-900 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none shadow-2xs font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="settings-pat" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Personal Access Token (PAT)
                </label>
                {currentSettings?.pat_configured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                    Saved &amp; Active ({currentSettings.pat_masked})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertTriangle className="w-3 h-3 text-amber-600" aria-hidden="true" />
                    Not Configured
                  </span>
                )}
              </div>
              <input
                id="settings-pat"
                name="pat"
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder={currentSettings?.pat_configured ? `Leave blank to keep existing (${currentSettings.pat_masked}), or type new to update` : 'Enter your Personal Access Token'}
                className="w-full px-3 py-1.5 text-xs rounded-md bg-white border border-slate-300 text-slate-900 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none shadow-2xs font-mono"
              />
              {currentSettings?.pat_configured ? (
                <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                  Your token is securely saved in the database. For security, raw tokens are never displayed. Leave blank to keep it.
                </p>
              ) : (
                <div className="mt-1.5 p-2 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-sky-600" aria-hidden="true" />
                  <strong>How to get your PAT:</strong> In Azure DevOps, click profile &rarr; <strong>Security</strong> &rarr; <strong>Personal Access Tokens</strong> &rarr; <strong>+ New Token</strong> &rarr; select <strong>Work Items (Read)</strong>.
                </div>
              )}
            </div>
          </div>

          {/* AI Configuration Section */}
          <div className="pt-3.5 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-display">
                  Local / Cloud Intelligence
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  When disabled, the app uses an internal, privacy-safe rule-based engine that processes data 100% locally.
                </p>
              </div>

              <button
                id="btn-toggle-ai-enabled"
                type="button"
                role="switch"
                aria-checked={aiEnabled}
                aria-label="Toggle AI Summarization"
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                  aiEnabled ? 'bg-sky-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${
                    aiEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {aiEnabled && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="settings-openai-key" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    OpenAI API Key
                  </label>
                  {currentSettings?.ai_key_configured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      Saved &amp; Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                      Not Configured
                    </span>
                  )}
                </div>
                <input
                  id="settings-openai-key"
                  name="openai_key"
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={currentSettings?.ai_key_configured ? 'Leave blank to keep configured key, or type new to update' : 'sk-...'}
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-white border border-slate-300 text-slate-900 focus:border-sky-600 focus:outline-none font-mono shadow-2xs"
                />
                <div className="mt-1.5 p-2 rounded-md bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-center gap-2" role="alert">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" aria-hidden="true" />
                  <span>
                    Warning: Bug descriptions may contain confidential company data. Only enable if authorized by your organization.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3.5 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div className="text-[11px] text-slate-500 space-y-0.5 font-sans">
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-sky-600" aria-hidden="true" />
                <span>Database:</span>
                <span className="font-semibold text-slate-800">{currentSettings?.database || 'PostgreSQL (azure_bugs_db)'}</span>
              </div>
              <div>Output: <span className="font-mono text-slate-600">{currentSettings?.excel_output_path || './output'}</span></div>
            </div>

            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1" role="status">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Saved!
                </span>
              )}
              <button
                id="btn-cancel-settings"
                type="button"
                onClick={onClose}
                className="h-9 btn-secondary inline-flex items-center px-4 text-xs font-semibold rounded-md cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                id="btn-save-settings"
                type="submit"
                disabled={isSaving}
                className="h-9 btn-sky inline-flex items-center gap-1.5 px-4 text-xs font-semibold rounded-md disabled:opacity-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
