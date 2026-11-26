// src/components/common/InstallAppBanner.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';
import { usePWA } from '../../contexts/PWAContext';
import Modal from './Modal';

export default function InstallAppBanner() {
  const location = useLocation();
  const {
    shouldOfferMobileInstall,
    canUseNativePrompt,
    platform,
    showInstructionsModal,
    closeInstructionsModal,
    promptInstall,
    dismissBanner,
  } = usePWA();

  // Hide install banner on auth/reset-password screens to keep credential forms focused
  const isAuthRoute =
    location.pathname.startsWith('/auth') || location.pathname.startsWith('/reset-password');
  const hasBottomMobileNav =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/wizard') ||
    location.pathname.startsWith('/roadmap') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/docs');

  const showPromptCard = shouldOfferMobileInstall && !isAuthRoute;

  return (
    <>
      <AnimatePresence>
        {showPromptCard && (
          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Install Milestone AI app"
            className={`fixed left-3 right-3 sm:left-auto sm:right-5 sm:w-[360px] z-40 rounded-2xl bg-[#11141c]/95 backdrop-blur-md border border-white/[0.12] p-4 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.65)] ${
              hasBottomMobileNav ? 'bottom-20 md:bottom-5' : 'bottom-4 sm:bottom-5'
            }`}
          >
            <div className="flex items-start gap-3">
              <img
                src="/icons/pwa-192x192.png"
                alt=""
                width="40"
                height="40"
                className="w-10 h-10 rounded-xl border border-white/[0.1] shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs sm:text-[13px] font-medium text-[#eef0f5] leading-snug">
                    Install Milestone AI
                  </p>
                  <button
                    type="button"
                    onClick={() => dismissBanner(false)}
                    className="w-6 h-6 -mt-0.5 -mr-1 rounded-md flex items-center justify-center text-[#7a8296] hover:text-[#eef0f5] hover:bg-[#1a1e28] transition-colors shrink-0"
                    aria-label="Dismiss install app prompt"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>

                <p className="text-[11px] sm:text-xs text-[#7a8296] mt-0.5 leading-relaxed">
                  Add to your home screen for distraction-free study sessions and milestone alerts.
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={promptInstall}
                    className="btn-primary h-8 px-3 text-xs flex-1 sm:flex-none"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                    <span>{canUseNativePrompt ? 'Install app' : 'Add to home screen'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissBanner(true)}
                    className="btn-secondary h-8 px-2.5 text-[11px] text-[#7a8296]"
                  >
                    Don’t ask again
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Graceful Manual Install Instructions Modal (iOS Safari & Browsers without native prompt) */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={closeInstructionsModal}
        title="Install Milestone AI on your device"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#a3a9b8] leading-relaxed">
            {platform.isInAppBrowser
              ? 'In-app browsers block home screen installation. Open this page in Safari (iOS) or Chrome (Android) first, then follow the steps below.'
              : platform.isIos
              ? 'Follow these quick steps in Safari to install Milestone AI as a standalone home screen app (also required on iOS for push notifications):'
              : 'Use your browser menu to add Milestone AI directly to your home screen or desktop:'}
          </p>

          {platform.isIos ? (
            <ol className="space-y-2.5 text-xs">
              <li className="flex items-start gap-3 p-3 rounded-lg bg-[#0b0d14] border border-white/[0.08]">
                <div className="w-7 h-7 rounded-md bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center text-blue-400 shrink-0">
                  <Share className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-[#eef0f5]">1. Tap the Share button</p>
                  <p className="text-[#7a8296] mt-0.5">
                    Look for the Share icon in your Safari toolbar at the bottom or top of the screen.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-lg bg-[#0b0d14] border border-white/[0.08]">
                <div className="w-7 h-7 rounded-md bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center text-blue-400 shrink-0">
                  <PlusSquare className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-[#eef0f5]">2. Choose “Add to Home Screen”</p>
                  <p className="text-[#7a8296] mt-0.5">
                    Scroll the share sheet options, tap Add to Home Screen, then confirm by tapping Add.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-lg bg-[#0b0d14] border border-white/[0.08]">
                <div className="w-7 h-7 rounded-md bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center text-[#4cc38a] shrink-0">
                  <Smartphone className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-[#eef0f5]">3. Launch from your Home Screen</p>
                  <p className="text-[#7a8296] mt-0.5">
                    Milestone AI opens as a full-screen app without browser toolbars.
                  </p>
                </div>
              </li>
            </ol>
          ) : (
            <div className="p-3.5 rounded-lg bg-[#0b0d14] border border-white/[0.08] text-xs text-[#a3a9b8] space-y-2">
              <p className="font-medium text-[#eef0f5]">In Chrome, Edge, or Samsung Internet:</p>
              <p>
                Open the browser menu (three dots) in the top corner and select{' '}
                <strong className="text-[#eef0f5]">Install app</strong> or{' '}
                <strong className="text-[#eef0f5]">Add to Home screen</strong>.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                dismissBanner(true);
                closeInstructionsModal();
              }}
              className="text-xs text-[#7a8296] hover:text-[#a3a9b8] transition-colors"
            >
              Don’t ask again
            </button>
            <button
              type="button"
              onClick={closeInstructionsModal}
              className="btn-primary text-xs h-9 px-4"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
