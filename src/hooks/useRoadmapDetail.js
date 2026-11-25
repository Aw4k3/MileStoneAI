// src/hooks/useRoadmapDetail.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_ROADMAPS, MOCK_MILESTONES } from '../lib/mockData';
import { generateUUID } from '../lib/gemini';

function getRoadmapsStorageKey(userId) {
  return userId ? `milestone_ai_${userId}_roadmaps` : 'milestone_ai_guest_roadmaps';
}

function getMilestonesStorageKey(userId) {
  return userId ? `milestone_ai_${userId}_milestones` : 'milestone_ai_guest_milestones';
}

function getStoredRoadmap(userId, id) {
  try {
    const raw = localStorage.getItem(getRoadmapsStorageKey(userId));
    const list = raw ? JSON.parse(raw) : [];
    const found = list.find((r) => r.id === id);
    if (found) return found;

    if (userId) {
      const guestRaw = localStorage.getItem('milestone_ai_guest_roadmaps');
      const guestList = guestRaw ? JSON.parse(guestRaw) : [];
      return guestList.find((r) => r.id === id) || null;
    }
    return null;
  } catch {
    return null;
  }
}

function getStoredMilestones(userId, id) {
  try {
    const raw = localStorage.getItem(getMilestonesStorageKey(userId));
    const map = raw ? JSON.parse(raw) : {};
    if (map[id]) return map[id];

    if (userId) {
      const guestRaw = localStorage.getItem('milestone_ai_guest_milestones');
      const guestMap = guestRaw ? JSON.parse(guestRaw) : {};
      return guestMap[id] || null;
    }
    return null;
  } catch {
    return null;
  }
}

function updateStoredMilestones(userId, roadmapId, milestonesList) {
  try {
    const key = getMilestonesStorageKey(userId);
    const raw = localStorage.getItem(key);
    const map = raw ? JSON.parse(raw) : {};
    map[roadmapId] = milestonesList;
    localStorage.setItem(key, JSON.stringify(map));
  } catch (err) {
    console.warn('LocalStorage milestone update error:', err);
  }
}

