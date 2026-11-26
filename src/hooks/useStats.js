// src/hooks/useStats.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BADGE_DEFINITIONS } from '../lib/constants';
import { dispatchMilestonePush } from '../lib/pushDispatch';

const DEFAULT_ZERO_STATS = {
  total_xp: 0,
  current_streak: 0,
  longest_streak: 0,
  last_activity_date: null,
  badges: [],
};

function getLocalStatsKey(userId) {
  return userId ? `milestone_ai_${userId}_stats` : 'milestone_ai_guest_stats';
}

function getQuizCountKey(userId) {
  return userId ? `milestone_ai_${userId}_quizzes_passed` : 'milestone_ai_guest_quizzes_passed';
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

function computeNextStreak(lastDateStr, currentStreak, todayStr) {
  if (!lastDateStr) return Math.max(1, currentStreak || 0);
  if (lastDateStr === todayStr) return Math.max(1, currentStreak || 1);

  const prevMs = Date.parse(`${lastDateStr}T00:00:00Z`);
  const todayMs = Date.parse(`${todayStr}T00:00:00Z`);
  if (Number.isNaN(prevMs) || Number.isNaN(todayMs)) return 1;

  const diffDays = Math.round((todayMs - prevMs) / (24 * 60 * 60 * 1000));
  if (diffDays === 1) return (currentStreak || 0) + 1;
  return 1;
}

export function useStats() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(() => {
    return user ? (getStoredStats(user.id) || DEFAULT_ZERO_STATS) : DEFAULT_ZERO_STATS;
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setStats(DEFAULT_ZERO_STATS);
      setLoading(false);
      return;
    }

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
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchStats();
    }
  }, [authLoading, fetchStats]);

  // Award XP, update daily streaks, unlock eligible badges, and push milestone achievement notifications
  const awardXp = async (amount, eventMeta = {}) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentStats = stats || DEFAULT_ZERO_STATS;
    const newXp = (currentStats.total_xp || 0) + (amount || 0);
    const nextStreak = computeNextStreak(
      currentStats.last_activity_date,
      currentStats.current_streak,
      todayStr
    );
    const nextLongest = Math.max(currentStats.longest_streak || 0, nextStreak);

    let quizzesPassed = 0;
    try {
      const qKey = getQuizCountKey(user?.id);
      quizzesPassed = Number(localStorage.getItem(qKey) || '0');
      if (eventMeta.quizPassed) {
        quizzesPassed += 1;
        localStorage.setItem(qKey, String(quizzesPassed));
      }
    } catch {
      // Non-fatal
    }

    const existingBadges = Array.isArray(currentStats.badges) ? currentStats.badges : [];
    const existingSlugs = new Set(existingBadges.map((b) => b.slug));
    const newlyUnlocked = [];
    const nowIso = new Date().toISOString();

    const badgeChecks = {
      first_roadmap: Boolean(eventMeta.blueprintCreated),
      first_complete: Boolean(eventMeta.blueprintCompleted),
      streak_7: nextStreak >= 7,
      streak_30: nextStreak >= 30,
      xp_1000: newXp >= 1000,
      quiz_ace: quizzesPassed >= 10,
    };

    for (const def of BADGE_DEFINITIONS) {
      if (badgeChecks[def.slug] && !existingSlugs.has(def.slug)) {
        newlyUnlocked.push({
          ...def,
          earned_at: nowIso,
        });
      }
    }

    const nextBadges = [...existingBadges, ...newlyUnlocked];
    const updated = {
      ...currentStats,
      total_xp: newXp,
      current_streak: nextStreak,
      longest_streak: nextLongest,
      last_activity_date: todayStr,
      badges: nextBadges,
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
            current_streak: nextStreak,
            longest_streak: nextLongest,
            last_activity_date: todayStr,
            badges: nextBadges,
          })
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to update stats in Supabase:', err);
      }

      // Emit push notifications for newly unlocked badges or streak milestones
      for (const badge of newlyUnlocked) {
        const isStreakBadge = badge.slug === 'streak_7' || badge.slug === 'streak_30';
        dispatchMilestonePush({
          userId: user.id,
          eventKey: `badge_earned:${badge.slug}`,
          eventType: isStreakBadge ? 'streak_milestones' : 'badges',
          title: isStreakBadge ? `${nextStreak}-day streak reached!` : `Badge unlocked: ${badge.name}`,
          body: badge.description,
          targetUrl: '/dashboard',
          payload: { badgeSlug: badge.slug, streak: nextStreak, totalXp: newXp },
        });
      }
    }

    return {
      updatedStats: updated,
      newlyUnlocked,
    };
  };

  const recordBlueprintCreated = async (roadmapTitle) => {
    return awardXp(50, {
      blueprintCreated: true,
      roadmapTitle,
    });
  };

  return {
    stats: stats || DEFAULT_ZERO_STATS,
    loading,
    awardXp,
    recordBlueprintCreated,
    refetch: fetchStats,
  };
}
