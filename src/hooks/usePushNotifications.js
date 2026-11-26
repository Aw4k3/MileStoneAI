// src/hooks/usePushNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  VAPID_PUBLIC_KEY,
  urlBase64ToUint8Array,
  getActiveServiceWorkerRegistration,
  isStandaloneMode,
  detectPlatformInfo,
} from '../lib/pushConfig';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusError, setStatusError] = useState('');

  const platform = detectPlatformInfo();
  const isStandalone = isStandaloneMode();
  const hasPushApi =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const requiresIosInstall = platform.isIos && !isStandalone;
  const isSupported = hasPushApi && !requiresIosInstall;

  const syncSubscriptionRecord = useCallback(
    async (subscription) => {
      if (!user || !isSupabaseConfigured || !subscription) return;
      const json = subscription.toJSON();
      const p256dh = json?.keys?.p256dh || '';
      const auth = json?.keys?.auth || '';
      if (!subscription.endpoint || !p256dh || !auth) return;

      await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          user_agent: (navigator.userAgent || '').slice(0, 250),
          platform: platform.isIos ? 'ios' : platform.isAndroid ? 'android' : 'web',
          is_standalone: isStandalone,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );
    },
    [user, platform.isIos, platform.isAndroid, isStandalone]
  );

  // Inspect existing subscription cleanly without requesting permission
  const refreshStatus = useCallback(async () => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }

    if (!hasPushApi) {
      setIsSubscribed(false);
      return;
    }

    try {
      const reg = await getActiveServiceWorkerRegistration();
      if (!reg) {
        setIsSubscribed(false);
        return;
      }

      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(Boolean(sub));

      if (sub && user && Notification.permission === 'granted') {
        syncSubscriptionRecord(sub).catch(() => {});
      }
    } catch {
      setIsSubscribed(false);
    }
  }, [hasPushApi, user, syncSubscriptionRecord]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Listen for SW subscription rotation broadcasts
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleSwMessage = async (event) => {
      if (event.data?.type === 'MILESTONE_PUSH_SUBSCRIPTION_CHANGED') {
        const reg = await getActiveServiceWorkerRegistration();
        const sub = await reg?.pushManager?.getSubscription();
        if (sub) await syncSubscriptionRecord(sub);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }, [syncSubscriptionRecord]);

  const subscribe = useCallback(async () => {
    setStatusError('');

    if (requiresIosInstall) {
      const msg =
        'On iPhone and iPad, install Milestone AI to your Home Screen first (Share -> Add to Home Screen), then open the app to enable push notifications.';
      setStatusError(msg);
      return { ok: false, reason: 'ios_install_required', message: msg };
    }

    if (!hasPushApi) {
      const msg = 'This browser does not support Web Push notifications.';
      setStatusError(msg);
      return { ok: false, reason: 'unsupported', message: msg };
    }

    if (!user) {
      const msg = 'Sign in to enable personalized milestone notifications.';
      setStatusError(msg);
      return { ok: false, reason: 'unauthenticated', message: msg };
    }

    setBusy(true);
    try {
      let currentPerm = Notification.permission;
      if (currentPerm === 'default') {
        currentPerm = await Notification.requestPermission();
      }
      setPermission(currentPerm);

      if (currentPerm !== 'granted') {
        const msg =
          currentPerm === 'denied'
            ? 'Notification permission is blocked in your browser settings. Allow notifications for this site to re-enable.'
            : 'Notification permission request was dismissed.';
        setStatusError(msg);
        return { ok: false, reason: currentPerm, message: msg };
      }

      const reg = await getActiveServiceWorkerRegistration();
      if (!reg) {
        const msg =
          'Service Worker is not active in development mode. Push registration succeeds automatically on the production build or vite preview.';
        setStatusError(msg);
        return { ok: false, reason: 'no_sw', message: msg };
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      await syncSubscriptionRecord(sub);
      setIsSubscribed(true);
      return { ok: true, subscription: sub };
    } catch (err) {
      const msg = err?.message || 'Unable to register push subscription on this browser.';
      setStatusError(msg);
      return { ok: false, reason: 'error', message: msg };
    } finally {
      setBusy(false);
    }
  }, [requiresIosInstall, hasPushApi, user, syncSubscriptionRecord]);

  const unsubscribe = useCallback(async () => {
    setStatusError('');
    setBusy(true);
    try {
      if (hasPushApi) {
        const reg = await getActiveServiceWorkerRegistration();
        const sub = await reg?.pushManager?.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe().catch(() => {});
          if (user && isSupabaseConfigured && endpoint) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', user.id)
              .eq('endpoint', endpoint);
          }
        }
      }
      setIsSubscribed(false);
      return { ok: true };
    } catch (err) {
      setStatusError(err?.message || 'Unable to remove push subscription.');
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }, [hasPushApi, user]);

  const sendTestPush = useCallback(async () => {
    setStatusError('');
    if (!user || !isSupabaseConfigured) {
      return { ok: false, error: 'Sign in required.' };
    }

    setBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error('Active session required to send a test alert.');
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          action: 'test',
          title: 'Milestone AI alerts are active',
          body: 'Push notifications are configured for milestone completions, streaks, and badges.',
          targetUrl: '/dashboard',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw error;
      if (data?.delivered === 0) {
        throw new Error('No registered device subscription found yet for this browser.');
      }
      return { ok: true, data };
    } catch (err) {
      const msg = err?.message || 'Could not deliver test notification.';
      setStatusError(msg);
      return { ok: false, error: msg };
    } finally {
      setBusy(false);
    }
  }, [user]);

  return {
    isSupported,
    requiresIosInstall,
    permission,
    isSubscribed,
    busy,
    statusError,
    subscribe,
    unsubscribe,
    sendTestPush,
    refreshStatus,
  };
}
