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
      if (!isSupabaseConfigured) {
        // Fallback gracefully to mock user when Supabase env vars are pending
        if (mounted) {
          setUser(MOCK_USER);
          setLoading(false);
        }
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(initialSession);
          if (initialSession?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', initialSession.user.id)
              .single();

            setUser({
              id: initialSession.user.id,
              email: initialSession.user.email,
              display_name: profile?.display_name || initialSession.user.user_metadata?.full_name || 'Adventurer',
              avatar_url: profile?.avatar_url || null,
            });
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Auth initialization fallback:', err.message);
        if (mounted) setUser(MOCK_USER);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    let subscription = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();

          setUser({
            id: newSession.user.id,
            email: newSession.user.email,
            display_name: profile?.display_name || newSession.user.user_metadata?.full_name || 'Adventurer',
            avatar_url: profile?.avatar_url || null,
          });
        } else {
          setUser(null);
        }
      });
      subscription = data?.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Email / Password Login
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        await new Promise((res) => setTimeout(res, 500));
        const mockLogged = { ...MOCK_USER, email };
        setUser(mockLogged);
        return mockLogged;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  // Email / Password Sign Up
  const signup = useCallback(async (email, password, displayName) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        await new Promise((res) => setTimeout(res, 500));
        const mockNew = { ...MOCK_USER, email, display_name: displayName };
        setUser(mockNew);
        return mockNew;
      }

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
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  // Google OAuth Login
  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        await new Promise((res) => setTimeout(res, 600));
        setUser(MOCK_USER);
        return MOCK_USER;
      }

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
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
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