function sortAndNormalizeMilestones(list) {
  return [...(list || [])]
    .sort((a, b) => {
      const offsetDiff = (Number(a.estimated_week_offset) || 0) - (Number(b.estimated_week_offset) || 0);
      if (offsetDiff !== 0) return offsetDiff;
      return (a.order_index || 0) - (b.order_index || 0);
    })
    .map((m, idx) => ({
      ...m,
      estimated_week_offset: Number(m.estimated_week_offset) || idx + 1,
      learning_objectives: Array.isArray(m.learning_objectives) ? m.learning_objectives : [],
      practical_exercises: Array.isArray(m.practical_exercises) ? m.practical_exercises : [],
      projects: Array.isArray(m.projects) ? m.projects : [],
      deliverables: [...(m.deliverables || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
      resources: [...(m.resources || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    }));
}

export function useRoadmapDetail(roadmapId) {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!roadmapId) return;
    setLoading(true);
    setError(null);

    const userId = user?.id || null;

    // 1. Check local storage first
    const localRm = getStoredRoadmap(userId, roadmapId);
    const localMs = getStoredMilestones(userId, roadmapId);

    if (localRm) {
      setRoadmap(localRm);
      setMilestones(sortAndNormalizeMilestones(localMs || []));
      setLoading(false);
      return;
    }

    // 2. Check mock sample roadmaps
    const mockRm = MOCK_ROADMAPS.find((r) => r.id === roadmapId);
    if (mockRm) {
      setRoadmap(mockRm);
      setMilestones(sortAndNormalizeMilestones(MOCK_MILESTONES[mockRm.id] || []));
      setLoading(false);
      return;
    }

    // 3. Query Supabase DB if ID is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roadmapId);
    if (isSupabaseConfigured && isUuid) {
      try {
        const { data: rmData, error: rmError } = await supabase
          .from('roadmaps')
          .select('*')
          .eq('id', roadmapId)
          .single();

        if (rmError) throw rmError;

        const { data: msData, error: msError } = await supabase
          .from('milestones')
          .select('*, deliverables(*), resources(*)')
          .eq('roadmap_id', roadmapId)
          .order('order_index', { ascending: true });

        if (msError) throw msError;

        const normalizedMs = sortAndNormalizeMilestones(msData || []);
        setRoadmap(rmData);
        setMilestones(normalizedMs);
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Supabase fetch notice:', err.message);
      }
    }

    setRoadmap(null);
    setMilestones([]);
    setLoading(false);
  }, [roadmapId, user]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const toggleDeliverable = async (milestoneId, deliverableId, currentStatus) => {
    const nextStatus = !currentStatus;
    const userId = user?.id || null;

    setMilestones((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          deliverables: (m.deliverables || []).map((d) =>
            d.id === deliverableId ? { ...d, is_completed: nextStatus } : d
          ),
        };
      });
      updateStoredMilestones(userId, roadmapId, updated);
      return updated;
    });

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('deliverables')
          .update({ is_completed: nextStatus })
          .eq('id', deliverableId);
      } catch (err) {
        console.error('Failed to toggle deliverable in Supabase:', err);
      }
    }
  };

  const toggleMilestone = async (milestoneId, currentStatus) => {
    const nextStatus = !currentStatus;
    const userId = user?.id || null;

    setMilestones((prev) => {
      const updated = prev.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              is_completed: nextStatus,
              completed_at: nextStatus ? new Date().toISOString() : null,
            }
          : m
      );
      updateStoredMilestones(userId, roadmapId, updated);
      return updated;
    });

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('milestones')
          .update({
            is_completed: nextStatus,
            completed_at: nextStatus ? new Date().toISOString() : null,
          })
          .eq('id', milestoneId);
      } catch (err) {
        console.error('Failed to toggle milestone in Supabase:', err);
      }
    }
  };

  const addMilestone = async (newMilestoneData) => {
    const userId = user?.id || null;
    const msId = generateUUID();
    const nextOffset = milestones.length + 1;
    const newMs = {
      id: msId,
      external_id: `${roadmapId}_m${nextOffset}`,
      roadmap_id: roadmapId,
      order_index: milestones.length,
      estimated_week_offset: nextOffset,
      title: newMilestoneData.title,
      description: newMilestoneData.description || '',
      learning_objectives: newMilestoneData.learning_objectives || [],
      practical_exercises: newMilestoneData.practical_exercises || [],
      projects: newMilestoneData.projects || [],
      is_completed: false,
      is_major: false,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      xp_reward: 120,
      deliverables: (newMilestoneData.deliverables || []).map((d, i) => ({
        id: generateUUID(),
        milestone_id: msId,
        title: typeof d === 'string' ? d : d.title,
        is_completed: false,
        order_index: i,
      })),
      resources: (newMilestoneData.resources || []).map((r, i) => ({
        id: generateUUID(),
        milestone_id: msId,
        title: r.title,
        description: r.description || '',
        url: r.url || '',
        type: r.type || 'docs',
        is_free: typeof r.is_free === 'boolean' ? r.is_free : true,
        order_index: i,
      })),
    };

    setMilestones((prev) => {
      const updated = [...prev, newMs];
      updateStoredMilestones(userId, roadmapId, updated);
      return updated;
    });

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from('milestones').insert({
          id: newMs.id,
          external_id: newMs.external_id,
          roadmap_id: newMs.roadmap_id,
          order_index: newMs.order_index,
          estimated_week_offset: newMs.estimated_week_offset,
          title: newMs.title,
          description: newMs.description,
          learning_objectives: newMs.learning_objectives,
          practical_exercises: newMs.practical_exercises,
          projects: newMs.projects,
          is_completed: false,
          is_major: false,
          xp_reward: newMs.xp_reward,
        });
      } catch (err) {
        console.warn('Failed to insert adaptive milestone to Supabase:', err);
      }
    }
  };

  return {
    roadmap,
    milestones,
    loading,
    error,
    refetch: fetchDetail,
    toggleDeliverable,
    toggleMilestone,
    addMilestone,
  };
}
