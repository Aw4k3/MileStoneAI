// src/pages/DashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Target,
  ArrowRight,
  PlusCircle,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Award,
  Clock,
  Database,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import ProgressRing from '../components/common/ProgressRing';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useRoadmaps } from '../hooks/useRoadmaps';
import { useStats } from '../hooks/useStats';

export default function DashboardPage() {
  const { user, isSupabaseConnected } = useAuth();
  const { roadmaps, milestonesMap, loading: roadmapsLoading } = useRoadmaps();
  const { stats, loading: statsLoading } = useStats();

  // Calculate global completion rate across all roadmaps
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

  // Active roadmap for resume blueprint
  const activeBlueprint = roadmaps.find((r) => r.status === 'active') || roadmaps[0];
  const activeMilestones = activeBlueprint ? milestonesMap[activeBlueprint.id] || [] : [];
  const nextMilestone = activeMilestones.find((m) => !m.is_completed) || activeMilestones[0];

  if (roadmapsLoading || statsLoading) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400">Loading your learning blueprints...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Supabase Connection Banner (Shows if running on mock fallback or connected) */}
        {!isSupabaseConnected && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 shrink-0" />
              <span>
                <strong>Local Mock Mode:</strong> Supabase credentials not set in <code className="text-amber-200">.env.local</code>. Using sample data. Add your Supabase keys to enable live cloud persistence!
              </span>
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              Welcome back, {user?.display_name || 'Adventurer'} <span className="animate-pulse">👋</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your adaptive learning journey is on track. Let’s conquer today’s target.
            </p>
          </div>
          <Link
            to="/wizard"
            className="btn-primary inline-flex items-center gap-2 self-start md:self-auto py-2.5 px-4 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Roadmap
          </Link>
        </div>

        {/* Global Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Active Roadmaps */}
          <div className="card p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Active Roadmaps
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-100">
                {roadmaps.filter((r) => r.status === 'active').length}
              </p>
            </div>
          </div>

          {/* Current Streak */}
          <div className="card p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Daily Streak
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-1">
                {stats?.current_streak || 1} <span className="text-xs font-normal text-amber-400">days</span>
              </p>
            </div>
          </div>

          {/* Total XP */}
          <div className="card p-4 sm:p-5 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Learning XP
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-100">
                {(stats?.total_xp || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Global Completion Ring */}
          <div className="card p-4 sm:p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Completion
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-100">
                {completedMilestonesCount}/{totalMilestonesCount}
              </p>
            </div>
            <ProgressRing progress={globalCompletion} size={48} strokeWidth={4} />
          </div>
        </div>

        {/* Resume Active Blueprint Highlight */}
        {activeBlueprint && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 relative overflow-hidden shadow-xl"
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Resume Active Blueprint
                  </span>
                  <span className="text-xs text-slate-400">· {activeBlueprint.pacing}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                  {activeBlueprint.title}
                </h2>
                {nextMilestone && (
                  <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-400">Next milestone:</span>
                    <span className="font-medium text-slate-200 truncate">{nextMilestone.title}</span>
                  </p>
                )}
              </div>

              <Link
                to={`/roadmap/${activeBlueprint.id}`}
                className="btn-primary self-start md:self-auto shrink-0 inline-flex items-center gap-2 py-2.5 px-5 text-sm"
              >
                Continue Learning
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Roadmaps Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Your Blueprints
            </h2>
            <span className="text-xs text-slate-400">
              {roadmaps.length} total blueprinted
            </span>
          </div>

          {roadmaps.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <Target className="w-10 h-10 text-indigo-400 mx-auto" />
              <h3 className="text-base font-semibold text-slate-200">No Roadmaps Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Transform any learning or building goal into an adaptive blueprint.
              </p>
              <Link to="/wizard" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 mt-2">
                <PlusCircle className="w-4 h-4" />
                Create First Blueprint
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

                const difficultyColors = {
                  beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  advanced: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                };

                return (
                  <Link
                    key={roadmap.id}
                    to={`/roadmap/${roadmap.id}`}
                    className="card group hover:border-slate-700 transition-all duration-200 p-5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                                difficultyColors[roadmap.difficulty] || difficultyColors.beginner
                              }`}
                            >
                              {roadmap.difficulty}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {roadmap.duration_months} mo · {roadmap.pacing}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                            {roadmap.title}
                          </h3>
                        </div>
                        <ProgressRing progress={percent} size={50} strokeWidth={4.5} />
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {roadmap.goal_summary}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className={`w-2 h-2 rounded-full ${roadmap.status === 'completed' ? 'bg-emerald-400' : 'bg-indigo-400 animate-pulse'}`} />
                        {completedCount} of {milestones.length} milestones complete
                      </span>
                      <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                        View Blueprint
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Gamification: Badges Showcase */}
        <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Achievement Badges
            </h2>
            <span className="text-xs text-slate-400">
              {(stats?.badges || []).length} unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(stats?.badges || []).map((badge) => (
              <div
                key={badge.slug}
                className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-3"
              >
                <div className="text-2xl shrink-0 p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                  {badge.emoji}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">{badge.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
