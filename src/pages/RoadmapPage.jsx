// src/pages/RoadmapPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  RefreshCw,
  Download,
  Calendar,
  ExternalLink,
  Target,
  Sparkles,
  BookOpen,
  Video,
  FileText,
  Code,
  Brain,
  Layers,
  Trash2,
  Clock,
  Dumbbell,
  Hammer,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import ProgressRing from '../components/common/ProgressRing';
import Modal from '../components/common/Modal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import Spinner from '../components/common/Spinner';
import { useRoadmapDetail } from '../hooks/useRoadmapDetail';
import { useRoadmaps } from '../hooks/useRoadmaps';
import { useStats } from '../hooks/useStats';
import {
  generateMicroQuizWithAI,
  rebalanceRoadmapWithAI,
  sanitizeExternalUrl,
} from '../lib/gemini';
import { getMilestoneLabel, getPacingLabel } from '../lib/constants';

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  advanced: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const RESOURCE_META = {
  course: { icon: BookOpen, label: 'Course' },
  video: { icon: Video, label: 'Video' },
  docs: { icon: FileText, label: 'Docs' },
  book: { icon: BookOpen, label: 'Book' },
  project: { icon: Code, label: 'Project' },
};

export default function RoadmapPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteRoadmap } = useRoadmaps();
  const {
    roadmap,
    milestones,
    loading,
    toggleDeliverable,
    toggleMilestone,
  } = useRoadmapDetail(id);
  const { awardXp } = useStats();

  const [expandedIds, setExpandedIds] = useState({});
  const [showOutcomesModal, setShowOutcomesModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [pendingQuizMilestone, setPendingQuizMilestone] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizError, setQuizError] = useState('');

  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceToast, setRebalanceToast] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-expand first incomplete milestone once loaded
  useEffect(() => {
    if (milestones.length > 0 && Object.keys(expandedIds).length === 0) {
      const firstIncomplete = milestones.find((m) => !m.is_completed) || milestones[0];
      if (firstIncomplete) {
        setExpandedIds({ [firstIncomplete.id]: true });
      }
    }
  }, [milestones]);

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteRoadmap(roadmap.id);
      setShowDeleteModal(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete blueprint:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 font-mono">Loading blueprint specification…</p>
        </div>
      </Layout>
    );
  }

  if (!roadmap) {
    return (
      <Layout>
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#121824] border border-[#242f42] flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-slate-400" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white">Blueprint Not Found</h1>
            <p className="text-xs text-slate-400 max-w-xs">
              This course blueprint doesn&apos;t exist or may have been deleted.
            </p>
          </div>
          <Link to="/dashboard" className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  const completedCount = milestones.filter((m) => m.is_completed).length;
  const remainingCount = milestones.length - completedCount;
  const progressPercent =
    milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const estimatedWeeks =
    roadmap.estimated_duration_weeks || Math.round((Number(roadmap.duration_months) || 3) * 4.33);
  const diffKey = String(roadmap.difficulty || 'intermediate').toLowerCase();
  const diffClass = DIFFICULTY_STYLES[diffKey] || DIFFICULTY_STYLES.intermediate;
  const allExpanded = milestones.length > 0 && milestones.every((m) => expandedIds[m.id]);

  const toggleExpandAll = () => {
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

  const handleMilestoneToggle = async (milestone) => {
    if (!milestone.is_completed && milestone.is_major) {
      setPendingQuizMilestone(milestone);
      setQuizAnswers({});
      setQuizError('');
      setQuizLoading(true);
      setShowQuizModal(true);

      try {
        const quizData = await generateMicroQuizWithAI({
          milestone_title: milestone.title,
          milestone_description: milestone.description,
        });
        setQuizQuestions(quizData?.questions || []);
      } catch (err) {
        console.error('Quiz generation error:', err);
      } finally {
        setQuizLoading(false);
      }
      return;
    }

    const willBeCompleted = !milestone.is_completed;
    toggleMilestone(milestone.id, milestone.is_completed);

    if (willBeCompleted) {
      awardXp(milestone.xp_reward || 100);
    }
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      setQuizError(`Please answer all ${quizQuestions.length} verification questions.`);
      return;
    }

    if (pendingQuizMilestone) {
      toggleMilestone(pendingQuizMilestone.id, false);
      awardXp((pendingQuizMilestone.xp_reward || 200) + 100);
    }

    setShowQuizModal(false);
    setPendingQuizMilestone(null);
  };

  const handleRebalance = async () => {
    setIsRebalancing(true);
    const incomplete = milestones.filter((m) => !m.is_completed);

    try {
      const res = await rebalanceRoadmapWithAI({
        roadmap_title: roadmap.title,
        remaining_milestones: incomplete,
      });

      setRebalanceToast(
        res?.message || 'Schedule adapted: Remaining milestones redistributed across timeline.'
      );
      setTimeout(() => setRebalanceToast(''), 4500);
    } catch (err) {
      console.error('Rebalance error:', err);
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleExportMarkdown = () => {
    let md = `# ${roadmap.title}\n\n`;
    md += `**Goal:** ${roadmap.goal_summary}\n`;
    md += `**Difficulty:** ${roadmap.difficulty} | **Duration:** ${roadmap.duration_months} Months (~${estimatedWeeks} Weeks) | **Pacing:** ${getPacingLabel(roadmap.pacing)}\n\n`;
    md += `## Expected Learning Outcomes\n`;
    (roadmap.key_outcomes || []).forEach((o) => {
      md += `- [ ] ${o}\n`;
    });
    md += `\n## Milestones Curriculum\n\n`;
    milestones.forEach((m, idx) => {
      const periodLabel = getMilestoneLabel(m.estimated_week_offset || idx + 1, roadmap.pacing);
      md += `### ${periodLabel} · ${m.title} ${m.is_completed ? '(Completed)' : ''}\n`;
      if (m.description) md += `${m.description}\n\n`;
      if (m.learning_objectives?.length > 0) {
        md += `**Learn:**\n`;
        m.learning_objectives.forEach((obj) => {
          md += `- ${obj}\n`;
        });
        md += `\n`;
      }
      if (m.resources?.length > 0) {
        md += `**Watch & Read:**\n`;
        m.resources.forEach((r) => {
          const badge = r.is_free === false ? 'Paid' : 'Free';
          md += `- ${r.url ? `[${r.title}](${r.url})` : r.title} (${r.type} · ${badge})\n`;
        });
        md += `\n`;
      }
      if (m.practical_exercises?.length > 0) {
        md += `**Practice:**\n`;
        m.practical_exercises.forEach((ex, i) => {
          md += `${i + 1}. ${ex}\n`;
        });
        md += `\n`;
      }
      if (m.projects?.length > 0) {
        md += `**Build:**\n`;
        m.projects.forEach((p) => {
          md += `- ${p}\n`;
        });
        md += `\n`;
      }
      if (m.deliverables?.length > 0) {
        md += `**Deliverables:**\n`;
        m.deliverables.forEach((d) => {
          md += `- [${d.is_completed ? 'x' : ' '}] ${d.title}\n`;
        });
      }
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${roadmap.title.toLowerCase().replace(/\s+/g, '-')}-blueprint.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCalendar = () => {
    let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Milestone AI//Blueprint Calendar//EN\nCALSCALE:GREGORIAN\n`;
    milestones.forEach((m, idx) => {
      const targetDate = m.due_date
        ? new Date(m.due_date)
        : new Date(Date.now() + (idx + 1) * 7 * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().replace(/[-:]/g, '').slice(0, 8);
      const label = getMilestoneLabel(m.estimated_week_offset || idx + 1, roadmap.pacing);
      ics += `BEGIN:VEVENT\nSUMMARY:${label}: ${m.title}\nDESCRIPTION:${(m.description || '').replace(/\n/g, ' ')}\nDTSTART;VALUE=DATE:${dateStr}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    ics += `END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${roadmap.title.toLowerCase().replace(/\s+/g, '-')}-calendar.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Breadcrumb */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>

        {/* Rebalance Toast */}
        <AnimatePresence>
          {rebalanceToast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-200 text-xs flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" aria-hidden="true" />
                <span>{rebalanceToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setRebalanceToast('')}
                className="text-xs text-blue-300 font-semibold hover:text-white"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blueprint Overview Card */}
        <div className="p-5 sm:p-7 rounded-2xl bg-[#121824] border border-[#242f42] space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tnum">
                <span className={`px-2.5 py-0.5 rounded-full border font-semibold uppercase ${diffClass}`}>
                  {roadmap.difficulty}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {estimatedWeeks} Weeks ({roadmap.duration_months}{' '}
                  {roadmap.duration_months === 1 ? 'Month' : 'Months'})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#0e141f] text-slate-300 border border-[#1e293b]">
                  {getPacingLabel(roadmap.pacing)}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {roadmap.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {roadmap.goal_summary}
              </p>
            </div>

            {/* Circular Progress Gauge */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#0e141f] border border-[#1e293b] shrink-0 self-start">
              <ProgressRing progress={progressPercent} size={64} strokeWidth={5} />
              <div className="text-left font-mono">
                <span className="text-[11px] text-slate-400 block uppercase">Progress</span>
                <p className="text-lg font-bold text-white tnum">
                  {completedCount}
                  <span className="text-xs text-slate-500 font-normal">/{milestones.length}</span>
                </p>
                <span className="text-[10px] text-emerald-400 font-medium">completed</span>
              </div>
            </div>
          </div>

          {/* Real-Time Progress Bar & Milestone Counters */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Overall Blueprint Completion</span>
                <span className="font-mono font-bold text-white tnum">{progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#0b0f17] border border-[#1e293b] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] text-center">
                <p className="text-lg font-bold text-emerald-400 tnum">{completedCount}</p>
                <p className="text-[11px] text-slate-400">Completed</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] text-center">
                <p className="text-lg font-bold text-blue-400 tnum">{remainingCount}</p>
                <p className="text-[11px] text-slate-400">Remaining</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] text-center">
                <p className="text-lg font-bold text-white tnum">{milestones.length}</p>
                <p className="text-[11px] text-slate-400">Total</p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-4 border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOutcomesModal(true)}
                className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                Expected Outcomes ({(roadmap.key_outcomes || []).length})
              </button>

              <button
                type="button"
                onClick={handleRebalance}
                disabled={isRebalancing}
                className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 disabled:opacity-50"
                title="Redistribute remaining milestones evenly without losing progress"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-amber-400 ${isRebalancing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                {isRebalancing ? 'Adapting…' : 'Adaptive Rebalance'}
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                title="Export complete blueprint to Markdown document"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Export .md
              </button>

              <button
                type="button"
                onClick={handleExportCalendar}
                className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                title="Sync calendar with due dates"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Sync .ics
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                title="Delete this blueprint"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                Delete Blueprint
              </button>
            </div>

            <Link
              to={`/roadmap/${roadmap.id}/chat`}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 font-semibold"
            >
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              Chat with Mentor
            </Link>
          </div>
        </div>

        {/* Milestones Curriculum Timeline */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1 gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" aria-hidden="true" />
              Milestone Timeline
              {progressPercent === 100 && milestones.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Complete!
                </span>
              )}
            </h2>
            {milestones.length > 0 && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
              >
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => {
              const isExpanded = Boolean(expandedIds[m.id]);
              const deliverables = m.deliverables || [];
              const completedDeliverables = deliverables.filter((d) => d.is_completed).length;
              const timeLabel = getMilestoneLabel(
                m.estimated_week_offset || idx + 1,
                roadmap.pacing
              );

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border transition-colors duration-150 overflow-hidden ${
                    m.is_completed
                      ? 'bg-[#0d131d] border-emerald-500/30'
                      : 'bg-[#121824] border-[#242f42] hover:border-[#3b4c68]'
                  }`}
                >
                  {/* Status accent bar */}
                  <div
                    className={`w-full h-0.5 ${m.is_completed ? 'bg-emerald-500' : 'bg-blue-600'}`}
                  />

                  {/* Milestone Card Header */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedIds((prev) => ({ ...prev, [m.id]: !prev[m.id] }));
                      }
                    }}
                    className="p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
                    onClick={() => setExpandedIds((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMilestoneToggle(m);
                      }}
                      className="mt-0.5 text-slate-500 hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                      aria-label={
                        m.is_completed ? 'Mark milestone incomplete' : 'Mark milestone complete'
                      }
                    >
                      {m.is_completed ? (
                        <CheckCircle2
                          className="w-5 h-5 text-emerald-400 fill-emerald-400/10"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle className="w-5 h-5" aria-hidden="true" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1 font-mono text-xs">
                        <span className="text-[11px] text-blue-400 uppercase tracking-wider font-semibold tnum">
                          {timeLabel}
                        </span>
                        <span className="text-[11px] text-slate-500 tnum">
                          · Milestone {String(idx + 1).padStart(2, '0')}
                        </span>
                        {m.is_major && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Brain className="w-3 h-3" aria-hidden="true" />
                            Gated Quiz
                          </span>
                        )}
                        <span className="text-[11px] text-blue-400 ml-auto tnum font-semibold">
                          +{m.xp_reward || 150} XP
                        </span>
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-bold tracking-tight transition-colors ${
                          m.is_completed ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {m.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-mono text-[11px] tnum">
                        {completedDeliverables} of {deliverables.length} deliverables complete
                      </p>
                    </div>

                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-white"
                      aria-label={isExpanded ? 'Collapse milestone details' : 'Expand milestone details'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Guided Mini-Course Body */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#1e293b] space-y-5 overflow-hidden"
                      >
                        {m.description && (
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2">
                            {m.description}
                          </p>
                        )}

                        {/* 1. Learn — Learning Objectives */}
                        {m.learning_objectives?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                              Learn · Concepts &amp; Objectives
                            </h4>
                            <ul className="space-y-1.5">
                              {m.learning_objectives.map((obj, oIdx) => (
                                <li
                                  key={oIdx}
                                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                  <span>{obj}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 2. Watch & Read — Curated Learning Materials */}
                        {(m.resources || []).length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                              Watch &amp; Read · Course Materials
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {m.resources.map((res, rIdx) => {
                                const typeKey = String(res.type || 'course').toLowerCase();
                                const meta = RESOURCE_META[typeKey] || RESOURCE_META.course;
                                const Icon = meta.icon;
                                const isFree = res.is_free !== false;
                                const safeHref = sanitizeExternalUrl(res.url);

                                const inner = (
                                  <div className="flex items-start gap-2.5 w-full">
                                    <Icon
                                      className="w-4 h-4 text-blue-400 shrink-0 mt-0.5"
                                      aria-hidden="true"
                                    />
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white leading-snug">
                                          {res.title}
                                        </span>
                                        {safeHref && (
                                          <ExternalLink
                                            className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0 mt-0.5"
                                            aria-hidden="true"
                                          />
                                        )}
                                      </div>
                                      {res.description && (
                                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                                          {res.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-1.5 pt-0.5">
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161f2e] text-slate-300 border border-[#242f42]">
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
                                  </div>
                                );

                                return safeHref ? (
                                  <a
                                    key={rIdx}
                                    href={safeHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] hover:border-blue-500/40 group transition-colors flex"
                                  >
                                    {inner}
                                  </a>
                                ) : (
                                  <div
                                    key={rIdx}
                                    className="p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] flex"
                                  >
                                    {inner}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. Practice — Guided Exercises */}
                        {m.practical_exercises?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Dumbbell className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                              Practice · Practical Exercises
                            </h4>
                            <ol className="space-y-1.5">
                              {m.practical_exercises.map((ex, eIdx) => (
                                <li
                                  key={eIdx}
                                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300"
                                >
                                  <span className="text-xs font-bold font-mono text-slate-400 mt-0.5 shrink-0 tnum">
                                    {String(eIdx + 1).padStart(2, '0')}.
                                  </span>
                                  <span>{ex}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* 4. Build — Hands-on Projects */}
                        {m.projects?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Hammer className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                              Build · Hands-on Projects
                            </h4>
                            <ul className="space-y-2">
                              {m.projects.map((proj, pIdx) => (
                                <li
                                  key={pIdx}
                                  className="p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] text-xs sm:text-sm text-slate-200 flex items-start gap-2.5"
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
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider block">
                              Deliverables · Completion Checklist
                            </h4>
                            <div className="space-y-1.5">
                              {deliverables.map((del) => (
                                <label
                                  key={del.id}
                                  htmlFor={`del-${del.id}`}
                                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0e141f] border border-[#1e293b] hover:border-[#2d3a4e] cursor-pointer text-xs sm:text-sm transition-colors"
                                >
                                  <input
                                    id={`del-${del.id}`}
                                    name={`del-${del.id}`}
                                    type="checkbox"
                                    checked={del.is_completed}
                                    onChange={() =>
                                      toggleDeliverable(m.id, del.id, del.is_completed)
                                    }
                                    className="mt-1 rounded border-slate-700 text-blue-600 focus:ring-blue-500 accent-blue-600"
                                  />
                                  <span
                                    className={
                                      del.is_completed
                                        ? 'line-through text-slate-500'
                                        : 'text-slate-200'
                                    }
                                  >
                                    {del.title}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bottom Milestone Completion Toggle */}
                        <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between gap-3">
                          <span className="text-xs font-mono text-slate-400">
                            {completedDeliverables}/{deliverables.length} deliverables verified
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMilestoneToggle(m)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                              m.is_completed
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500'
                            }`}
                          >
                            {m.is_completed ? (
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Celebration Banner */}
        {progressPercent === 100 && milestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2"
          >
            <div className="text-3xl" aria-hidden="true">🎉</div>
            <h3 className="text-lg font-bold text-white">Blueprint Complete!</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Congratulations! You&apos;ve completed all {milestones.length} milestones in{' '}
              <strong>{roadmap.title}</strong>.
            </p>
          </motion.div>
        )}
      </div>

      {/* Target Key Outcomes Modal */}
      <Modal
        isOpen={showOutcomesModal}
        onClose={() => setShowOutcomesModal(false)}
        title="Expected Learning Outcomes"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            By completing this blueprint, you will master and independently verify the following capabilities:
          </p>
          <div className="space-y-2">
            {(roadmap.key_outcomes || []).map((outcome, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] text-xs text-slate-200"
              >
                <Target className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{outcome}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowOutcomesModal(false)}
              className="btn-primary text-xs py-2 px-4"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Micro-Quiz Gate Modal */}
      <Modal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        title="Milestone Verification Quiz"
      >
        {quizLoading ? (
          <div className="py-10 text-center space-y-3">
            <Spinner size="md" />
            <p className="text-xs text-slate-400 font-mono">
              Synthesizing verification scenario questions…
            </p>
          </div>
        ) : (
          <form onSubmit={handleQuizSubmit} className="space-y-4">
            <p className="text-xs text-slate-300">
              Answer these short conceptual scenarios to certify mastery of{' '}
              <strong>{pendingQuizMilestone?.title}</strong> and earn bonus XP!
            </p>

            {quizError && (
              <div
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs"
                role="alert"
                aria-live="polite"
              >
                {quizError}
              </div>
            )}

            <div className="space-y-3">
              {quizQuestions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-3.5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-2 text-xs"
                >
                  <p className="font-semibold text-slate-200">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-1.5 pl-1">
                    {(q.options || []).map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        htmlFor={`quiz-q-${qIdx}-opt-${oIdx}`}
                        className="flex items-center gap-2 cursor-pointer hover:text-white"
                      >
                        <input
                          id={`quiz-q-${qIdx}-opt-${oIdx}`}
                          type="radio"
                          name={`quiz-q-${qIdx}`}
                          value={opt}
                          onChange={() => setQuizAnswers({ ...quizAnswers, [qIdx]: opt })}
                          className="accent-blue-600 text-blue-600"
                        />
                        <span className="text-slate-300 text-xs">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuizModal(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-2 px-4">
                Submit Answers &amp; Unlock
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        itemTitle={roadmap?.title || ''}
        itemType="Blueprint"
        isDeleting={isDeleting}
      />
    </Layout>
  );
}
