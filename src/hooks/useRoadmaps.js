// src/hooks/useRoadmaps.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function getRoadmapsStorageKey(userId) {
  return userId ? `milestone_ai_${userId}_roadmaps` : 'milestone_ai_guest_roadmaps';
}

function getMilestonesStorageKey(userId) {
  return userId ? `milestone_ai_${userId}_milestones` : 'milestone_ai_guest_milestones';
}

// Helper to get local stored blueprints per user
function getStoredRoadmaps(userId) {
  try {
    const raw = localStorage.getItem(getRoadmapsStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getStoredMilestonesMap(userId) {
  try {
    const raw = localStorage.getItem(getMilestonesStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalRoadmaps(userId, roadmapsList, milestonesMapData) {
  try {
    localStorage.setItem(getRoadmapsStorageKey(userId), JSON.stringify(roadmapsList));
    localStorage.setItem(getMilestonesStorageKey(userId), JSON.stringify(milestonesMapData));
  } catch (err) {
    console.warn('LocalStorage save notice:', err);
  }
}

// Ensure resource type matches Postgres check constraint
function sanitizeResourceType(type) {
  const allowed = ['course', 'book', 'video', 'docs', 'project'];
  const clean = (type || '').toLowerCase();
  if (allowed.includes(clean)) return clean;
  if (clean.includes('vid') || clean.includes('youtube')) return 'video';
  if (clean.includes('doc') || clean.includes('article') || clean.includes('guide')) return 'docs';
  if (clean.includes('book') || clean.includes('read')) return 'book';
  if (clean.includes('proj') || clean.includes('github') || clean.includes('code')) return 'project';
  return 'course';
}

export function useRoadmaps() {
  const { user, loading: authLoading } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [milestonesMap, setMilestonesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all roadmaps scoped strictly to the current user
  const fetchRoadmaps = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError(null);

    const userId = user?.id || null;

    // 1. Load local roadmaps scoped to this user
    const localRoadmaps = getStoredRoadmaps(userId);
    const localMilestonesMap = getStoredMilestonesMap(userId);

    let combinedRoadmaps = [...localRoadmaps];
    let combinedMilestonesMap = { ...localMilestonesMap };

    // 2. If Supabase is configured and user is signed in, fetch remote roadmaps
    if (isSupabaseConfigured && user) {
      try {
        const { data: dbRoadmaps, error: roadmapError } = await supabase
          .from('roadmaps')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!roadmapError && dbRoadmaps && dbRoadmaps.length > 0) {
          const roadmapIds = dbRoadmaps.map((r) => r.id);
          const { data: dbMilestones, error: mError } = await supabase
            .from('milestones')
            .select('*, deliverables(*), resources(*)')
            .in('roadmap_id', roadmapIds)
            .order('order_index', { ascending: true });

          if (!mError && dbMilestones) {
            dbMilestones.forEach((m) => {
              if (!combinedMilestonesMap[m.roadmap_id]) {
                combinedMilestonesMap[m.roadmap_id] = [];
              }
              if (!combinedMilestonesMap[m.roadmap_id].some((x) => x.id === m.id)) {
                combinedMilestonesMap[m.roadmap_id].push(m);
              }
            });
          }

          // Merge DB roadmaps avoiding duplicate IDs
          dbRoadmaps.forEach((r) => {
            if (!combinedRoadmaps.some((x) => x.id === r.id)) {
              combinedRoadmaps.unshift(r);
            }
          });
        }
      } catch (err) {
        console.warn('Remote Supabase roadmaps fetch notice:', err.message);
      }
    }

    // Always maintain clean state: no dummy mock blueprints injected
    setRoadmaps(combinedRoadmaps);
    setMilestonesMap(combinedMilestonesMap);
    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchRoadmaps();
    }
  }, [authLoading, fetchRoadmaps]);

  // Create a new roadmap
  const createRoadmap = async ({
    title,
    goal_summary,
    difficulty = 'intermediate',
    duration_months = 3,
    pacing = 'weekly',
    key_outcomes = [],
    gemini_model = 'pro',
    milestones = [],
  }) => {
    const userId = user?.id || null;
    const newId = crypto.randomUUID ? crypto.randomUUID() : `roadmap-${Date.now()}`;

    const newRoadmap = {
      id: newId,
      user_id: user?.id || 'guest_user',
      title: title || 'Custom Learning Blueprint',
      goal_summary: goal_summary || '',
      difficulty,
      duration_months,
      pacing,
      key_outcomes: key_outcomes || [],
      gemini_model,
      status: 'active',
      start_date: new Date().toISOString().slice(0, 10),
      target_end_date: new Date(Date.now() + duration_months * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      created_at: new Date().toISOString(),
    };

    // Format Milestones with full deliverables and resources
    const formattedMilestones = milestones.map((m, idx) => {
      const msId = crypto.randomUUID ? crypto.randomUUID() : `ms-${newId}-${idx}`;
      return {
        id: msId,
        roadmap_id: newId,
        order_index: idx,
        title: m.title || `Milestone ${idx + 1}`,
        description: m.description || '',
        is_completed: false,
        is_major: m.is_major ?? (idx + 1) % 3 === 0,
        due_date: new Date(Date.now() + (idx + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        xp_reward: m.xp_reward || 150,
        deliverables: (m.deliverables || []).map((d, dIdx) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : `del-${msId}-${dIdx}`,
          milestone_id: msId,
          title: typeof d === 'string' ? d : d.title || 'Complete checkpoint task',
          is_completed: false,
          order_index: dIdx,
        })),
        resources: (m.resources || []).map((r, rIdx) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : `res-${msId}-${rIdx}`,
          milestone_id: msId,
          title: r.title || 'Official Documentation',
          url: r.url || 'https://google.com',
          type: sanitizeResourceType(r.type),
          order_index: rIdx,
        })),
      };
    });

    // 1. Persist locally to the current user's isolated storage
    const currentStoredRoadmaps = getStoredRoadmaps(userId);
    const currentStoredMilestones = getStoredMilestonesMap(userId);

    const updatedStoredRoadmaps = [newRoadmap, ...currentStoredRoadmaps];
    const updatedStoredMilestones = {
      ...currentStoredMilestones,
      [newId]: formattedMilestones,
    };

    saveLocalRoadmaps(userId, updatedStoredRoadmaps, updatedStoredMilestones);

    // Update in-memory state
    setRoadmaps((prev) => [newRoadmap, ...prev.filter((r) => r.id !== newId)]);
    setMilestonesMap((prev) => ({
      ...prev,
      [newId]: formattedMilestones,
    }));

    // 2. If Supabase is connected and user is authenticated, sync to cloud database
    if (isSupabaseConfigured && user) {
      try {
        // Ensure profile exists in public.profiles to satisfy foreign key
        await supabase.from('profiles').upsert({
          id: user.id,
          display_name: user.display_name || user.email?.split('@')[0] || 'Adventurer',
          avatar_url: user.avatar_url || null,
        });

        // Insert roadmap
        const { error: rmError } = await supabase
          .from('roadmaps')
          .insert({
            id: newId,
            user_id: user.id,
            title: newRoadmap.title,
            goal_summary: newRoadmap.goal_summary,
            difficulty: newRoadmap.difficulty,
            duration_months: newRoadmap.duration_months,
            pacing: newRoadmap.pacing,
            key_outcomes: newRoadmap.key_outcomes,
            gemini_model: newRoadmap.gemini_model,
            status: 'active',
          });

        if (rmError) throw rmError;

        // Insert milestones and nested items
        for (const m of formattedMilestones) {
          const { error: msError } = await supabase.from('milestones').insert({
            id: m.id,
            roadmap_id: newId,
            order_index: m.order_index,
            title: m.title,
            description: m.description,
            is_completed: false,
            is_major: m.is_major,
            xp_reward: m.xp_reward,
          });

          if (!msError) {
            if (m.deliverables.length > 0) {
              await supabase.from('deliverables').insert(
                m.deliverables.map((d) => ({
                  id: d.id,
                  milestone_id: m.id,
                  title: d.title,
                  is_completed: false,
                  order_index: d.order_index,
                }))
              );
            }

            if (m.resources.length > 0) {
              await supabase.from('resources').insert(
                m.resources.map((r) => ({
                  id: r.id,
                  milestone_id: m.id,
                  title: r.title,
                  url: r.url,
                  type: r.type,
                  order_index: r.order_index,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.warn('Cloud sync to Supabase notice (saved locally):', err.message);
      }
    }

    return newRoadmap;
  };

  // Delete roadmap
  const deleteRoadmap = async (roadmapId) => {
    const userId = user?.id || null;

    // 1. Remove locally from user's storage
    const currentStoredRoadmaps = getStoredRoadmaps(userId).filter((r) => r.id !== roadmapId);
    const currentStoredMilestones = { ...getStoredMilestonesMap(userId) };
    delete currentStoredMilestones[roadmapId];
    saveLocalRoadmaps(userId, currentStoredRoadmaps, currentStoredMilestones);

    setRoadmaps((prev) => prev.filter((r) => r.id !== roadmapId));
    setMilestonesMap((prev) => {
      const copy = { ...prev };
      delete copy[roadmapId];
      return copy;
    });

    // 2. Remove from Supabase if configured and user is signed in
    if (isSupabaseConfigured && user) {
      try {
        await supabase.from('roadmaps').delete().eq('id', roadmapId).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase delete notice:', err.message);
      }
    }
  };

  return {
    roadmaps,
    milestonesMap,
    loading,
    error,
    refetch: fetchRoadmaps,
    createRoadmap,
    deleteRoadmap,
  };
}
