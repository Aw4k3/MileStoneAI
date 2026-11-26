// src/hooks/useSettings.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_SETTINGS } from '../lib/mockData';

const DEFAULT_NOTIFICATION_PREFS = {
  milestone_completed: true,
  blueprint_completed: true,
  streak_milestones: true,
  badges: true,
};

const FALLBACK_SETTINGS = {
  ...MOCK_SETTINGS,
  push_enabled: false,
  notification_preferences: DEFAULT_NOTIFICATION_PREFS,
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setSettings(FALLBACK_SETTINGS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          ...data,
          notification_preferences: {
            ...DEFAULT_NOTIFICATION_PREFS,
            ...data.notification_preferences,
          },
        });
      }
    } catch (err) {
      console.warn('Error fetching settings:', err.message);
      setSettings(FALLBACK_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update Settings mutation
  const updateSettings = async (partialUpdates) => {
    setSettings((prev) => ({ ...prev, ...partialUpdates }));

    if (isSupabaseConfigured && user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .update(partialUpdates)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err) {
        console.error('Failed to update settings in Supabase:', err);
      }
    }
  };

  // Delete All App Data for user
  const deleteAllUserData = async () => {
    if (isSupabaseConfigured && user) {
      // Cascades delete to roadmaps, milestones, chat, stats, settings
      await supabase.from('roadmaps').delete().eq('user_id', user.id);
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
      await supabase.from('user_stats').delete().eq('user_id', user.id);
      await supabase.from('user_settings').delete().eq('user_id', user.id);
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    deleteAllUserData,
    refetch: fetchSettings,
  };
}
