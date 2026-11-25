// src/hooks/useRoadmaps.js
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { normalizePacingKey } from '../lib/constants';
import { generateUUID, sanitizeExternalUrl } from '../lib/gemini';

function getRoadmapsStorageKey(userId) {
  return userId ? `milestone_ai_${userId}_roadmaps` : 'milestone_ai_guest_roadmaps';
}

function getMilestonesStorageKey(userId) {
  return userId ? `milestone_ai_${userId}_milestones` : 'milestone_ai_guest_milestones';
}

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

// Migrate any legacy pathway_* storage records smoothly into unified Blueprints
function migrateLegacyPathways(userId) {
  const legacyKey = `pathway_${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return null;
    const legacyList = JSON.parse(raw);
    if (!Array.isArray(legacyList) || legacyList.length === 0) {
      localStorage.removeItem(legacyKey);
      return null;
    }

    const existingRoadmaps = getStoredRoadmaps(userId);
    const existingMilestonesMap = getStoredMilestonesMap(userId);

    legacyList.forEach((pw) => {
      if (!pw?.id || existingRoadmaps.some((r) => r.id === pw.id)) return;
      const overview = pw.overview || {};
      const difficultyLower = String(overview.difficulty_level || 'intermediate').toLowerCase();
      const pacing = normalizePacingKey(pw.pacing);

      const roadmapRecord = {
        id: pw.id,
        user_id: pw.userId || userId || 'guest_user',
        title: (overview.ai_title || '').trim() || pw.title || pw.goal || 'Custom Blueprint',
        goal_summary: overview.goal_summary || pw.goal || '',
        difficulty: ['beginner', 'intermediate', 'advanced'].includes(difficultyLower)
          ? difficultyLower
          : 'intermediate',
        duration_months: Number(pw.durationMonths) || 3,
        estimated_duration_weeks:
          overview.estimated_duration_weeks || Math.round((Number(pw.durationMonths) || 3) * 4.33),
        pacing,
        key_outcomes: overview.expected_outcomes || [],
        gemini_model: String(pw.modelUsed || '').includes('pro') ? 'pro' : 'flash',
        ai_model: pw.modelUsed || 'gemini-3.5-flash',
        status: 'active',
        start_date: (pw.createdAt || new Date().toISOString()).slice(0, 10),
        created_at: pw.createdAt || new Date().toISOString(),
      };

      const msList = (pw.milestones || []).map((m, idx) => {
        const msId = generateUUID();
        return {
          id: msId,
          external_id: m.id || `${pw.id}_m${idx + 1}`,
          roadmap_id: pw.id,
          order_index: idx,
          estimated_week_offset: Number(m.estimated_week_offset) || idx + 1,
          title: m.title || `Milestone ${idx + 1}`,
          description: m.description || '',
          learning_objectives: m.learning_objectives || [],
          practical_exercises: m.practical_exercises || [],
          projects: m.projects || [],
          is_completed: m.status === 'Completed',
          is_major: Boolean(m.is_major),
          xp_reward: m.xp_reward || 180,
          deliverables: (m.deliverables || []).map((d, dIdx) => ({
            id: generateUUID(),
            milestone_id: msId,
            title: typeof d === 'string' ? d : d?.title || 'Deliverable',
            is_completed: Boolean(m.checklist?.[dIdx]),
            order_index: dIdx,
          })),
          resources: (m.resources || []).map((r, rIdx) => ({
            id: generateUUID(),
            milestone_id: msId,
            title: r.title || 'Learning Resource',
            description: r.description || '',
            url: sanitizeExternalUrl(r.url) || '',
            type: sanitizeResourceType(r.type),
            is_free: typeof r.is_free === 'boolean' ? r.is_free : true,
            order_index: rIdx,
          })),
        };
      });

      existingRoadmaps.push(roadmapRecord);
      existingMilestonesMap[pw.id] = msList;
    });

    saveLocalRoadmaps(userId, existingRoadmaps, existingMilestonesMap);
    localStorage.removeItem(legacyKey);
    return { roadmaps: existingRoadmaps, milestonesMap: existingMilestonesMap };
  } catch (err) {
    console.warn('Legacy pathway migration notice:', err);
    return null;
  }
}

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

function normalizeDbMilestone(m) {
  const deliverables = [...(m.deliverables || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const resources = [...(m.resources || [])].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  return {
    ...m,
    estimated_week_offset: m.estimated_week_offset || (m.order_index || 0) + 1,
    learning_objectives: Array.isArray(m.learning_objectives) ? m.learning_objectives : [],
    practical_exercises: Array.isArray(m.practical_exercises) ? m.practical_exercises : [],
    projects: Array.isArray(m.projects) ? m.projects : [],
    deliverables,
    resources,
  };
}

export function useRoadmaps() {
  const { user, loading: authLoading } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [milestonesMap, setMilestonesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRoadmaps = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError(null);

    const userId = user?.id || null;

    // Migrate any earlier pathway records seamlessly into Blueprints
    migrateLegacyPathways(userId);

    const localRoadmaps = getStoredRoadmaps(userId);
    const localMilestonesMap = getStoredMilestonesMap(userId);

    const combinedRoadmaps = [...localRoadmaps];
    const combinedMilestonesMap = { ...localMilestonesMap };

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
            dbMilestones.forEach((rawM) => {
              const m = normalizeDbMilestone(rawM);
              if (!combinedMilestonesMap[m.roadmap_id]) {
                combinedMilestonesMap[m.roadmap_id] = [];
              }
              if (!combinedMilestonesMap[m.roadmap_id].some((x) => x.id === m.id)) {
                combinedMilestonesMap[m.roadmap_id].push(m);
              }
            });
          }

          dbRoadmaps.forEach((r) => {
            if (!combinedRoadmaps.some((x) => x.id === r.id)) {
              combinedRoadmaps.push(r);
            }
          });

          // Sort blueprints newest-first
          combinedRoadmaps.sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
        }
      } catch (err) {
        console.warn('Remote Supabase roadmaps fetch notice:', err.message);
      }
    }

    setRoadmaps(combinedRoadmaps);
    setMilestonesMap(combinedMilestonesMap);
    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchRoadmaps();
    }
  }, [authLoading, fetchRoadmaps]);

  // Create and persist a unified Blueprint (local + Supabase Postgres)
  const createRoadmap = async ({
    title,
    goal_summary,
    difficulty = 'intermediate',
    duration_months = 3,
    estimated_duration_weeks,
    pacing = 'weekly',
    key_outcomes = [],
    gemini_model = 'flash',
    ai_model = 'gemini-3.5-flash',
    milestones = [],
  }) => {
    const userId = user?.id || null;
    const newId = generateUUID();
    const resolvedPacing = normalizePacingKey(pacing);
    const resolvedDifficulty = ['beginner', 'intermediate', 'advanced'].includes(
      String(difficulty).toLowerCase()
    )
      ? String(difficulty).toLowerCase()
      : 'intermediate';
    const resolvedDbModel =
      String(ai_model || gemini_model).includes('pro') || gemini_model === 'pro' ? 'pro' : 'flash';
    const resolvedWeeks =
      Number(estimated_duration_weeks) > 0
        ? Math.round(Number(estimated_duration_weeks))
        : Math.round((Number(duration_months) || 3) * 4.33);

    const newRoadmap = {
      id: newId,
      user_id: user?.id || 'guest_user',
      title: (title || '').trim() || 'Custom Learning Blueprint',
      goal_summary: goal_summary || '',
      difficulty: resolvedDifficulty,
      duration_months: Number(duration_months) || 3,
      estimated_duration_weeks: resolvedWeeks,
      pacing: resolvedPacing,
      key_outcomes: key_outcomes || [],
      gemini_model: resolvedDbModel,
      ai_model: ai_model || 'gemini-3.5-flash',
      status: 'active',
      start_date: new Date().toISOString().slice(0, 10),
      target_end_date: new Date(Date.now() + (Number(duration_months) || 3) * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      created_at: new Date().toISOString(),
    };

    // Sort by estimated_week_offset & build relational rows
    const sortedInput = [...(milestones || [])].sort(
      (a, b) => (Number(a?.estimated_week_offset) || 0) - (Number(b?.estimated_week_offset) || 0)
    );

    const formattedMilestones = sortedInput.map((m, idx) => {
      const msId = generateUUID();
      const rawMilestoneId = String(m.id || `m${idx + 1}`).trim();
      const namespacedExternalId = rawMilestoneId.startsWith(`${newId}_`)
        ? rawMilestoneId
        : `${newId}_${rawMilestoneId}`;
      const offset = Number(m.estimated_week_offset) || idx + 1;

      const intervalDays =
        resolvedPacing === 'daily'
          ? 1
          : resolvedPacing === 'every_3_days'
          ? 3
          : resolvedPacing === 'biweekly'
          ? 14
          : resolvedPacing === 'monthly'
          ? 30
          : 7;

      return {
        id: msId,
        external_id: namespacedExternalId,
        roadmap_id: newId,
        order_index: idx,
        estimated_week_offset: offset,
        title: m.title || `Milestone ${idx + 1}`,
        description: m.description || '',
        learning_objectives: Array.isArray(m.learning_objectives) ? m.learning_objectives : [],
        practical_exercises: Array.isArray(m.practical_exercises) ? m.practical_exercises : [],
        projects: Array.isArray(m.projects) ? m.projects : [],
        is_completed: m.status === 'Completed',
        is_major: m.is_major ?? (idx + 1) % 3 === 0,
        due_date: new Date(Date.now() + offset * intervalDays * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        xp_reward: m.xp_reward || 180,
        deliverables: (m.deliverables || []).map((d, dIdx) => ({
          id: generateUUID(),
          milestone_id: msId,
          title: typeof d === 'string' ? d : d.title || 'Complete checkpoint deliverable',
          is_completed: false,
          order_index: dIdx,
        })),
        resources: (m.resources || []).map((r, rIdx) => ({
          id: generateUUID(),
          milestone_id: msId,
          title: r.title || 'Learning Resource',
          description: r.description || '',
          url: sanitizeExternalUrl(r.url) || '',
          type: sanitizeResourceType(r.type),
          is_free: typeof r.is_free === 'boolean' ? r.is_free : true,
          order_index: rIdx,
        })),
      };
    });

    // 1. Persist locally
    const currentStoredRoadmaps = getStoredRoadmaps(userId);
    const currentStoredMilestones = getStoredMilestonesMap(userId);

    saveLocalRoadmaps(
      userId,
      [newRoadmap, ...currentStoredRoadmaps],
      {
        ...currentStoredMilestones,
        [newId]: formattedMilestones,
      }
    );

    setRoadmaps((prev) => [newRoadmap, ...prev.filter((r) => r.id !== newId)]);
    setMilestonesMap((prev) => ({
      ...prev,
      [newId]: formattedMilestones,
    }));

    // 2. Persist cleanly to Supabase Postgres using bulk inserts
    if (isSupabaseConfigured && user) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          display_name: user.display_name || user.email?.split('@')[0] || 'Adventurer',
          avatar_url: user.avatar_url || null,
        });

        const { error: rmError } = await supabase.from('roadmaps').insert({
          id: newId,
          user_id: user.id,
          title: newRoadmap.title,
          goal_summary: newRoadmap.goal_summary,
          difficulty: newRoadmap.difficulty,
          duration_months: newRoadmap.duration_months,
          estimated_duration_weeks: newRoadmap.estimated_duration_weeks,
          pacing: newRoadmap.pacing,
          key_outcomes: newRoadmap.key_outcomes,
          gemini_model: newRoadmap.gemini_model,
          ai_model: newRoadmap.ai_model,
          status: 'active',
        });

        if (rmError) throw rmError;

        if (formattedMilestones.length > 0) {
          const milestoneRows = formattedMilestones.map((m) => ({
            id: m.id,
            external_id: m.external_id,
            roadmap_id: newId,
            order_index: m.order_index,
            estimated_week_offset: m.estimated_week_offset,
            title: m.title,
            description: m.description,
            learning_objectives: m.learning_objectives,
            practical_exercises: m.practical_exercises,
            projects: m.projects,
            is_completed: m.is_completed,
            is_major: m.is_major,
            due_date: m.due_date,
            xp_reward: m.xp_reward,
          }));

          const { error: msError } = await supabase.from('milestones').insert(milestoneRows);

          if (!msError) {
            const allDeliverables = formattedMilestones.flatMap((m) => m.deliverables);
            const allResources = formattedMilestones.flatMap((m) => m.resources);

            await Promise.all([
              allDeliverables.length > 0
                ? supabase.from('deliverables').insert(
                    allDeliverables.map((d) => ({
                      id: d.id,
                      milestone_id: d.milestone_id,
                      title: d.title,
                      is_completed: d.is_completed,
                      order_index: d.order_index,
                    }))
                  )
                : Promise.resolve(),
              allResources.length > 0
                ? supabase.from('resources').insert(
                    allResources.map((r) => ({
                      id: r.id,
                      milestone_id: r.milestone_id,
                      title: r.title,
                      description: r.description,
                      url: r.url,
                      type: r.type,
                      is_free: r.is_free,
                      order_index: r.order_index,
                    }))
                  )
                : Promise.resolve(),
            ]);
          } else {
            console.warn('Supabase milestones insert notice:', msError.message);
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

    const currentStoredRoadmaps = getStoredRoadmaps(userId).filter((r) => r.id !== roadmapId);
    const currentStoredMilestones = { ...getStoredMilestonesMap(userId) };
    delete currentStoredMilestones[roadmapId];
    saveLocalRoadmaps(userId, currentStoredRoadmaps, currentStoredMilestones);

    try {
      const guestRaw = localStorage.getItem('milestone_ai_guest_roadmaps');
      if (guestRaw) {
        const guestList = JSON.parse(guestRaw).filter((r) => r.id !== roadmapId);
        localStorage.setItem('milestone_ai_guest_roadmaps', JSON.stringify(guestList));
      }
      const guestM = localStorage.getItem('milestone_ai_guest_milestones');
      if (guestM) {
        const gMap = JSON.parse(guestM);
        delete gMap[roadmapId];
        localStorage.setItem('milestone_ai_guest_milestones', JSON.stringify(gMap));
      }
    } catch {
      // Ignore storage error
    }

    setRoadmaps((prev) => prev.filter((r) => r.id !== roadmapId));
    setMilestonesMap((prev) => {
      const copy = { ...prev };
      delete copy[roadmapId];
      return copy;
    });

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
