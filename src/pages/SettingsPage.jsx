// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Cpu,
  Bell,
  UserCircle,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Zap,
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
  GEMINI_MODELS,
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

  // Danger Zone Modal
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

  const handleModelChange = async (model) => {
    await updateSettings({ default_model: model });
    triggerSaveNotification();
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

  // Export all application data as structured JSON
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

  // Confirm Full App Data Wipe
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
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400">Loading user preferences...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-indigo-400" />
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Configure your Google Gemini AI key, mentor personality, and export local data.
            </p>
          </div>

          {/* Saved feedback pill */}
          <AnimatePresence>
            {savedNotice && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Settings Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {dataWiped && (
          <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-medium">
            All user data wiped successfully. Redirecting to landing page...
          </div>
        )}

        {/* 0. Google Gemini API Key (Direct Free Tier Integration) */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-slate-100">Google Gemini AI Engine</h2>
                <p className="text-xs text-slate-400">
                  Milestone AI is connected to Google Gemini AI via Supabase Cloud. You may optionally provide a personal Google AI Studio key below to override default quotas.
                </p>
              </div>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleSaveApiKey} className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="input-field text-xs sm:text-sm font-mono flex-1"
            />
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-4 shrink-0 flex items-center gap-1.5"
            >
              {apiKeySaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              {apiKeySaved ? 'Saved!' : 'Save Key'}
            </button>
          </form>
          <p className="text-[11px] text-slate-400">
            Stored securely in your local environment. You can also configure <code className="text-slate-300">VITE_GEMINI_API_KEY</code> in <code className="text-slate-300">.env.local</code>.
          </p>
        </div>

        {/* 1. Dual Gemini Model Engine */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Default Gemini AI Engine</h2>
              <p className="text-xs text-slate-400">
                Choose between speed (Flash) and deep reasoning (Pro) across blueprints and mentor sessions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GEMINI_MODELS.map((model) => {
              const isSelected = settings?.default_model === model.value;
              return (
                <button
                  key={model.value}
                  type="button"
                  onClick={() => handleModelChange(model.value)}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-100 shadow-sm'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      model.value === 'flash'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                      {model.label}
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                          Active
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{model.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Default Mentor Persona */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <UserCircle className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Default Mentor Persona</h2>
              <p className="text-xs text-slate-400">
                Determines how the guardrailed AI answers inquiries and encourages your progress.
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
                      ? 'bg-indigo-500/10 border-indigo-500 text-slate-100'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl p-1 bg-slate-900 rounded-lg">{p.emoji}</span>
                  <div>
                    <p className="font-semibold text-xs text-slate-200">{p.label}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{p.value} mode</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Notifications & Milestone Alerts */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-slate-100">Milestone Push Notifications</h2>
                <p className="text-xs text-slate-400">
                  Receive browser reminders when deliverables are approaching due dates.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleNotificationToggle}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors relative ${
                settings?.push_enabled ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                  settings?.push_enabled ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings?.push_enabled && (
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <label className="text-xs font-semibold text-slate-300">
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
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Data Management & Export */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">Data Portability & Management</h2>
            <p className="text-xs text-slate-400">
              Own your learning data. Export your roadmaps, XP history, and chat messages.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleExportAllData}
              className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-4 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-400" />
              Export All Data (JSON)
            </button>
            <button
              type="button"
              onClick={wipeAllLocalData}
              className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-4 flex items-center justify-center gap-2 hover:border-slate-600"
              title="Clears all local auth tokens and cached blueprints"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              Reset Local Session Cache
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationInput('');
                setShowDeleteModal(true);
              }}
              className="w-full sm:w-auto text-xs py-2.5 px-4 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              Delete All App Data
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Danger Zone: Wipe All Data"
        >
          <form onSubmit={handleConfirmWipe} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">This action is irreversible.</p>
                <p className="mt-0.5">
                  All blueprints, completed milestone checkmarks, XP records, and AI chat logs
                  will be wiped from client state and database.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Type <strong className="text-rose-400">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="input-field text-xs"
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
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                {isWiping && <Spinner size="sm" />}
                Permanently Wipe Data
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
