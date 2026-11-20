// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

function clearUserStorage(userId) {
  try {
    if (userId) {
      localStorage.removeItem(`milestone_ai_${userId}_roadmaps`);
      localStorage.removeItem(`milestone_ai_${userId}_milestones`);
      localStorage.removeItem(`milestone_ai_${userId}_stats`);
      localStorage.removeItem(`milestone_visited_${userId}`);
    }
    // Also remove global and guest cache
    localStorage.removeItem('milestone_ai_user_roadmaps');
    localStorage.removeItem('milestone_ai_user_milestones');
    localStorage.removeItem('milestone_ai_user_stats');
    localStorage.removeItem('milestone_ai_guest_roadmaps');
    localStorage.removeItem('milestone_ai_guest_milestones');
    localStorage.removeItem('milestone_ai_guest_stats');
    localStorage.removeItem('milestone_visited_guest');
  } catch (err) {
    console.warn('Storage cleanup notice:', err);
  }
}

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

      // If email column does not exist yet in database, fallback to without email
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
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('Supabase getSession notice:', sessionError.message);
        }

        if (initialSession?.user) {
          // Verify with Supabase server whether user ACTUALLY still exists in database
          const { data: userData, error: userError } = await supabase.auth.getUser();

          if (userError || !userData?.user) {
            console.warn('User does not exist on Supabase server (possibly deleted). Purging stale local session.');
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            clearUserStorage(initialSession.user.id);
            if (mounted) {
              setSession(null);
              setUser(null);
              setLoading(false);
            }
            return;
          }

          if (mounted) {
            setSession(initialSession);
            const authUser = userData.user;
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
          }
        } else {
          if (mounted) {
            setSession(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Auth initialization notice:', err.message);
        if (mounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

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
        setLoading(false);
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
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  // Sign out
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const currentUserId = user?.id;
      await supabase.auth.signOut();
      clearUserStorage(currentUserId);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Full local storage wipe & logout
  const wipeAllLocalData = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // non-fatal
    }
    localStorage.clear();
    setUser(null);
    setSession(null);
    window.location.href = '/auth';
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
    wipeAllLocalData,
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
