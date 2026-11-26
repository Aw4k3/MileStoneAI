-- supabase/migrations/20261126000000_push_notifications.sql
-- Web Push subscriptions, idempotent milestone notification logs, and granular user preferences

-- 1. Extend user_settings with per-category milestone notification preferences
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "milestone_completed": true,
    "blueprint_completed": true,
    "streak_milestones": true,
    "badges": true
  }'::jsonb NOT NULL;

-- 2. Browser / device Web Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT DEFAULT '',
  platform TEXT DEFAULT '',
  is_standalone BOOLEAN DEFAULT false NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT push_subscriptions_user_endpoint_unique UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Idempotent milestone notification event ledger (prevents duplicate notifications)
CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT DEFAULT '/dashboard' NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb NOT NULL,
  delivered_count INTEGER DEFAULT 0 NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT notification_events_user_key_unique UNIQUE (user_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_events_user_sent
  ON public.notification_events(user_id, sent_at DESC);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification events" ON public.notification_events;
CREATE POLICY "Users can view own notification events"
  ON public.notification_events FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Table privileges matching project security model
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated, service_role;
GRANT SELECT ON public.notification_events TO authenticated;
GRANT ALL ON public.notification_events TO service_role;
