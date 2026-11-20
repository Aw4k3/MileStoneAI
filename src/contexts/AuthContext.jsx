// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_USER } from '../lib/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
            let displayName =
              initialSession.user.user_metadata?.full_name ||
              initialSession.user.email?.split('@')[0] ||
              'Adventurer';
            let avatarUrl = initialSession.user.user_metadata?.avatar_url || null;

            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', initialSession.user.id)
                .maybeSingle();

              if (profile?.display_name) displayName = profile.display_name;
              if (profile?.avatar_url) avatarUrl = profile.avatar_url;
            } catch {
              // Non-fatal if table permissions are still propagating
            }

            setUser({
              id: initialSession.user.id,
              email: initialSession.user.email,
              display_name: displayName,
              avatar_url: avatarUrl,
            });
          } else {
            // No active session — keep user null so login button / guest state works
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
        let displayName =
          newSession.user.user_metadata?.full_name ||
          newSession.user.email?.split('@')[0] ||
          'Adventurer';
        let avatarUrl = newSession.user.user_metadata?.avatar_url || null;

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', newSession.user.id)
            .maybeSingle();

          if (profile?.display_name) displayName = profile.display_name;
          if (profile?.avatar_url) avatarUrl = profile.avatar_url;
        } catch {
          // Non-fatal
        }

        setUser({
          id: newSession.user.id,
          email: newSession.user.email,
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

        // Ensure user profile exists
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: displayName,
          });
        } catch {
          // Ignore
        }
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
        setUser({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName || data.user.email?.split('@')[0] || 'Adventurer',
          avatar_url: null,
        });

        // Ensure user profile exists
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: displayName || data.user.email?.split('@')[0] || 'Adventurer',
          });
        } catch {
          // Ignore
        }
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
