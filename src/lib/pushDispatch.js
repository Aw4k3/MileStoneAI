// src/lib/pushDispatch.js
import { supabase, isSupabaseConfigured } from './supabase';

function getLocalNotifiedKey(userId) {
  return `milestone_ai_${userId}_notified_events`;
}

function hasDispatchedLocally(userId, eventKey) {
  try {
    const raw = localStorage.getItem(getLocalNotifiedKey(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) && list.includes(eventKey);
  } catch {
    return false;
  }
}

function markDispatchedLocally(userId, eventKey) {
  try {
    const key = getLocalNotifiedKey(userId);
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? [...new Set([...list, eventKey])].slice(-200) : [eventKey];
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Non-fatal
  }
}

/**
 * Dispatches a milestone-based push notification to Supabase Edge Function.
 * Deduplicated both locally and via UNIQUE (user_id, event_key) in PostgreSQL.
 */
export async function dispatchMilestonePush({
  userId,
  eventKey,
  eventType,
  title,
  body,
  targetUrl = '/dashboard',
  payload = {},
}) {
  if (!isSupabaseConfigured || !userId || !eventKey) {
    return { ok: false, skipped: true };
  }

  if (hasDispatchedLocally(userId, eventKey)) {
    return { ok: true, duplicate: true, delivered: 0 };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return { ok: false, skipped: true, reason: 'no_session' };
    }

    markDispatchedLocally(userId, eventKey);

    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        action: 'dispatch',
        eventKey,
        eventType,
        title,
        body,
        targetUrl,
        payload,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (error) {
      console.warn('Push dispatch notice:', error.message);
      return { ok: false, error: error.message };
    }

    return data || { ok: true };
  } catch (err) {
    console.warn('Push dispatch failed silently:', err?.message);
    return { ok: false, error: err?.message };
  }
}
