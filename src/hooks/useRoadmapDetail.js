// src/hooks/useRoadmapDetail.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_ROADMAPS, MOCK_MILESTONES } from '../lib/mockData';

const STORAGE_ROADMAPS_KEY = 'milestone_ai_user_roadmaps';
const STORAGE_MILESTONES_KEY = 'milestone_ai_user_milestones';

function getStoredRoadmap(id) {
  try {
    const raw = localStorage.getItem(STORAGE_ROADMAPS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.find((r) => r.id === id) || null;
  } catch {
    return null;
  }
}

function getStoredMilestones(id) {
  try {
    const raw = localStorage.getItem(STORAGE_MILESTONES_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map[id] || null;
  } catch {
    return null;
  }
}

function updateStoredMilestones(roadmapId, milestonesList) {
  try {
    const raw = localStorage.getItem(STORAGE_MILESTONES_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[roadmapId] = milestonesList;
    localStorage.setItem(STORAGE_MILESTONES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('LocalStorage milestone update error:', err);
  }
}

export function useRoadmapDetail(roadmapId) {
  const [roadmap, setRoadmap] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!roadmapId) return;
    setLoading(true);
    setError(null);

    // 1. Check local storage first
    const localRm = getStoredRoadmap(roadmapId);
    const localMs = getStoredMilestones(roadmapId);

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
  }, [roadmapId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Toggle Deliverable status
  const toggleDeliverable = async (milestoneId, deliverableId, currentStatus) => {
    const nextStatus = !currentStatus;

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

      updateStoredMilestones(roadmapId, updated);
      return updated;
    });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deliverableId);
    if (isSupabaseConfigured && isUuid) {
      try {
        await supabase
          .from('deliverables')
          .update({ is_completed: nextStatus })
          .eq('id', deliverableId);
      } catch (err) {
        console.warn('Failed to update deliverable in cloud:', err);
      }
    }
  };

  // Toggle Milestone completion
  const toggleMilestone = async (milestoneId, currentStatus) => {
    const nextStatus = !currentStatus;
    const completedAt = nextStatus ? new Date().toISOString() : null;

    setMilestones((prev) => {
      const updated = prev.map((m) =>
        m.id === milestoneId
          ? { ...m, is_completed: nextStatus, completed_at: completedAt }
          : m
      );

      updateStoredMilestones(roadmapId, updated);
      return updated;
    });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(milestoneId);
    if (isSupabaseConfigured && isUuid) {
      try {
        await supabase
          .from('milestones')
          .update({
            is_completed: nextStatus,
            completed_at: completedAt,
          })
          .eq('id', milestoneId);
      } catch (err) {
        console.warn('Failed to update milestone in cloud:', err);
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
  };
}
