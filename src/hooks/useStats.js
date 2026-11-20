// src/hooks/useStats.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_ZERO_STATS = {
  total_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  badges: [],
};

function getLocalStatsKey(userId) {
  return userId ? `milestone_ai_${userId}_stats` : 'milestone_ai_guest_stats';
}

function getStoredStats(userId) {
  try {
    const raw = localStorage.getItem(getLocalStatsKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredStats(userId, statsData) {
  try {
    localStorage.setItem(getLocalStatsKey(userId), JSON.stringify(statsData));
  } catch {
    // Non-fatal
  }
}

export function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(() => {
    return user ? (getStoredStats(user.id) || DEFAULT_ZERO_STATS) : DEFAULT_ZERO_STATS;
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats(DEFAULT_ZERO_STATS);
      setLoading(false);
      return;
    }

    // 1. Try local cache for immediate feedback
    const cached = getStoredStats(user.id);
    if (cached) {
      setStats(cached);
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error reading user_stats:', error.message);
      }

      if (data) {
        setStats(data);
        saveStoredStats(user.id, data);
      } else {
        // Initialize new user stats row in database
        const initial = {
          user_id: user.id,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          badges: [],
        };
        try {
          await supabase.from('user_stats').insert(initial);
        } catch {
          // May conflict if trigger handled it, non-fatal
        }
        setStats(initial);
        saveStoredStats(user.id, initial);
      }
    } catch (err) {
      console.warn('Fetch stats notice:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Award XP to user
  const awardXp = async (amount) => {
    const newXp = (stats?.total_xp || 0) + amount;
    const updated = {
      ...stats,
      total_xp: newXp,
      last_activity_date: new Date().toISOString().slice(0, 10),
    };

    setStats(updated);
    if (user) {
      saveStoredStats(user.id, updated);
    }

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('user_stats')
          .update({
            total_xp: newXp,
            last_activity_date: new Date().toISOString().slice(0, 10),
          })
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to award XP in Supabase:', err);
      }
    }
  };

  return {
    stats: stats || DEFAULT_ZERO_STATS,
    loading,
    awardXp,
    refetch: fetchStats,
  };
}
