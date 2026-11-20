-- supabase/migrations/20261120000002_add_email_to_profiles.sql
-- Add email to profiles, backfill existing users, and update trigger

-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill existing emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. Update handle_new_user trigger function to always store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user profile with email
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      ''
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

  -- Initialize stats if not present (0 XP, 0 streak for new users)
  INSERT INTO public.user_stats (user_id, total_xp, current_streak, longest_streak, badges)
  VALUES (NEW.id, 0, 0, 0, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize settings if not present
  INSERT INTO public.user_settings (user_id, default_model, notification_pacing, push_enabled, mentor_persona)
  VALUES (NEW.id, 'flash', 'daily', false, 'tutor')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure anon and authenticated have access
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
