// src/pages/SettingsPage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Bell,
  UserCircle,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Palette,
  Sun,
  Moon,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../hooks/useSettings';
import { useRoadmaps } from '../hooks/useRoadmaps';
import { useStats } from '../hooks/useStats';
import {
  MENTOR_PERSONAS,
  PACING_OPTIONS,
} from '../lib/constants';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings, loading, updateSettings, deleteAllUserData } = useSettings();
  const { roadmaps } = useRoadmaps();
  const { stats } = useStats();

  const [savedNotice, setSavedNotice] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [dataWiped, setDataWiped] = useState(false);

  const triggerSaveNotification = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
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
          <p className="text-xs text-slate-400 font-mono">Loading user preferences…</p>
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
              <SettingsIcon className="w-5 h-5 text-blue-400" aria-hidden="true" />
              Settings &amp; Preferences
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Configure your visual theme, mentor personality, notifications, and manage application data.
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
                <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {dataWiped && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs" role="alert" aria-live="polite">
            All user records wiped. Redirecting to landing page…
          </div>
        )}

        {/* 1. Interface Theme Customization */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121824] border border-[#242f42] space-y-3.5">
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-white">Interface Theme</h2>
              <p className="text-xs text-slate-400">
                Customize your appearance preference. The selected theme persists across all pages and sessions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Interface Theme">
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'dark'}
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${
                theme === 'dark'
                  ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/40 shadow-xs'
                  : 'bg-[#0e141f] border-[#242f42] text-slate-400 hover:text-slate-200 hover:border-[#3b4c68]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#161f2e] border border-[#242f42] text-blue-400">
                  <Moon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">Dark Mode</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Deep slate palette with low glare, designed for focus and extended study sessions.
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === 'dark'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-slate-600 bg-[#121824]'
                }`}
              >
                {theme === 'dark' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={theme === 'light'}
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${
                theme === 'light'
                  ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/40 shadow-xs'
                  : 'bg-[#0e141f] border-[#242f42] text-slate-400 hover:text-slate-200 hover:border-[#3b4c68]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#161f2e] border border-[#242f42] text-amber-400">
                  <Sun className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">Light Mode</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Clean, crisp high-contrast surfaces designed for readability in bright environments.
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === 'light'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-slate-600 bg-[#121824]'
                }`}
              >
                {theme === 'light' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          </div>
        </div>

        {/* 2. Mentor Persona */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121824] border border-[#242f42] space-y-3.5">
          <div className="flex items-center gap-2.5">
            <UserCircle className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-white">Default Mentor Persona</h2>
              <p className="text-xs text-slate-400">
                Select the default tone and pedagogical style for your 24/7 AI mentor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Default Mentor Persona">
            {MENTOR_PERSONAS.map((p) => {
              const isSelected = settings?.mentor_persona === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handlePersonaChange(p.value)}
                  className={`p-3.5 rounded-xl border text-left transition-colors flex items-center gap-3 ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500 text-white shadow-xs'
                      : 'bg-[#0e141f] border-[#242f42] text-slate-400 hover:text-slate-200 hover:border-[#3b4c68]'
                  }`}
                >
                  <span className="text-xl p-1 bg-[#161f2e] rounded-lg border border-[#242f42]" aria-hidden="true">{p.emoji}</span>
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
              <Bell className="w-4 h-4 text-blue-400" aria-hidden="true" />
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
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings?.push_enabled ? 'bg-blue-600' : 'bg-[#1a2332] border border-[#242f42]'
              }`}
              aria-label="Toggle push notifications"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings?.push_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings?.push_enabled && (
            <div className="pt-2 border-t border-[#1e293b] space-y-2">
              <label className="text-xs font-mono uppercase text-slate-400">Notification Pacing Cadence</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PACING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePacingChange(opt.value)}
                    className={`py-2 px-3 rounded-lg border text-xs capitalize transition-colors ${
                      settings?.notification_pacing === opt.value
                        ? 'bg-blue-600/10 border-blue-500 text-white font-semibold'
                        : 'bg-[#0e141f] border-[#242f42] text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Data Export & Portability */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121824] border border-[#242f42] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-bold text-white">Complete Data Portability</h2>
                <p className="text-xs text-slate-400">
                  Export complete application state, user progress, roadmaps, and chat transcripts to JSON.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportAllData}
              className="btn-secondary text-xs py-2 px-3.5 inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Export JSON Backup
            </button>
          </div>
        </div>

        {/* 5. Danger Zone */}
        <div className="p-5 sm:p-6 rounded-2xl bg-rose-950/10 border border-rose-500/20 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-rose-400" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-bold text-rose-300">Wipe All Account Data</h2>
                <p className="text-xs text-slate-400">
                  Permanently erase all generated blueprints, milestone logs, chat conversations, and earned XP.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Erase Data
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Data Destruction"
      >
        <form onSubmit={handleConfirmWipe} className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span>This action cannot be undone. All milestones, chat histories, and progress will be erased permanently.</span>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-delete-input" className="text-xs text-slate-300 block">
              Type <strong className="text-rose-400 font-mono">DELETE</strong> to authorize data wipe:
            </label>
            <input
              id="confirm-delete-input"
              name="confirmDelete"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="DELETE"
              className="input-field text-xs font-mono bg-[#0b0f17]"
              autoFocus
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
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors"
            >
              {isWiping ? 'Erasing…' : 'Confirm Erase'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
