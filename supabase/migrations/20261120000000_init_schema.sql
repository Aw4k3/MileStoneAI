-- supabase/migrations/20261120000000_init_schema.sql
-- Milestone AI Complete Database Schema & Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE (Extends auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 2. USER STATS (XP, Streaks, Gamification)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_activity_date DATE,
  badges JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 3. USER SETTINGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_model TEXT DEFAULT 'flash' NOT NULL CHECK (default_model IN ('flash', 'pro')),
  notification_pacing TEXT DEFAULT 'daily' NOT NULL,
  push_enabled BOOLEAN DEFAULT false NOT NULL,
  mentor_persona TEXT DEFAULT 'tutor' NOT NULL CHECK (mentor_persona IN ('tutor', 'coach', 'peer')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 4. ROADMAPS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal_summary TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_months INTEGER NOT NULL CHECK (duration_months BETWEEN 1 AND 24),
  pacing TEXT NOT NULL CHECK (pacing IN ('daily', 'every_3_days', 'weekly', 'biweekly', 'monthly')),
  key_outcomes JSONB DEFAULT '[]'::jsonb NOT NULL,
  gemini_model TEXT DEFAULT 'flash' NOT NULL CHECK (gemini_model IN ('flash', 'pro')),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
  start_date DATE DEFAULT CURRENT_DATE NOT NULL,
  target_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 5. MILESTONES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  is_major BOOLEAN DEFAULT false NOT NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  xp_reward INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 6. DELIVERABLES TABLE (Checklist per milestone)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 7. RESOURCES TABLE (Curated links per milestone)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('course', 'book', 'video', 'docs', 'project')),
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 8. CHAT MESSAGES TABLE (AI Mentor history per roadmap)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  persona TEXT DEFAULT 'tutor' NOT NULL CHECK (persona IN ('tutor', 'coach', 'peer')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_status ON public.roadmaps(user_id, status);
CREATE INDEX IF NOT EXISTS idx_milestones_roadmap_order ON public.milestones(roadmap_id, order_index);
CREATE INDEX IF NOT EXISTS idx_deliverables_milestone ON public.deliverables(milestone_id, order_index);
CREATE INDEX IF NOT EXISTS idx_resources_milestone ON public.resources(milestone_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chat_messages_roadmap ON public.chat_messages(roadmap_id, created_at);

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_roadmaps_updated_at
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- AUTOMATIC USER PROVISIONING TRIGGER ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  -- Insert initial stats record
  INSERT INTO public.user_stats (user_id, total_xp, current_streak, longest_streak, badges)
  VALUES (
    NEW.id,
    0,
    1,
    1,
    '[]'::jsonb
  );

  -- Insert initial settings record
  INSERT INTO public.user_settings (user_id, default_model, notification_pacing, push_enabled, mentor_persona)
  VALUES (
    NEW.id,
    'flash',
    'daily',
    false,
    'tutor'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fired after an auth user is inserted
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. User Stats RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. User Settings RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Roadmaps RLS
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roadmaps"
  ON public.roadmaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmaps"
  ON public.roadmaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmaps"
  ON public.roadmaps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roadmaps"
  ON public.roadmaps FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Milestones RLS (Joined to roadmaps)
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones of their roadmaps"
  ON public.milestones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.roadmaps
    WHERE roadmaps.id = milestones.roadmap_id
      AND roadmaps.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert milestones to their roadmaps"
  ON public.milestones FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.roadmaps
    WHERE roadmaps.id = milestones.roadmap_id
      AND roadmaps.user_id = auth.uid()
  ));

CREATE POLICY "Users can update milestones of their roadmaps"
  ON public.milestones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.roadmaps
    WHERE roadmaps.id = milestones.roadmap_id
      AND roadmaps.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete milestones of their roadmaps"
  ON public.milestones FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.roadmaps
    WHERE roadmaps.id = milestones.roadmap_id
      AND roadmaps.user_id = auth.uid()
  ));

-- 6. Deliverables RLS (Joined to milestones -> roadmaps)
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage deliverables of their milestones"
  ON public.deliverables FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.milestones
    JOIN public.roadmaps ON roadmaps.id = milestones.roadmap_id
    WHERE milestones.id = deliverables.milestone_id
      AND roadmaps.user_id = auth.uid()
  ));

-- 7. Resources RLS (Joined to milestones -> roadmaps)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage resources of their milestones"
  ON public.resources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.milestones
    JOIN public.roadmaps ON roadmaps.id = milestones.roadmap_id
    WHERE milestones.id = resources.milestone_id
      AND roadmaps.user_id = auth.uid()
  ));

-- 8. Chat Messages RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);
