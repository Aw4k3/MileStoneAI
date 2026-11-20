// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Bell,
  UserCircle,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Key,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useRoadmaps } from '../hooks/useRoadmaps';
import { useStats } from '../hooks/useStats';
import { getGeminiApiKey, setGeminiApiKey } from '../lib/gemini';
import {
  MENTOR_PERSONAS,
  PACING_OPTIONS,
} from '../lib/constants';

export default function SettingsPage() {
  const { user, logout, wipeAllLocalData } = useAuth();
  const { settings, loading, updateSettings, deleteAllUserData } = useSettings();
  const { roadmaps } = useRoadmaps();
  const { stats } = useStats();

  const [savedNotice, setSavedNotice] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [dataWiped, setDataWiped] = useState(false);

  useEffect(() => {
    const existingKey = getGeminiApiKey();
    if (existingKey) {
      setApiKeyInput(existingKey);
    }
  }, []);

  const triggerSaveNotification = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    setGeminiApiKey(apiKeyInput);
    setApiKeySaved(true);
    triggerSaveNotification();
    setTimeout(() => setApiKeySaved(false), 3000);
  };

  const handlePersonaChange = async (persona) => {
    await updateSettings({ mentor_persona: persona });
    triggerSaveNotification();
  };

  const handleNotificationToggle = async () => {
    await updateSettings({ push_enabled: !settings?.push_enabled });
    triggerSaveNotification();
  };

  const handlePacingChange = async (pacing) => {
    await updateSettings({ notification_pacing: pacing });
    triggerSaveNotification();
  };

  const handleExportAllData = () => {
    const fullExport = {
      exported_at: new Date().toISOString(),
      user,
      settings,
      stats,
      roadmaps,
    };

    const blob = new Blob([JSON.stringify(fullExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `milestone-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmWipe = async (e) => {
    e.preventDefault();
    if (deleteConfirmationInput !== 'DELETE') return;

    setIsWiping(true);
    await deleteAllUserData();
    localStorage.clear();
    setIsWiping(false);
    setShowDeleteModal(false);
    setDataWiped(true);
    setTimeout(() => {
      logout();
      window.location.href = '/';
    }, 1500);
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 font-mono">Loading user preferences...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
              Settings &amp; Preferences
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure your mentor personality, optional API credentials, and manage application data.
            </p>
          </div>

          <AnimatePresence>
            {savedNotice && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {dataWiped && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            All user records wiped. Redirecting to landing page...
          </div>
        )}

        {/* 1. Google Gemini AI Engine & API Key */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121824] border border-[#242f42] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-blue-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Google Gemini Cloud Engine</h2>
                <p className="text-xs text-slate-400">
                  Milestone AI runs live on Google Gemini 2.5 &amp; 2.0 Flash via Supabase Edge. You may optionally supply a personal AI Studio key.
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-white flex items-center gap-1 font-medium shrink-0"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleSaveApiKey} className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy... (Optional override)"
              className="input-field text-xs font-mono flex-1 bg-[#0b0f17]"
            />
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-4 shrink-0 font-semibold"
            >
              {apiKeySaved ? 'Saved!' : 'Save Key'}
            </button>
          </form>
          <p className="text-[11px] font-mono text-slate-500">
            Stored locally in your client environment. Zero server storage of client personal keys.
          </p>
        </div>

        {/* 2. Mentor Persona */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121824] border border-[#242f42] space-y-3.5">
          <div className="flex items-center gap-2.5">
            <UserCircle className="w-4 h-4 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Default Mentor Persona</h2>
              <p className="text-xs text-slate-400">
                Select the default tone and pedagogical style for your 24/7 AI mentor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {MENTOR_PERSONAS.map((p) => {
              const isSelected = settings?.mentor_persona === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePersonaChange(p.value)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500 text-white'
                      : 'bg-[#0e141f] border-[#242f42] text-slate-400 hover:text-slate-200 hover:border-[#3b4c68]'
                  }`}
                >
                  <span className="text-xl p-1 bg-[#161f2e] rounded-lg border border-[#242f42]">{p.emoji}</span>
                  <div>
                    <p className="font-semibold text-xs text-white">{p.label}</p>
                    <p className="text-[10px] text-slate-500 capitalize font-mono">{p.value} mode</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Notifications */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121824] border border-[#242f42] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-blue-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Milestone Push Notifications</h2>
                <p className="text-xs text-slate-400">
                  Receive browser notifications when upcoming milestone deliverables are scheduled.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNotificationToggle}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors relative ${
                settings?.push_enabled ? 'bg-blue-600' : 'bg-[#1e293b]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings?.push_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings?.push_enabled && (
            <div className="pt-3 border-t border-[#1e293b] space-y-2">
              <label className="text-xs font-semibold text-slate-300 font-mono">
                Notification Frequency
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PACING_OPTIONS.slice(0, 3).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePacingChange(opt.value)}
                    className={`p-2.5 rounded-lg border text-xs text-left transition-colors ${
                      settings?.notification_pacing === opt.value
                        ? 'bg-blue-600/10 border-blue-500 text-white font-medium'
                        : 'bg-[#0e141f] border-[#242f42] text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Data Portability & Danger Zone */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121824] border border-[#242f42] space-y-3.5">
          <div>
            <h2 className="text-sm font-bold text-white">Data Portability &amp; Storage</h2>
            <p className="text-xs text-slate-400">
              Own your learning blueprints. Export your roadmaps and XP history, or purge local session cache.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleExportAllData}
              className="btn-secondary w-full sm:w-auto text-xs py-2 px-3.5 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export All Data (JSON)
            </button>
            <button
              type="button"
              onClick={wipeAllLocalData}
              className="btn-secondary w-full sm:w-auto text-xs py-2 px-3.5 flex items-center justify-center gap-1.5"
              title="Clears all local auth tokens and cached blueprints"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              Reset Local Session Cache
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationInput('');
                setShowDeleteModal(true);
              }}
              className="w-full sm:w-auto text-xs py-2 px-3.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 flex items-center justify-center gap-1.5 transition-colors font-medium ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Delete All Account Data
            </button>
          </div>
        </div>

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete All Account Data"
        >
          <form onSubmit={handleConfirmWipe} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">Irreversible Action</p>
                <p className="mt-0.5 text-slate-300">
                  All created blueprints, completed deliverable checkmarks, XP stats, and conversation turns will be permanently deleted.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Type <strong className="text-rose-400 font-mono">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="input-field text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleteConfirmationInput !== 'DELETE' || isWiping}
                className="text-xs py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold disabled:opacity-40 transition-colors"
              >
                {isWiping ? 'Wiping...' : 'Permanently Delete'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
