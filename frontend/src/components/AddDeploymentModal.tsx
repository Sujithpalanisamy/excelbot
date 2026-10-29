import React, { useState } from 'react';
import { X, Rocket, Calendar, Layers, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface AddDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddDeploymentModal: React.FC<AddDeploymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [deploymentDate, setDeploymentDate] = useState(todayStr);
  const [itemName, setItemName] = useState('');
  const [buildVersion, setBuildVersion] = useState('');
  const [type, setType] = useState<'Bug' | 'Task' | 'Release'>('Bug');
  const [developers, setDevelopers] = useState('');
  const [severity, setSeverity] = useState('3 - Medium');
  const [priority, setPriority] = useState('P2');
  const [qaStatus, setQaStatus] = useState('Closed');
  const [environment, setEnvironment] = useState('Production');
  const [bugsCount, setBugsCount] = useState<number>(1);
  const [tasksCount, setTasksCount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setError('Item Name / Feature description is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const fullNotes = [
        buildVersion ? `Build: ${buildVersion}` : '',
        environment ? `Env: ${environment}` : '',
        notes.trim()
      ].filter(Boolean).join(' | ');

      await api.addDeployment({
        deployment_date: deploymentDate,
        type: type === 'Release' ? 'Bug' : type,
        item_name: buildVersion ? `[${buildVersion}] ${itemName.trim()}` : itemName.trim(),
        developers: developers.trim() || 'Development Team',
        severity,
        priority,
        status: 'Completed',
        qa_status: qaStatus,
        environment,
        notes: fullNotes,
        bugs_count: Number(bugsCount) || 1,
        tasks_count: Number(tasksCount) || 0,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record deployment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1b365d] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Rocket className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Manual Add Deployment Record</h2>
              <p className="text-xs text-sky-200">Record a live release, hotfix, or deployed build into database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Date & Build Version */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Deployment Date *
              </label>
              <input
                type="date"
                value={deploymentDate}
                onChange={(e) => setDeploymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Release / Build Version
              </label>
              <input
                type="text"
                placeholder="e.g. v2.6.0 or Sprint 24 Hotfix"
                value={buildVersion}
                onChange={(e) => setBuildVersion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
              />
            </div>
          </div>

          {/* Row 2: Item Name / Feature Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deployment Item / Module Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Attendance Module Geofence Patch & Payroll Slip Fix"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
            />
          </div>

          {/* Row 3: Developers & Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Developer(s) Involved
              </label>
              <input
                type="text"
                placeholder="e.g. KiranKumar N, Raghupavan"
                value={developers}
                onChange={(e) => setDevelopers(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
              >
                <option value="Production">Production (Live)</option>
                <option value="UAT">UAT / Staging</option>
                <option value="QA Test">QA Environment</option>
              </select>
            </div>
          </div>

          {/* Row 4: Counts (Bugs Deployed & Tasks Deployed) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
              >
                <option value="Bug">Bug Fix Release</option>
                <option value="Task">Task / Feature</option>
                <option value="Release">Combined Release</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bugs Deployed
              </label>
              <input
                type="number"
                min="0"
                value={bugsCount}
                onChange={(e) => setBugsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tasks Deployed
              </label>
              <input
                type="number"
                min="0"
                value={tasksCount}
                onChange={(e) => setTasksCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Row 5: QA Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> QA Status
              </label>
              <select
                value={qaStatus}
                onChange={(e) => setQaStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
              >
                <option value="Closed">Closed (Verified Fixed)</option>
                <option value="Pending QA">Pending QA (Retest Pending)</option>
                <option value="Reopened">Reopened (Failed Retest)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
              >
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
              >
                <option value="1 - Critical">1 - Critical</option>
                <option value="2 - High">2 - High</option>
                <option value="3 - Medium">3 - Medium</option>
                <option value="4 - Low">4 - Low</option>
              </select>
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Release Notes / Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Approved by Lead QA; verified across Chrome & Edge"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#1b365d] focus:outline-hidden text-slate-800"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold rounded-md border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#1b365d] hover:bg-[#234575] text-white font-semibold rounded-md shadow-xs transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Save Deployment Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
