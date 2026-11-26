// src/contexts/PWAContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { detectPlatformInfo, isStandaloneMode } from '../lib/pushConfig';

const DISMISS_UNTIL_KEY = 'milestone_pwa_install_dismissed_until';
const NEVER_ASK_KEY = 'milestone_pwa_install_never';
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

const PWAContext = createContext(null);

function isBannerSuppressed() {
  try {
    if (localStorage.getItem(NEVER_ASK_KEY) === 'true') return true;
    const until = Number(localStorage.getItem(DISMISS_UNTIL_KEY) || '0');
    return until > Date.now();
  } catch {
    return false;
  }
}

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(() => isStandaloneMode());
  const [platform, setPlatform] = useState(() => detectPlatformInfo());
  const [suppressed, setSuppressed] = useState(() => isBannerSuppressed());
  const [hasEngaged, setHasEngaged] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Sync platform & standalone display-mode changes
  useEffect(() => {
    const updateEnv = () => {
      setIsStandalone(isStandaloneMode());
      setPlatform(detectPlatformInfo());
    };

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', updateEnv);
    }
    window.addEventListener('resize', updateEnv, { passive: true });

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setSuppressed(true);
      try {
        localStorage.setItem(NEVER_ASK_KEY, 'true');
      } catch {
        // non-fatal
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', updateEnv);
      }
      window.removeEventListener('resize', updateEnv);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Wait for light user engagement before showing optional install banner
  useEffect(() => {
    if (isStandalone || suppressed) return undefined;

    const timer = window.setTimeout(() => setHasEngaged(true), 4500);
    const onScroll = () => {
      if (window.scrollY > 200) {
        setHasEngaged(true);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [isStandalone, suppressed]);

  const dismissBanner = useCallback((permanent = false) => {
    setSuppressed(true);
    try {
      if (permanent) {
        localStorage.setItem(NEVER_ASK_KEY, 'true');
      } else {
        localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + COOLDOWN_MS));
      }
    } catch {
      // non-fatal
    }
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (choice?.outcome === 'accepted') {
          dismissBanner(true);
          return { status: 'accepted' };
        }
        dismissBanner(false);
        return { status: 'dismissed' };
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    setShowInstructionsModal(true);
    return { status: 'manual_guide' };
  }, [deferredPrompt, dismissBanner]);

  const canUseNativePrompt = Boolean(deferredPrompt) && !isStandalone;
  const shouldOfferMobileInstall =
    !isStandalone &&
    !suppressed &&
    hasEngaged &&
    platform.isMobileOrTablet &&
    (canUseNativePrompt || platform.isIos);

  const value = {
    isStandalone,
    platform,
    canUseNativePrompt,
    canInstallOnDemand: !isStandalone && (canUseNativePrompt || platform.isMobileOrTablet),
    shouldOfferMobileInstall,
    showInstructionsModal,
    openInstructionsModal: () => setShowInstructionsModal(true),
    closeInstructionsModal: () => setShowInstructionsModal(false),
    promptInstall,
    dismissBanner,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA() {
  const ctx = useContext(PWAContext);
  if (!ctx) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return ctx;
}
