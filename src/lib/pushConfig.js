// src/lib/pushConfig.js
import { Workbox } from 'workbox-window';

// Public VAPID ECDSA P-256 key (safe for frontend exposure; private key lives strictly in Supabase secrets)
export const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BNPru_aws8pZxEpeKlKTt-yBPp718bfhkD3XlU7AWIPqN0kdVzwldiEDJm1w9VVRyq4xyXsiXI7JzFFi96Kk3_A';

let swRegistrationPromise = null;

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function registerPwaServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  // Only register production SW build so Vite HMR dev server stays interference-free
  if (!import.meta.env.PROD) {
    return null;
  }

  if (!swRegistrationPromise) {
    const wb = new Workbox('/sw.js', { scope: '/' });

    wb.addEventListener('waiting', () => {
      wb.messageSkipWaiting();
    });

    swRegistrationPromise = wb.register().catch((err) => {
      console.warn('Service Worker registration notice:', err);
      return null;
    });
  }

  return swRegistrationPromise;
}

export async function getActiveServiceWorkerRegistration() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (swRegistrationPromise) {
    const reg = await swRegistrationPromise;
    if (reg) return reg;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) return existing;
    if (import.meta.env.PROD) {
      return await navigator.serviceWorker.ready;
    }
  } catch (err) {
    console.warn('SW readiness check notice:', err);
  }

  return null;
}

export function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator?.standalone === true
  );
}

export function detectPlatformInfo() {
  if (typeof navigator === 'undefined') {
    return { isIos: false, isSafari: false, isMobileOrTablet: false, isInAppBrowser: false };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  const isIos =
    /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isSafari =
    isIos && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua);
  const isInAppBrowser = /FBAN|FBAV|Instagram|Line|MicroMessenger|wv\b/i.test(ua);
  const isCoarsePointer =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
  const isSmallOrTabletViewport =
    typeof window !== 'undefined' && window.innerWidth < 1024;

  return {
    isIos,
    isAndroid,
    isSafari,
    isInAppBrowser,
    isMobileOrTablet: isIos || isAndroid || isCoarsePointer || isSmallOrTabletViewport,
  };
}
