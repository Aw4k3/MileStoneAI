// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_USER } from '../lib/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync profile & email to public.profiles table
  const syncProfile = async (authUser) => {
    if (!authUser || !isSupabaseConfigured) return;

    const email = authUser.email || '';
    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split('@')[0] ||
      'Adventurer';
    const avatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;

    try {
      const { error } = await supabase.from('profiles').upsert(
        {
          id: authUser.id,
          email,
          display_name: fullName,
          avatar_url: avatar,
        },
        { onConflict: 'id' }
      );

      // If email column doesn't exist yet in database, fallback to without email
      if (error && error.message?.includes('email')) {
        await supabase.from('profiles').upsert(
          {
            id: authUser.id,
            display_name: fullName,
            avatar_url: avatar,
          },
          { onConflict: 'id' }
        );
      }
    } catch (err) {
      console.warn('Profile sync notice:', err.message);
    }
  };

  // Initialize Auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase getSession notice:', error.message);
        }

        if (mounted) {
          setSession(initialSession);
          if (initialSession?.user) {
            const authUser = initialSession.user;
            let displayName =
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split('@')[0] ||
              'Adventurer';
            let avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;

            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, avatar_url, email')
                .eq('id', authUser.id)
                .maybeSingle();

              if (profile?.display_name) displayName = profile.display_name;
              if (profile?.avatar_url) avatarUrl = profile.avatar_url;
            } catch {
              // Non-fatal
            }

            // Sync email and metadata to profiles
            syncProfile(authUser);

            setUser({
              id: authUser.id,
              email: authUser.email,
              display_name: displayName,
              avatar_url: avatarUrl,
            });
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Auth initialization notice:', err.message);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        const authUser = newSession.user;
        let displayName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'Adventurer';
        let avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, email')
            .eq('id', authUser.id)
            .maybeSingle();

          if (profile?.display_name) displayName = profile.display_name;
          if (profile?.avatar_url) avatarUrl = profile.avatar_url;
        } catch {
          // Non-fatal
        }

        syncProfile(authUser);

        setUser({
          id: authUser.id,
          email: authUser.email,
          display_name: displayName,
          avatar_url: avatarUrl,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Email / Password Login
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        const displayName =
          data.user.user_metadata?.full_name ||
          data.user.email?.split('@')[0] ||
          'Adventurer';

        setUser({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName,
          avatar_url: null,
        });

        await syncProfile(data.user);
      }

      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  // Email / Password Sign Up
  const signup = useCallback(async (email, password, displayName) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data?.user) {
        const resolvedName = displayName || data.user.email?.split('@')[0] || 'Adventurer';
        setUser({
          id: data.user.id,
          email: data.user.email,
          display_name: resolvedName,
          avatar_url: null,
        });

        await syncProfile(data.user);
      }

      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  // Google OAuth Login
  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    session,
    loading,
    isSupabaseConnected: isSupabaseConfigured,
    isAuthenticated: Boolean(user),
    login,
    signup,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
