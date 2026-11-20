// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Flame,
  Target,
  PlusCircle,
  Calendar,
  Layers,
  ChevronRight,
  Award,
  Clock,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import ProgressRing from '../components/common/ProgressRing';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useRoadmaps } from '../hooks/useRoadmaps';
import { useStats } from '../hooks/useStats';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { roadmaps, milestonesMap, loading: roadmapsLoading } = useRoadmaps();
  const { stats, loading: statsLoading } = useStats();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const visitedKey = user ? `milestone_visited_${user.id}` : null;
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

  const globalCompletion = totalMilestonesCount > 0
    ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
    : 0;

  const activeBlueprint = roadmaps.find((r) => r.status === 'active') || roadmaps[0];
  const activeMilestones = activeBlueprint ? milestonesMap[activeBlueprint.id] || [] : [];
  const nextMilestone = activeMilestones.find((m) => !m.is_completed) || activeMilestones[0];

  if (authLoading || roadmapsLoading || statsLoading) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 font-mono">Loading curriculum state...</p>
        </div>
      </Layout>
    );
  }

  const displayName = user?.display_name || 'Engineer';

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isFirstVisit ? `Welcome, ${displayName}` : `Welcome back, ${displayName}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isFirstVisit
                ? 'Create your first structured blueprint or continue an active milestone.'
                : 'Your curriculum milestones and active mentor context are ready.'}
            </p>
          </div>
          <Link
            to="/wizard"
            className="btn-primary self-start sm:self-auto text-xs py-2 px-4 inline-flex items-center gap-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Blueprint
          </Link>
        </div>

        {/* Unified Command Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#121824] border border-[#242f42] rounded-2xl p-4 sm:p-5">
          <div className="space-y-1 pr-4 border-r border-[#1e293b]/80">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Blueprints</span>
            <p className="text-2xl font-bold font-mono text-white">
              {roadmaps.filter((r) => r.status === 'active').length}
            </p>
          </div>

          <div className="space-y-1 sm:pl-4 lg:pr-4 sm:border-r border-[#1e293b]/80">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Current Streak</span>
            <p className="text-2xl font-bold font-mono text-amber-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
              {stats?.current_streak || 0}d
            </p>
          </div>

          <div className="space-y-1 lg:pl-4 pr-4 border-r border-[#1e293b]/80">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Earned XP</span>
            <p className="text-2xl font-bold font-mono text-blue-400">
              {(stats?.total_xp || 0).toLocaleString()}
            </p>
          </div>

          <div className="space-y-1 pl-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Milestones</span>
              <p className="text-2xl font-bold font-mono text-white">
                {completedMilestonesCount}<span className="text-slate-500 text-base">/{totalMilestonesCount}</span>
              </p>
            </div>
            <ProgressRing progress={globalCompletion} size={44} strokeWidth={4} />
          </div>
        </div>

        {/* Resume Active Blueprint Highlight */}
        {activeBlueprint && (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#131b26] border border-[#2e3d54] flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  Active Blueprint
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {activeBlueprint.duration_months} mo · {activeBlueprint.pacing}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {activeBlueprint.title}
              </h2>
              {nextMilestone && (
                <p className="text-xs text-slate-300 flex items-center gap-2 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-slate-400">Current target:</span>
                  <span className="font-medium text-slate-200 truncate">{nextMilestone.title}</span>
                </p>
              )}
            </div>

            <Link
              to={`/roadmap/${activeBlueprint.id}`}
              className="btn-primary self-start md:self-auto shrink-0 py-2.5 px-5 text-xs font-semibold"
            >
              Continue Milestone
            </Link>
          </div>
        )}

        {/* Roadmaps List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Your Blueprints
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {roadmaps.length} total
            </span>
          </div>

          {roadmaps.length === 0 ? (
            <div className="p-10 sm:p-14 text-center space-y-4 border border-dashed border-[#242f42] rounded-2xl bg-[#0e141f]">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-white">No Blueprints Formulated Yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your goal to generate a sequenced curriculum with verified deliverables and an AI mentor.
                </p>
              </div>
              <Link to="/wizard" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2">
                <PlusCircle className="w-3.5 h-3.5" />
                Formulate Blueprint
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmaps.map((roadmap) => {
                const milestones = milestonesMap[roadmap.id] || [];
                const completedCount = milestones.filter((m) => m.is_completed).length;
                const percent = milestones.length > 0
                  ? Math.round((completedCount / milestones.length) * 100)
                  : 0;

                const difficultyStyles = {
                  beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  advanced: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                };

                return (
                  <Link
                    key={roadmap.id}
                    to={`/roadmap/${roadmap.id}`}
                    className="p-5 rounded-2xl bg-[#121824] border border-[#242f42] hover:border-[#3b4c68] transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded border ${
                                difficultyStyles[roadmap.difficulty] || difficultyStyles.beginner
                              }`}
                            >
                              {roadmap.difficulty}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {roadmap.duration_months} mo · {roadmap.pacing}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {roadmap.title}
                          </h3>
                        </div>
                        <ProgressRing progress={percent} size={44} strokeWidth={4} />
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {roadmap.goal_summary}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${roadmap.status === 'completed' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                        {completedCount} of {milestones.length} milestones complete
                      </span>
                      <span className="text-blue-400 flex items-center gap-0.5 font-medium group-hover:translate-x-0.5 transition-transform">
                        View Plan <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievement Badges Section */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121824] border border-[#242f42] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Verified Badges
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {(stats?.badges || []).length} unlocked
            </span>
          </div>

          {(stats?.badges || []).length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-slate-400">
                Complete milestones and deliverable checklists to earn verified curriculum badges.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(stats?.badges || []).map((badge) => (
                <div
                  key={badge.slug}
                  className="p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] flex items-center gap-3"
                >
                  <div className="text-xl p-1.5 bg-[#161f2e] rounded-lg border border-[#242f42]">
                    {badge.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{badge.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
