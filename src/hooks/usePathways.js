// src/hooks/usePathways.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  loadPathways,
  savePathway,
  deletePathway,
  updatePathwayProgress,
  updateMilestoneChecklist,
} from '../lib/pathway';

export function usePathways() {
  const { user } = useAuth();
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id || null;

  const refresh = useCallback(() => {
    setLoading(true);
    const data = loadPathways(userId);
    setPathways(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPathway = useCallback(
    (pathway) => {
      const saved = savePathway(userId, pathway);
      setPathways((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      return saved;
    },
    [userId]
  );

  const removePathway = useCallback(
    (pathwayId) => {
      deletePathway(userId, pathwayId);
      setPathways((prev) => prev.filter((p) => p.id !== pathwayId));
    },
    [userId]
  );

  const toggleMilestone = useCallback(
    (pathwayId, milestoneId) => {
      const current = loadPathways(userId).find((p) => p.id === pathwayId);
      const target = current?.milestones?.find((m) => m.id === milestoneId);
      if (!target) return;

      const nextCompleted = target.status !== 'Completed';
      const updatedPathway = updatePathwayProgress(userId, pathwayId, milestoneId, nextCompleted);
      setPathways((prev) => prev.map((p) => (p.id === pathwayId ? updatedPathway : p)));
    },
    [userId]
  );

  const toggleDeliverable = useCallback(
    (pathwayId, milestoneId, deliverableIndex) => {
      const current = loadPathways(userId).find((p) => p.id === pathwayId);
      const target = current?.milestones?.find((m) => m.id === milestoneId);
      if (!target) return;

      const nextChecked = !target.checklist?.[deliverableIndex];
      const updatedPathway = updateMilestoneChecklist(
        userId,
        pathwayId,
        milestoneId,
        deliverableIndex,
        nextChecked
      );
      setPathways((prev) => prev.map((p) => (p.id === pathwayId ? updatedPathway : p)));
    },
    [userId]
  );

  return {
    pathways,
    loading,
    refresh,
    addPathway,
    removePathway,
    toggleMilestone,
    toggleDeliverable,
  };
}
