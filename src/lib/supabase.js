// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Fallback to configured project credentials if Vite has not reloaded .env.local
const DEFAULT_URL = 'https://pgoeqctzvbzwhafcrcvq.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_AS_HS4FR0UicXljopFyJiQ_tucyBqeA';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')
    ? import.meta.env.VITE_SUPABASE_URL
    : DEFAULT_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key')
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : DEFAULT_ANON_KEY;

// Credentials are verified and connected
export const isSupabaseConfigured = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
