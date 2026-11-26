// supabase/functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:support@milestonegen.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeInternalUrl(url: unknown): string {
  if (typeof url !== "string") return "/dashboard";
  const trimmed = url.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/dashboard";
  return trimmed.slice(0, 200);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return jsonResponse({ error: "Push notification service is not fully configured." }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData?.user) {
      return jsonResponse({ error: "Invalid or expired user token" }, 401);
    }

    const userId = userData.user.id;
    const body = await req.json();

    const action = body?.action === "test" ? "test" : "dispatch";
    const eventType = String(body?.eventType || (action === "test" ? "test" : "milestone_completed")).slice(0, 64);
    const eventKey =
      action === "test"
        ? `test:${Date.now()}`
        : String(body?.eventKey || "").trim().slice(0, 200);

    if (!eventKey) {
      return jsonResponse({ error: "eventKey is required" }, 400);
    }

    const title = String(body?.title || "Milestone AI").trim().slice(0, 100);
    const messageBody = String(
      body?.body || "You reached a new milestone on your learning blueprint."
    )
      .trim()
      .slice(0, 240);
    const targetUrl = sanitizeInternalUrl(body?.targetUrl);
    const payloadMeta =
      body?.payload && typeof body.payload === "object" ? body.payload : {};

    // Check user opt-in & category settings
    const { data: userSettings } = await supabaseAdmin
      .from("user_settings")
      .select("push_enabled, notification_preferences")
      .eq("user_id", userId)
      .maybeSingle();

    if (action !== "test") {
      if (!userSettings?.push_enabled) {
        return jsonResponse({ ok: true, skipped: true, reason: "push_disabled", delivered: 0 });
      }
      const prefs = userSettings.notification_preferences || {};
      if (prefs[eventType] === false) {
        return jsonResponse({ ok: true, skipped: true, reason: "category_disabled", delivered: 0 });
      }
    }

    // Deduplicate event atomically using UNIQUE (user_id, event_key)
    let eventId: string | null = null;
    if (action !== "test") {
      const { data: insertedEvent, error: insertError } = await supabaseAdmin
        .from("notification_events")
        .insert({
          user_id: userId,
          event_key: eventKey,
          event_type: eventType,
          title,
          body: messageBody,
          target_url: targetUrl,
          payload: payloadMeta,
          delivered_count: 0,
        })
        .select("id")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          return jsonResponse({ ok: true, duplicate: true, delivered: 0 });
        }
        throw insertError;
      }
      eventId = insertedEvent?.id || null;
    }

    // Load active push subscriptions for user
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return jsonResponse({ ok: true, delivered: 0, reason: "no_subscriptions" });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const notificationPayload = JSON.stringify({
      title,
      body: messageBody,
      url: targetUrl,
      tag: action === "test" ? `milestone-test-${Date.now()}` : eventKey,
      eventKey,
      icon: "/icons/pwa-192x192.png",
      badge: "/icons/badge-72x72.png",
    });

    const staleIds: string[] = [];
    let delivered = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload,
            { TTL: 86400 }
          );
          delivered += 1;
        } catch (pushErr: any) {
          failed += 1;
          const statusCode = pushErr?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            staleIds.push(sub.id);
          } else {
            console.warn("Web Push delivery error:", statusCode || pushErr?.message);
          }
        }
      })
    );

    if (staleIds.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("id", staleIds);
    }

    if (eventId && delivered > 0) {
      await supabaseAdmin
        .from("notification_events")
        .update({ delivered_count: delivered })
        .eq("id", eventId);
    }

    return jsonResponse({
      ok: true,
      delivered,
      failed,
      pruned: staleIds.length,
    });
  } catch (err: any) {
    console.error("send-push-notification error:", err?.message || err);
    return jsonResponse({ error: err?.message || "Internal server error" }, 500);
  }
});
