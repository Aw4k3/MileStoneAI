// src/components/common/NotificationOptInBanner.jsx
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useSettings } from '../../hooks/useSettings';
import Spinner from './Spinner';

const PROMPT_DISMISSED_KEY = 'milestone_push_prompt_dismissed';

export function wasPushPromptDismissed() {
  try {
    return localStorage.getItem(PROMPT_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function NotificationOptInBanner({ visible, onDismiss }) {
  const { isSupported, requiresIosInstall, permission, isSubscribed, busy, statusError, subscribe } =
    usePushNotifications();
  const { updateSettings } = useSettings();
  const [feedback, setFeedback] = useState('');

  if (!visible || isSubscribed || permission === 'denied' || (!isSupported && !requiresIosInstall)) {
    return null;
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
    } catch {
      // non-fatal
    }
    onDismiss?.();
  };

  const handleEnable = async () => {
    const res = await subscribe();
    if (res.ok) {
      await updateSettings({ push_enabled: true });
      setFeedback('Milestone push notifications enabled on this device.');
      window.setTimeout(() => onDismiss?.(), 1800);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="p-4 rounded-xl bg-[#11141c] border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        role="region"
        aria-label="Enable milestone notifications"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <Bell className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-medium text-[#eef0f5]">
              Nice work! Want milestone & streak alerts?
            </p>
            <p className="text-xs text-[#7a8296] leading-relaxed">
              {feedback
                ? feedback
                : statusError
                ? statusError
                : requiresIosInstall
                ? 'Install Milestone AI to your Home Screen via Safari Share -> Add to Home Screen to receive push alerts.'
                : 'Receive quiet notifications when you finish checkpoints, unlock badges, or complete a blueprint.'}
            </p>
          </div>
        </div>

        {!feedback && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {!requiresIosInstall && (
              <button
                type="button"
                onClick={handleEnable}
                disabled={busy}
                className="btn-primary text-xs h-8 px-3.5"
              >
                {busy ? <Spinner size="sm" /> : 'Enable alerts'}
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="btn-secondary text-xs h-8 px-2.5 text-[#7a8296]"
              aria-label="Dismiss notification prompt"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
