// src/hooks/useRoadmapDetail.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_ROADMAPS, MOCK_MILESTONES } from '../lib/mockData';

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

    // Fallback check in guest storage
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

    // Fallback check in guest storage
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
      setMilestones(localMs || []);
      setLoading(false);
      return;
    }

    // 2. Check mock sample roadmaps
    const mockRm = MOCK_ROADMAPS.find((r) => r.id === roadmapId);
    if (mockRm) {
      setRoadmap(mockRm);
      setMilestones(MOCK_MILESTONES[mockRm.id] || []);
      setLoading(false);
      return;
    }

    // 3. If Supabase is configured and ID looks like a UUID, query cloud DB
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

        setRoadmap(rmData);
        setMilestones(msData || []);
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Supabase fetch error, falling back:', err.message);
      }
    }

    // Fallback default
    const fallbackRm = MOCK_ROADMAPS[0];
    setRoadmap(fallbackRm);
    setMilestones(MOCK_MILESTONES[fallbackRm.id] || []);
    setLoading(false);
  }, [roadmapId, user]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Toggle Deliverable status
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

  // Toggle Milestone status
  const toggleMilestone = async (milestoneId, currentStatus) => {
    const nextStatus = !currentStatus;
    const userId = user?.id || null;

    setMilestones((prev) => {
      const updated = prev.map((m) =>
        m.id === milestoneId ? { ...m, is_completed: nextStatus } : m
      );
      updateStoredMilestones(userId, roadmapId, updated);
      return updated;
    });

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('milestones')
          .update({ is_completed: nextStatus })
          .eq('id', milestoneId);
      } catch (err) {
        console.error('Failed to toggle milestone in Supabase:', err);
      }
    }
  };

  // Add Dynamic Milestone (Adaptive Reschedule)
  const addMilestone = async (newMilestoneData) => {
    const userId = user?.id || null;
    const msId = crypto.randomUUID ? crypto.randomUUID() : `ms-${Date.now()}`;
    const newMs = {
      id: msId,
      roadmap_id: roadmapId,
      order_index: milestones.length,
      title: newMilestoneData.title,
      description: newMilestoneData.description || '',
      is_completed: false,
      is_major: false,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      xp_reward: 120,
      deliverables: (newMilestoneData.deliverables || []).map((d, i) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : `del-${msId}-${i}`,
        milestone_id: msId,
        title: typeof d === 'string' ? d : d.title,
        is_completed: false,
        order_index: i,
      })),
      resources: (newMilestoneData.resources || []).map((r, i) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : `res-${msId}-${i}`,
        milestone_id: msId,
        title: r.title,
        url: r.url || 'https://google.com',
        type: r.type || 'docs',
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
          roadmap_id: newMs.roadmap_id,
          order_index: newMs.order_index,
          title: newMs.title,
          description: newMs.description,
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
