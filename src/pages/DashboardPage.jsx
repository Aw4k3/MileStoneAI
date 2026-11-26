// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Calendar,
  Map,
  ChevronRight,
  Award,
  Clock,
  Compass,
  Trash2,
  Flag,
  Flame,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import ProgressRing from '../components/common/ProgressRing';
import Spinner from '../components/common/Spinner';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { useRoadmaps } from '../hooks/useRoadmaps';
import { useStats } from '../hooks/useStats';
import { getPacingLabel } from '../lib/constants';

const BADGE_ICONS = {
  first_roadmap: Compass,
  first_complete: Flag,
  streak_7: Flame,
  streak_30: Zap,
  xp_1000: Award,
  quiz_ace: CheckCircle2,
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { roadmaps, milestonesMap, loading: roadmapsLoading, deleteRoadmap } = useRoadmaps();
  const { stats, loading: statsLoading } = useStats();

  const [blueprintToDelete, setBlueprintToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    if (!user) return true;
    return !localStorage.getItem(`milestone_visited_${user.id}`);
  });

  useEffect(() => {
    if (authLoading || !user) return;
    if (!localStorage.getItem(`milestone_visited_${user.id}`)) {
      setIsFirstVisit(true);
    } else {
      setIsFirstVisit(false);
    }
    const t = setTimeout(() => {
      localStorage.setItem(`milestone_visited_${user.id}`, 'true');
    }, 2000);
    return () => clearTimeout(t);
  }, [user, authLoading]);

  let totalMilestonesCount = 0;
  let completedMilestonesCount = 0;

  roadmaps.forEach((rm) => {
    const list = milestonesMap[rm.id] || [];
    totalMilestonesCount += list.length;
    completedMilestonesCount += list.filter((m) => m.is_completed).length;
  });

  const globalCompletion =
    totalMilestonesCount > 0
      ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
      : 0;

  const activeBlueprint = roadmaps.find((r) => r.status === 'active') || roadmaps[0];
  const activeMilestones = activeBlueprint ? milestonesMap[activeBlueprint.id] || [] : [];
  const nextMilestone = activeMilestones.find((m) => !m.is_completed) || activeMilestones[0];
  const nextMilestoneIndex = nextMilestone
    ? activeMilestones.findIndex((m) => m.id === nextMilestone.id) + 1
    : 1;

  const handleConfirmDelete = async () => {
    if (!blueprintToDelete) return;
    try {
      setIsDeleting(true);
      await deleteRoadmap(blueprintToDelete.id);
      setBlueprintToDelete(null);
    } catch (err) {
      console.error('Failed to delete blueprint:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || roadmapsLoading || statsLoading) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-[#7a8296] font-mono">Loading curriculum state…</p>
        </div>
      </Layout>
    );
  }

  const displayName = user?.display_name || 'Learner';

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#eef0f5]">
              Curriculum overview
            </h1>
            <p className="text-xs sm:text-sm text-[#7a8296] mt-1 max-w-xl">
              {isFirstVisit
                ? `${displayName} · Create a structured learning blueprint to begin tracking milestones`
                : `${displayName} · ${roadmaps.filter((r) => r.status === 'active').length} active blueprints synced`}
            </p>
          </div>
          <Link to="/wizard" className="btn-primary self-start sm:self-auto text-xs h-9 px-4">
            <PlusCircle className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            New blueprint
          </Link>
        </div>

        {/* Stat Ledger Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-[#11141c] border border-white/[0.08] rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          <div className="p-5 space-y-1.5 border-r lg:border-r-0 border-white/[0.08]">
            <span className="text-xs font-mono text-[#7a8296] block">Active blueprints</span>
            <p className="text-2xl sm:text-3xl font-medium font-mono tnum text-[#eef0f5]">
              {roadmaps.filter((r) => r.status === 'active').length}
            </p>
          </div>

          <div className="p-5 space-y-1.5">
            <span className="text-xs font-mono text-[#7a8296] block">Current streak</span>
            <p className="text-2xl sm:text-3xl font-medium font-mono tnum text-[#eef0f5]">
              {stats?.current_streak || 0}
              <span className="text-sm text-[#7a8296] ml-1 font-normal">days</span>
            </p>
          </div>

          <div className="p-5 space-y-1.5 border-r lg:border-r-0 border-white/[0.08]">
            <span className="text-xs font-mono text-[#7a8296] block">Total earned</span>
            <p className="text-2xl sm:text-3xl font-medium font-mono tnum text-blue-400">
              {(stats?.total_xp || 0).toLocaleString()}
              <span className="text-sm text-[#7a8296] ml-1.5 font-normal">XP</span>
            </p>
          </div>

          <div className="p-5 flex items-center justify-between gap-3">
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-[#7a8296] block">Milestones</span>
              <p className="text-2xl sm:text-3xl font-medium font-mono tnum text-[#eef0f5]">
                {completedMilestonesCount}
                <span className="text-base text-[#7a8296] font-normal">
                  /{totalMilestonesCount}
                </span>
              </p>
            </div>
            <ProgressRing progress={globalCompletion} size={44} strokeWidth={4} />
          </div>
        </div>

        {/* Active Blueprint Moment */}
        {activeBlueprint && (
          <div className="p-6 rounded-2xl bg-[#11141c] border border-white/[0.12] space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2.5 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Active
                  </span>
                  <span className="text-[#7a8296] tnum">
                    {activeBlueprint.duration_months} mo · {getPacingLabel(activeBlueprint.pacing)}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-medium text-[#eef0f5] tracking-tight">
                  {activeBlueprint.title}
                </h2>

                {nextMilestone && (
                  <p className="text-xs text-[#a3a9b8] flex items-center gap-2 pt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[#7a8296] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    <span className="font-mono text-[#7a8296] tnum">
                      {String(nextMilestoneIndex).padStart(2, '0')}
                    </span>
                    <span className="truncate text-[#eef0f5]">{nextMilestone.title}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
                <Link
                  to={`/roadmap/${activeBlueprint.id}/chat`}
                  className="btn-secondary h-9 px-4 text-xs"
                >
                  AI mentor
                </Link>
                <Link
                  to={`/roadmap/${activeBlueprint.id}`}
                  className="btn-primary h-9 px-4 text-xs"
                >
                  Continue milestone
                </Link>
                <button
                  type="button"
                  onClick={() => setBlueprintToDelete(activeBlueprint)}
                  className="w-9 h-9 rounded-lg border border-white/[0.08] bg-[#0b0d14] hover:bg-rose-500/10 hover:border-rose-500/30 text-[#7a8296] hover:text-[#e5484d] transition-colors flex items-center justify-center"
                  aria-label={`Delete ${activeBlueprint.title}`}
                  title="Delete blueprint"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Signature Architectural Waypoint Rule */}
            {activeMilestones.length > 0 && (
              <div className="pt-4 border-t border-white/[0.08] flex items-center gap-3">
                <span className="font-mono text-[11px] text-[#7a8296] shrink-0 tnum">01</span>
                <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(activeMilestones.length, 24)}, minmax(0, 1fr))` }}>
                  {activeMilestones.slice(0, 24).map((m) => {
                    const isNext = nextMilestone?.id === m.id && !m.is_completed;
                    return (
                      <div
                        key={m.id}
                        title={m.title}
                        className={`h-1.5 rounded-sm ${
                          m.is_completed
                            ? 'bg-[#4cc38a]'
                            : isNext
                            ? 'bg-blue-500'
                            : 'bg-white/[0.08]'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="font-mono text-[11px] text-[#7a8296] shrink-0 tnum">
                  {String(activeMilestones.length).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Blueprints Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#eef0f5] flex items-center gap-2">
              <Map className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
              Blueprints
            </h2>
            <span className="text-xs font-mono text-[#7a8296] tnum">{roadmaps.length} total</span>
          </div>

          {roadmaps.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-5 border border-dashed border-white/[0.12] rounded-xl bg-[#11141c]">
              <div className="w-11 h-11 rounded-lg bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center mx-auto text-[#7a8296]">
                <Compass className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base font-medium text-[#eef0f5]">No blueprints yet</h3>
                <p className="text-xs text-[#7a8296] leading-relaxed">
                  Enter any learning goal to generate a structured course blueprint with real
                  resources, exercises, projects, and an AI mentor.
                </p>
              </div>
              <div>
                <Link to="/wizard" className="btn-primary text-xs h-9 px-5">
                  <PlusCircle className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                  Create first blueprint
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmaps.map((roadmap) => {
                const milestones = milestonesMap[roadmap.id] || [];
                const completedCount = milestones.filter((m) => m.is_completed).length;
                const percent =
                  milestones.length > 0
                    ? Math.round((completedCount / milestones.length) * 100)
                    : 0;

                const difficultyStyles = {
                  beginner: 'bg-emerald-500/10 text-[#4cc38a] border-emerald-500/20',
                  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  advanced: 'bg-rose-500/10 text-[#e5484d] border-rose-500/20',
                };

                return (
                  <div
                    key={roadmap.id}
                    className="p-5 rounded-xl bg-[#11141c] border border-white/[0.08] hover:border-white/[0.18] transition-colors flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 text-[11px] font-mono rounded border ${
                                difficultyStyles[roadmap.difficulty] || difficultyStyles.intermediate
                              }`}
                            >
                              {roadmap.difficulty}
                            </span>
                            <span className="text-xs font-mono text-[#7a8296] flex items-center gap-1.5 tnum">
                              <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                              {roadmap.duration_months} mo · {getPacingLabel(roadmap.pacing)}
                            </span>
                          </div>
                          <Link
                            to={`/roadmap/${roadmap.id}`}
                            className="block text-sm font-medium text-[#eef0f5] group-hover:text-blue-400 transition-colors line-clamp-1"
                          >
                            {roadmap.title}
                          </Link>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setBlueprintToDelete(roadmap)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a8296] hover:text-[#e5484d] hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                            aria-label={`Delete ${roadmap.title}`}
                            title="Delete blueprint"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                          </button>
                          <ProgressRing progress={percent} size={40} strokeWidth={3.5} />
                        </div>
                      </div>

                      <p className="text-xs text-[#7a8296] line-clamp-2 leading-relaxed">
                        {roadmap.goal_summary}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#7a8296]">
                      <span className="flex items-center gap-2 font-mono tnum">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            roadmap.status === 'completed' || (percent === 100 && milestones.length > 0)
                              ? 'bg-[#4cc38a]'
                              : 'bg-blue-400'
                          }`}
                        />
                        {completedCount} of {milestones.length} complete
                      </span>
                      <Link
                        to={`/roadmap/${roadmap.id}`}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        Open
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Verified Badges */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#11141c] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#eef0f5] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
              Verified badges
            </h2>
            <span className="text-xs font-mono text-[#7a8296] tnum">
              {(stats?.badges || []).length} unlocked
            </span>
          </div>

          {(stats?.badges || []).length === 0 ? (
            <p className="text-xs text-[#7a8296] py-2">
              Complete milestones and deliverable checklists to earn verified curriculum badges.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {(stats?.badges || []).map((badge) => {
                const Icon = BADGE_ICONS[badge.slug] || Award;
                return (
                  <div
                    key={badge.slug}
                    className="p-3 rounded-lg bg-[#0b0d14] border border-white/[0.08] flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-[#1a1e28] rounded-lg border border-white/[0.08] flex items-center justify-center text-[#a3a9b8] shrink-0">
                      <Icon className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#eef0f5] truncate">{badge.name}</p>
                      <p className="text-[11px] text-[#7a8296] truncate">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        <DeleteConfirmModal
          isOpen={!!blueprintToDelete}
          onClose={() => setBlueprintToDelete(null)}
          onConfirm={handleConfirmDelete}
          itemTitle={blueprintToDelete?.title || ''}
          itemType="Blueprint"
          isDeleting={isDeleting}
        />
      </div>
    </Layout>
  );
}
