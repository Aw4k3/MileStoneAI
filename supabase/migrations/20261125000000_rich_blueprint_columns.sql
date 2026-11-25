-- supabase/migrations/20261125000000_rich_blueprint_columns.sql
-- Add rich curriculum compilation fields to unified Blueprint tables

-- 1. Roadmaps metadata
ALTER TABLE public.roadmaps
  ADD COLUMN IF NOT EXISTS estimated_duration_weeks INTEGER,
  ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-2.5-flash';

-- 2. Milestones structured course fields & offset metadata
ALTER TABLE public.milestones
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS estimated_week_offset INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS learning_objectives JSONB DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS practical_exercises JSONB DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb NOT NULL;

-- 3. Resources metadata (description & free/paid pricing flag)
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true NOT NULL;

-- Refresh table privileges for anon/authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
