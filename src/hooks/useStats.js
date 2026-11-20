// src/hooks/useStats.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_STATS } from '../lib/mockData';

export function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setStats(MOCK_STATS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.warn('Error fetching stats:', err.message);
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Award XP to user
  const awardXp = async (amount) => {
    const newXp = (stats.total_xp || 0) + amount;

    setStats((prev) => ({
      ...prev,
      total_xp: newXp,
    }));

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('user_stats')
          .update({ total_xp: newXp, last_activity_date: new Date().toISOString().slice(0, 10) })
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to award XP in Supabase:', err);
      }
    }
  };

  return {
    stats,
    loading,
    awardXp,
    refetch: fetchStats,
  };
}
