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
  GraduationCap,
  Target,
  Users,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../hooks/useSettings';
import { useRoadmaps } from '../hooks/useRoadmaps';
import { useStats } from '../hooks/useStats';
import { MENTOR_PERSONAS, PACING_OPTIONS } from '../lib/constants';

const PERSONA_ICONS = {
  tutor: GraduationCap,
  coach: Target,
  peer: Users,
};

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
          <p className="text-xs text-[#7a8296] font-mono">Loading user preferences…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl font-medium text-[#eef0f5] flex items-center gap-2.5 tracking-tight">
              <SettingsIcon className="w-5 h-5 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-[#7a8296] mt-1">
              Visual theme, default mentor tone, notifications, and account data
            </p>
          </div>

          <AnimatePresence>
            {savedNotice && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-[#4cc38a] text-xs font-mono flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {dataWiped && (
          <div
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs"
            role="alert"
            aria-live="polite"
          >
            All user records wiped. Redirecting to landing page…
          </div>
        )}

        {/* 1. Interface Theme */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#11141c] border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="w-4 h-4 text-[#7a8296] shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-medium text-[#eef0f5]">Interface theme</h2>
              <p className="text-xs text-[#7a8296]">
                Selected theme applies across all sessions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Interface Theme">
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'dark'}
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-lg border text-left transition-colors flex items-start justify-between gap-3 ${
                theme === 'dark'
                  ? 'active-step-surface text-[#eef0f5]'
                  : 'bg-[#0b0d14] border-white/[0.08] text-[#7a8296] hover:text-[#eef0f5] hover:border-white/[0.18]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center text-blue-400 shrink-0">
                  <Moon className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-xs text-[#eef0f5]">Dark mode</p>
                  <p className="text-xs text-[#7a8296] mt-0.5 leading-relaxed">
                    Low-glare ink surfaces for extended reading and study sessions.
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === 'dark'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-white/[0.2] bg-[#11141c]'
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
              className={`p-4 rounded-lg border text-left transition-colors flex items-start justify-between gap-3 ${
                theme === 'light'
                  ? 'active-step-surface text-[#eef0f5]'
                  : 'bg-[#0b0d14] border-white/[0.08] text-[#7a8296] hover:text-[#eef0f5] hover:border-white/[0.18]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center text-amber-400 shrink-0">
                  <Sun className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-xs text-[#eef0f5]">Light mode</p>
                  <p className="text-xs text-[#7a8296] mt-0.5 leading-relaxed">
                    High-contrast daylight paper surfaces for bright environments.
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  theme === 'light'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-white/[0.2] bg-[#11141c]'
                }`}
              >
                {theme === 'light' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          </div>
        </div>

        {/* 2. Default Mentor Persona */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#11141c] border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-3">
            <UserCircle className="w-4 h-4 text-[#7a8296] shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-medium text-[#eef0f5]">Default mentor persona</h2>
              <p className="text-xs text-[#7a8296]">
                Default feedback style inside blueprint mentor chats
              </p>
            </div>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            role="radiogroup"
            aria-label="Default Mentor Persona"
          >
            {MENTOR_PERSONAS.map((p) => {
              const isSelected = settings?.mentor_persona === p.value;
              const Icon = PERSONA_ICONS[p.value] || UserCircle;
              return (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handlePersonaChange(p.value)}
                  className={`p-3.5 rounded-lg border text-left transition-colors flex items-center gap-3 ${
                    isSelected
                      ? 'active-step-surface text-[#eef0f5]'
                      : 'bg-[#0b0d14] border-white/[0.08] text-[#7a8296] hover:text-[#eef0f5] hover:border-white/[0.18]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center text-[#a3a9b8] shrink-0">
                    <Icon className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-[#eef0f5] truncate">{p.label}</p>
                    <p className="text-[11px] text-[#7a8296] font-mono truncate">{p.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Notifications */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#11141c] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#7a8296] shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h2 className="text-sm font-medium text-[#eef0f5]">Milestone reminders</h2>
                <p className="text-xs text-[#7a8296]">
                  Browser notifications when scheduled milestone deliverables arrive
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleNotificationToggle}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                settings?.push_enabled ? 'bg-blue-500' : 'bg-[#1a1e28] border border-white/[0.12]'
              }`}
              aria-label="Toggle push notifications"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                  settings?.push_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {settings?.push_enabled && (
            <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
              <label className="text-xs font-mono text-[#7a8296] block">
                Notification cadence
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PACING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePacingChange(opt.value)}
                    className={`h-9 px-3 rounded-lg border text-xs transition-colors ${
                      settings?.notification_pacing === opt.value
                        ? 'active-step-surface text-[#eef0f5] font-medium'
                        : 'bg-[#0b0d14] border-white/[0.08] text-[#7a8296] hover:text-[#eef0f5]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Data Export */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#11141c] border border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-[#7a8296] shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h2 className="text-sm font-medium text-[#eef0f5]">Data portability</h2>
                <p className="text-xs text-[#7a8296]">
                  Download blueprints, milestones, progress metrics, and settings as JSON
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportAllData}
              className="btn-secondary text-xs h-9 px-3.5 shrink-0 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
              Export JSON backup
            </button>
          </div>
        </div>

        {/* 5. Danger Zone */}
        <div className="p-5 sm:p-6 rounded-xl bg-rose-950/10 border border-rose-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-[#e5484d] shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h2 className="text-sm font-medium text-rose-200">Erase all account data</h2>
                <p className="text-xs text-[#7a8296]">
                  Permanently remove all blueprints, milestones, mentor logs, and earned XP
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors shrink-0 self-start sm:self-auto"
            >
              Erase data
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm data destruction"
      >
        <form onSubmit={handleConfirmWipe} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#e5484d] mt-0.5" strokeWidth={1.5} aria-hidden="true" />
            <span>
              This action cannot be undone. All milestones, chat histories, and progress will be
              erased permanently.
            </span>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-delete-input" className="text-xs text-[#a3a9b8] block">
              Type <strong className="text-[#e5484d] font-mono">DELETE</strong> to authorize data wipe
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
              className="input-field text-xs font-mono h-10"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary text-xs h-9 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleteConfirmationInput !== 'DELETE' || isWiping}
              className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-medium text-xs transition-colors"
            >
              {isWiping ? 'Erasing…' : 'Confirm erase'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
