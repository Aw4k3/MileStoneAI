// src/pages/PathwayRoadmapPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  AlertCircle,
  Trophy,
  Layers,
  Target,
  CheckSquare,
  Hammer,
  Dumbbell,
  Clock,
  Trash2,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import ProgressRing from '../components/common/ProgressRing';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import { usePathways } from '../hooks/usePathways';
import { getMilestoneLabel, sanitizeExternalUrl } from '../lib/pathway';

const RESOURCE_TYPE_META = {
  Course: { icon: '📚', label: 'Course' },
  Video: { icon: '🎥', label: 'Video' },
  Docs: { icon: '📄', label: 'Docs' },
  Book: { icon: '📖', label: 'Book' },
  Project: { icon: '🛠️', label: 'Project' },
};

const DIFFICULTY_COLORS = {
  Beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Advanced: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const PACING_DISPLAY = {
  daily: 'Every day',
  every3days: 'Every 3 days',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
};

function ResourceCard({ resource }) {
  const typeKey =
    Object.keys(RESOURCE_TYPE_META).find(
      (k) => k.toLowerCase() === String(resource.type || 'course').toLowerCase()
    ) || 'Course';
  const meta = RESOURCE_TYPE_META[typeKey];
  const isFree = resource.is_free !== false;
  const safeHref = sanitizeExternalUrl(resource.url);

  const cardInner = (
    <>
      <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
        {meta.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors leading-snug">
            {resource.title}
          </p>
          {safeHref && (
            <ExternalLink
              className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
        </div>
        {resource.description && (
          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
            {resource.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#161f2e] text-slate-300 border border-[#242f42]">
            {meta.label}
          </span>
          <span
            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
              isFree
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isFree ? 'Free' : 'Paid'}
          </span>
        </div>
      </div>
    </>
  );

  if (!safeHref) {
    return (
      <div className="flex items-start gap-3 p-3.5 bg-[#0b0f17] border border-[#242f42] rounded-xl">
        {cardInner}
      </div>
    );
  }

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3.5 bg-[#0b0f17] border border-[#242f42] rounded-xl hover:border-blue-500/50 transition-all group"
    >
      {cardInner}
    </a>
  );
}

function MilestoneCard({
  milestone,
  index,
  pacing,
  pathwayId,
  isExpanded,
  onToggleExpand,
  onToggleMilestone,
  onToggleDeliverable,
}) {
  const isCompleted = milestone.status === 'Completed';
  const label = getMilestoneLabel(milestone.estimated_week_offset || index + 1, pacing);

  const deliverables = milestone.deliverables || [];
  const checkedCount = deliverables.filter((_, i) => Boolean(milestone.checklist?.[i])).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
      className={`rounded-2xl border overflow-hidden transition-colors ${
        isCompleted
          ? 'border-emerald-500/30 bg-[#0d131d]'
          : 'border-[#242f42] bg-[#121824]'
      }`}
    >
      {/* Top status bar */}
      <div
        className={`w-full h-0.5 ${
          isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
        }`}
      />

      {/* Accordion header */}
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={onToggleExpand}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-[#1a2332]/40 transition-colors"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm font-mono ${
            isCompleted
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-blue-600/15 text-blue-400 border border-blue-500/25'
          }`}
        >
          {isCompleted ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold text-blue-400">{label}</span>
            {isCompleted && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                Completed
              </span>
            )}
            {deliverables.length > 0 && (
              <span className="text-[11px] font-mono text-slate-400 tnum">
                · {checkedCount}/{deliverables.length} deliverables
              </span>
            )}
          </div>
          <h3
            className={`text-sm sm:text-base font-bold mt-0.5 ${
              isCompleted ? 'text-slate-400 line-through' : 'text-white'
            }`}
          >
            {milestone.title}
          </h3>
        </div>

        <div className="shrink-0 text-slate-400">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* Expandable structured course body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-[#1e293b]">
              {/* Description */}
              {milestone.description && (
                <p className="pt-4 text-sm text-slate-300 leading-relaxed">
                  {milestone.description}
                </p>
              )}

              {/* 1. Learn — Learning Objectives */}
              {milestone.learning_objectives?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    Learn · Objectives &amp; Concepts
                  </h4>
                  <ul className="space-y-1.5">
                    {milestone.learning_objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 2. Watch & Read — Course Materials */}
              {milestone.resources?.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    Watch &amp; Read · Curated Materials
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {milestone.resources.map((r, i) => (
                      <ResourceCard key={i} resource={r} />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Practice — Practical Exercises */}
              {milestone.practical_exercises?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    Practice · Guided Exercises
                  </h4>
                  <ol className="space-y-1.5">
                    {milestone.practical_exercises.map((ex, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <span className="text-xs font-bold text-slate-400 font-mono mt-0.5 shrink-0 tnum">
                          {String(i + 1).padStart(2, '0')}.
                        </span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* 4. Build — Hands-on Projects */}
              {milestone.projects?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    Build · Hands-on Projects
                  </h4>
                  <ul className="space-y-2">
                    {milestone.projects.map((proj, i) => (
                      <li
                        key={i}
                        className="p-3 rounded-xl bg-[#0b0f17] border border-[#242f42] text-sm text-slate-200 flex items-start gap-2.5"
                      >
                        <span aria-hidden="true">🛠️</span>
                        <span>{proj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5. Deliverables & Completion Checklist */}
              {deliverables.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    Deliverables · Completion Checklist
                  </h4>
                  <ul className="space-y-2">
                    {deliverables.map((deliverable, i) => {
                      const checked = Boolean(milestone.checklist?.[i]);
                      return (
                        <li key={i}>
                          <label className="flex items-start gap-3 cursor-pointer group p-2 rounded-lg hover:bg-[#0b0f17] transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleDeliverable(pathwayId, milestone.id, i)}
                              className="sr-only"
                            />
                            <div
                              className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                checked
                                  ? 'bg-emerald-600 border-emerald-500'
                                  : 'border-slate-500 group-hover:border-blue-500'
                              }`}
                            >
                              {checked && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                                  <path
                                    d="M2 6l3 3 5-5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-sm leading-relaxed transition-colors ${
                                checked ? 'text-slate-400 line-through' : 'text-slate-200 group-hover:text-white'
                              }`}
                            >
                              {deliverable}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Mark Milestone Complete CTA */}
              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-slate-400">
                  {deliverables.length > 0
                    ? `${checkedCount} of ${deliverables.length} checklist items verified`
                    : 'Verify deliverables before marking complete'}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleMilestone(pathwayId, milestone.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <Circle className="w-3.5 h-3.5" aria-hidden="true" />
                      Mark Incomplete
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Mark Milestone Complete
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PathwayRoadmapPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathways, loading, toggleMilestone, toggleDeliverable, removePathway } = usePathways();
  const [outcomesExpanded, setOutcomesExpanded] = useState(true);
  const [expandedIds, setExpandedIds] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const pathway = pathways.find((p) => p.id === id);

  // Expand first incomplete milestone automatically once pathway loads
  useEffect(() => {
    if (pathway?.milestones?.length > 0 && Object.keys(expandedIds).length === 0) {
      const sorted = [...pathway.milestones].sort(
        (a, b) => (a.estimated_week_offset || 0) - (b.estimated_week_offset || 0)
      );
      const firstIncomplete = sorted.find((m) => m.status !== 'Completed') || sorted[0];
      if (firstIncomplete) {
        setExpandedIds({ [firstIncomplete.id]: true });
      }
    }
  }, [pathway]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-t-blue-500 border-blue-500/20 animate-spin" />
            <p className="text-slate-400 text-sm font-mono">Loading compiled pathway…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!pathway) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-[#121824] border border-[#242f42] flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-400" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Pathway Not Found</h2>
            <p className="text-slate-400 text-sm max-w-xs">
              This learning pathway doesn&apos;t exist or may have been deleted.
            </p>
          </div>
          <Link to="/dashboard" className="btn-primary text-sm py-2.5 px-5">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const milestones = [...(pathway.milestones || [])].sort(
    (a, b) => (Number(a.estimated_week_offset) || 0) - (Number(b.estimated_week_offset) || 0)
  );
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'Completed').length;
  const remainingMilestones = totalMilestones - completedMilestones;
  const progressPercent =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const overview = pathway.overview || {};
  const title = (overview.ai_title || '').trim() || pathway.title || pathway.goal;
  const difficulty = overview.difficulty_level || overview.difficulty || 'Intermediate';
  const diffClass = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.Intermediate;
  const estimatedWeeks =
    overview.estimated_duration_weeks || Math.round((pathway.durationMonths || 3) * 4.33);
  const expectedOutcomes = overview.expected_outcomes || [];
  const allExpanded = totalMilestones > 0 && milestones.every((m) => expandedIds[m.id]);

  const handleToggleAll = () => {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next = {};
      milestones.forEach((m) => {
        next[m.id] = true;
      });
      setExpandedIds(next);
    }
  };

  const handleDelete = () => {
    removePathway(pathway.id);
    setShowDeleteModal(false);
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-4 px-2 sm:px-0 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
            Delete Pathway
          </button>
        </div>

        {/* Overview Dashboard Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#121824] border border-[#242f42] rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-center flex-wrap gap-2">
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${diffClass}`}>
                  {difficulty}
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {estimatedWeeks} weeks ({pathway.durationMonths} mo)
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#0b0f17] text-slate-300 border border-[#242f42]">
                  {PACING_DISPLAY[pathway.pacing] || pathway.pacing}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">{title}</h1>

              {overview.goal_summary && (
                <p className="text-sm text-slate-300 leading-relaxed">{overview.goal_summary}</p>
              )}
            </div>

            <div className="shrink-0">
              <ProgressRing progress={progressPercent} size={72} strokeWidth={5} />
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-medium">Overall Pathway Progress</span>
              <span className="text-xs font-bold text-white font-mono tnum">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-[#0b0f17] rounded-full overflow-hidden border border-[#242f42]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full bg-blue-600"
              />
            </div>
          </div>

          {/* Completed / Remaining / Total Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0b0f17] rounded-xl p-3 text-center border border-[#242f42]">
              <p className="text-xl font-bold text-emerald-400 font-mono tnum">{completedMilestones}</p>
              <p className="text-xs text-slate-400 mt-0.5">Completed</p>
            </div>
            <div className="bg-[#0b0f17] rounded-xl p-3 text-center border border-[#242f42]">
              <p className="text-xl font-bold text-blue-400 font-mono tnum">{remainingMilestones}</p>
              <p className="text-xs text-slate-400 mt-0.5">Remaining</p>
            </div>
            <div className="bg-[#0b0f17] rounded-xl p-3 text-center border border-[#242f42]">
              <p className="text-xl font-bold text-white font-mono tnum">{totalMilestones}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total</p>
            </div>
          </div>
        </motion.div>

        {/* Expected Outcomes (Collapsible) */}
        {expectedOutcomes.length > 0 && (
          <div className="bg-[#121824] border border-[#242f42] rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOutcomesExpanded((v) => !v)}
              aria-expanded={outcomesExpanded}
              className="w-full flex items-center justify-between gap-3 p-5 hover:bg-[#1a2332]/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span className="text-sm font-bold text-white">Expected Learning Outcomes</span>
                <span className="text-xs font-mono text-slate-400">({expectedOutcomes.length})</span>
              </div>
              {outcomesExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {outcomesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="px-5 pb-5 space-y-2 border-t border-[#1e293b] pt-4">
                    {expectedOutcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                          {i + 1}
                        </span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Milestone Timeline */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <h2 className="text-base font-bold text-white">Milestone Timeline</h2>
              {progressPercent === 100 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  🎉 Complete!
                </span>
              )}
            </div>

            {totalMilestones > 0 && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
              >
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </button>
            )}
          </div>

          {milestones.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-[#121824] border border-[#242f42] rounded-2xl">
              <Layers className="w-8 h-8 mx-auto mb-3 opacity-40" aria-hidden="true" />
              <p className="text-sm">No milestones found in this pathway.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  index={index}
                  pacing={pathway.pacing}
                  pathwayId={pathway.id}
                  isExpanded={Boolean(expandedIds[milestone.id])}
                  onToggleExpand={() =>
                    setExpandedIds((prev) => ({
                      ...prev,
                      [milestone.id]: !prev[milestone.id],
                    }))
                  }
                  onToggleMilestone={toggleMilestone}
                  onToggleDeliverable={toggleDeliverable}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completion banner */}
        {progressPercent === 100 && totalMilestones > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-2"
          >
            <div className="text-4xl" aria-hidden="true">🎉</div>
            <h3 className="text-lg font-bold text-white">Pathway Complete!</h3>
            <p className="text-sm text-slate-300">
              Congratulations! You&apos;ve completed all {totalMilestones} milestones in this learning journey.
            </p>
          </motion.div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemType="Pathway"
        itemTitle={title}
      />
    </Layout>
  );
}
