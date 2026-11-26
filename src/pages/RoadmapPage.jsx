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
  Award,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import ProgressRing from '../components/common/ProgressRing';
import Modal from '../components/common/Modal';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import Spinner from '../components/common/Spinner';
import NotificationOptInBanner, { wasPushPromptDismissed } from '../components/common/NotificationOptInBanner';
import { useAuth } from '../contexts/AuthContext';
import { useRoadmapDetail } from '../hooks/useRoadmapDetail';
import { useRoadmaps } from '../hooks/useRoadmaps';
import { useStats } from '../hooks/useStats';
import { dispatchMilestonePush } from '../lib/pushDispatch';
import {
  generateMicroQuizWithAI,
  rebalanceRoadmapWithAI,
  sanitizeExternalUrl,
} from '../lib/gemini';
import { getMilestoneLabel, getPacingLabel } from '../lib/constants';

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-500/10 text-[#4cc38a] border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  advanced: 'bg-rose-500/10 text-[#e5484d] border-rose-500/20',
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
  const { user } = useAuth();
  const { deleteRoadmap } = useRoadmaps();
  const {
    roadmap,
    milestones,
    loading,
    toggleDeliverable,
    toggleMilestone,
  } = useRoadmapDetail(id);
  const { awardXp } = useStats();
  const [showPushPrompt, setShowPushPrompt] = useState(false);

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
          <p className="text-xs text-[#7a8296] font-mono">Loading blueprint specification…</p>
        </div>
      </Layout>
    );
  }

  if (!roadmap) {
    return (
      <Layout>
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-[#11141c] border border-white/[0.08] flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-medium text-[#eef0f5]">Blueprint not found</h1>
            <p className="text-xs text-[#7a8296] max-w-xs">
              This course blueprint doesn&apos;t exist or may have been removed.
            </p>
          </div>
          <Link to="/dashboard" className="btn-primary text-xs h-9 px-5">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            Back to overview
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
  const activeMilestoneId = milestones.find((m) => !m.is_completed)?.id;

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

  const notifyMilestoneProgress = async (milestoneObj, xpEarned, completionMeta, isQuiz = false) => {
    if (!user || !milestoneObj || !completionMeta?.nextCompleted) return;

    const { completedCount: doneCount, totalCount, allCompleted } = completionMeta;

    if (!wasPushPromptDismissed()) {
      setShowPushPrompt(true);
    }

    dispatchMilestonePush({
      userId: user.id,
      eventKey: `milestone_completed:${milestoneObj.id}`,
      eventType: 'milestone_completed',
      title: isQuiz ? 'Major checkpoint verified' : 'Milestone completed',
      body: `“${milestoneObj.title}” (+${xpEarned} XP · ${doneCount}/${totalCount} verified)`,
      targetUrl: `/roadmap/${roadmap.id}`,
      payload: {
        roadmapId: roadmap.id,
        milestoneId: milestoneObj.id,
        xpEarned,
      },
    });

    if (allCompleted) {
      dispatchMilestonePush({
        userId: user.id,
        eventKey: `blueprint_completed:${roadmap.id}`,
        eventType: 'blueprint_completed',
        title: 'Blueprint 100% completed!',
        body: `All ${totalCount} milestones in “${roadmap.title}” are now verified.`,
        targetUrl: `/roadmap/${roadmap.id}`,
        payload: { roadmapId: roadmap.id, totalMilestones: totalCount },
      });
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
    const completionMeta = await toggleMilestone(milestone.id, milestone.is_completed);

    if (willBeCompleted) {
      const xpEarned = milestone.xp_reward || 100;
      await awardXp(xpEarned, { blueprintCompleted: completionMeta?.allCompleted });
      await notifyMilestoneProgress(milestone, xpEarned, completionMeta, false);
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      setQuizError(`Please answer all ${quizQuestions.length} verification questions.`);
      return;
    }

    if (pendingQuizMilestone) {
      const xpEarned = (pendingQuizMilestone.xp_reward || 200) + 100;
      const completionMeta = await toggleMilestone(pendingQuizMilestone.id, false);
      await awardXp(xpEarned, {
        quizPassed: true,
        blueprintCompleted: completionMeta?.allCompleted,
      });
      await notifyMilestoneProgress(pendingQuizMilestone, xpEarned, completionMeta, true);
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
        res?.message || 'Schedule adapted: remaining milestones redistributed across timeline.'
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
        {/* Back link */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7a8296] hover:text-[#eef0f5] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            Overview
          </Link>
        </div>

        {/* Rebalance Toast */}
        <AnimatePresence>
          {rebalanceToast && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>{rebalanceToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setRebalanceToast('')}
                className="text-xs text-blue-400 font-medium hover:text-[#eef0f5]"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blueprint Overview Panel */}
        <div className="p-6 rounded-2xl bg-[#11141c] border border-white/[0.1] space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs tnum">
                <span className={`px-2 py-0.5 rounded border ${diffClass}`}>
                  {roadmap.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0b0d14] text-[#a3a9b8] border border-white/[0.08] inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                  {estimatedWeeks} weeks ({roadmap.duration_months}{' '}
                  {roadmap.duration_months === 1 ? 'mo' : 'mo'})
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0b0d14] text-[#7a8296] border border-white/[0.08]">
                  {getPacingLabel(roadmap.pacing)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-medium text-[#eef0f5] tracking-tight">
                {roadmap.title}
              </h1>

              <p className="text-xs sm:text-sm text-[#a3a9b8] leading-relaxed">
                {roadmap.goal_summary}
              </p>
            </div>

            {/* Progress Moment */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] shrink-0 self-start">
              <ProgressRing progress={progressPercent} size={60} strokeWidth={4.5} />
              <div className="font-mono">
                <span className="text-xs text-[#7a8296] block">Completion</span>
                <p className="text-xl font-medium text-[#eef0f5] tnum">
                  {completedCount}
                  <span className="text-xs text-[#7a8296] font-normal">/{milestones.length}</span>
                </p>
                <span className="text-[11px] text-[#4cc38a]">verified</span>
              </div>
            </div>
          </div>

          {/* Progress Bar + Ledger Counts */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#7a8296]">Overall progress</span>
                <span className="font-mono text-[#eef0f5] tnum">{progressPercent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#0b0d14] border border-white/[0.08] overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: progressPercent / 100 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full origin-left ${
                    progressPercent === 100 ? 'bg-[#4cc38a]' : 'bg-blue-500'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 bg-[#0b0d14] border border-white/[0.08] rounded-xl divide-x divide-white/[0.08] font-mono">
              <div className="p-3.5 text-center">
                <p className="text-lg font-medium text-[#4cc38a] tnum">{completedCount}</p>
                <p className="text-xs text-[#7a8296]">Completed</p>
              </div>
              <div className="p-3.5 text-center">
                <p className="text-lg font-medium text-blue-400 tnum">{remainingCount}</p>
                <p className="text-xs text-[#7a8296]">Remaining</p>
              </div>
              <div className="p-3.5 text-center">
                <p className="text-lg font-medium text-[#eef0f5] tnum">{milestones.length}</p>
                <p className="text-xs text-[#7a8296]">Total</p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOutcomesModal(true)}
                className="btn-secondary text-xs h-8 px-3"
              >
                <Target className="w-3.5 h-3.5 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                Outcomes ({(roadmap.key_outcomes || []).length})
              </button>

              <button
                type="button"
                onClick={handleRebalance}
                disabled={isRebalancing}
                className="btn-secondary text-xs h-8 px-3 disabled:opacity-50"
                title="Redistribute remaining milestones evenly"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#7a8296] ${isRebalancing ? 'animate-spin' : ''}`}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                {isRebalancing ? 'Adapting…' : 'Rebalance'}
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                className="btn-secondary text-xs h-8 px-3"
                title="Export blueprint to Markdown"
              >
                <Download className="w-3.5 h-3.5 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                Export .md
              </button>

              <button
                type="button"
                onClick={handleExportCalendar}
                className="btn-secondary text-xs h-8 px-3"
                title="Export schedule to iCalendar"
              >
                <Calendar className="w-3.5 h-3.5 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                Sync .ics
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn-secondary text-xs h-8 px-3 text-[#7a8296] hover:text-[#e5484d] hover:border-rose-500/30"
                title="Delete blueprint"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                Delete
              </button>
            </div>

            <Link to={`/roadmap/${roadmap.id}/chat`} className="btn-primary text-xs h-8 px-4">
              <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
              Mentor chat
            </Link>
          </div>
        </div>

        {/* Contextual Notification Opt-In After First Milestone Verification */}
        <NotificationOptInBanner
          visible={showPushPrompt}
          onDismiss={() => setShowPushPrompt(false)}
        />

        {/* Milestone Route Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 gap-2">
            <h2 className="text-sm font-medium text-[#eef0f5] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
              Milestone timeline
              {progressPercent === 100 && milestones.length > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-[#4cc38a] border border-emerald-500/20">
                  Complete
                </span>
              )}
            </h2>
            {milestones.length > 0 && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
              >
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => {
              const isExpanded = Boolean(expandedIds[m.id]);
              const isCurrentTarget = activeMilestoneId === m.id;
              const deliverables = m.deliverables || [];
              const completedDeliverables = deliverables.filter((d) => d.is_completed).length;
              const timeLabel = getMilestoneLabel(
                m.estimated_week_offset || idx + 1,
                roadmap.pacing
              );
              const milestoneIndexStr = String(idx + 1).padStart(2, '0');

              return (
                <div
                  key={m.id}
                  className={`rounded-xl border transition-colors overflow-hidden ${
                    m.is_completed
                      ? 'bg-[#0b0d14] border-emerald-500/25'
                      : isCurrentTarget
                      ? 'bg-[#11141c] border-blue-500/40'
                      : 'bg-[#11141c] border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  {/* Milestone Header (Accessible split controls) */}
                  <div className="p-4 sm:p-5 flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => handleMilestoneToggle(m)}
                      className="mt-0.5 text-[#7a8296] hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded shrink-0"
                      aria-label={
                        m.is_completed ? 'Mark milestone incomplete' : 'Mark milestone complete'
                      }
                    >
                      {m.is_completed ? (
                        <CheckCircle2
                          className="w-5 h-5 text-[#4cc38a]"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedIds((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                      }
                      className="flex-1 min-w-0 text-left flex items-start justify-between gap-3 focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1 font-mono text-xs">
                          <span
                            className={`font-medium tnum ${
                              m.is_completed
                                ? 'text-[#4cc38a]'
                                : isCurrentTarget
                                ? 'text-blue-400'
                                : 'text-[#7a8296]'
                            }`}
                          >
                            {milestoneIndexStr}
                          </span>
                          <span className="text-[#7a8296] tnum">· {timeLabel}</span>
                          {m.is_major && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                              <Brain className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
                              Quiz gate
                            </span>
                          )}
                          <span className="text-xs text-[#7a8296] ml-auto tnum">
                            +{m.xp_reward || 150} XP
                          </span>
                        </div>

                        <h3
                          className={`text-sm sm:text-base font-medium tracking-tight transition-colors ${
                            m.is_completed ? 'line-through text-[#7a8296]' : 'text-[#eef0f5]'
                          }`}
                        >
                          {m.title}
                        </h3>

                        <p className="text-xs text-[#7a8296] mt-1 font-mono tnum">
                          {completedDeliverables} of {deliverables.length} deliverables verified
                        </p>
                      </div>

                      <span className="p-1 text-[#7a8296] hover:text-[#eef0f5] shrink-0 mt-0.5">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                        )}
                      </span>
                    </button>
                  </div>

                  {/* Expanded Guided Module Body */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="px-4 sm:px-5 pb-5 pt-4 border-t border-white/[0.08] space-y-5"
                      >
                        {m.description && (
                          <p className="text-xs sm:text-sm text-[#a3a9b8] leading-relaxed">
                            {m.description}
                          </p>
                        )}

                        {/* 1. Concepts & Objectives */}
                        {m.learning_objectives?.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-mono text-[#7a8296] flex items-center gap-2">
                              <Target className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                              Concepts &amp; objectives
                            </h4>
                            <ul className="space-y-1.5 pl-6">
                              {m.learning_objectives.map((obj, oIdx) => (
                                <li
                                  key={oIdx}
                                  className="list-disc text-xs sm:text-sm text-[#a3a9b8]"
                                >
                                  {obj}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 2. Study Resources */}
                        {(m.resources || []).length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-mono text-[#7a8296] flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                              Course resources
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {m.resources.map((res, rIdx) => {
                                const typeKey = String(res.type || 'course').toLowerCase();
                                const meta = RESOURCE_META[typeKey] || RESOURCE_META.course;
                                const Icon = meta.icon;
                                const isFree = res.is_free !== false;
                                const safeHref = sanitizeExternalUrl(res.url);

                                const inner = (
                                  <div className="flex items-start gap-3 w-full">
                                    <Icon
                                      className="w-4 h-4 text-[#7a8296] shrink-0 mt-0.5"
                                      strokeWidth={1.5}
                                      aria-hidden="true"
                                    />
                                    <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="text-xs font-medium text-[#eef0f5] leading-snug">
                                          {res.title}
                                        </span>
                                        {safeHref && (
                                          <ExternalLink
                                            className="w-3.5 h-3.5 text-[#7a8296] group-hover:text-blue-400 shrink-0 mt-0.5"
                                            strokeWidth={1.5}
                                            aria-hidden="true"
                                          />
                                        )}
                                      </div>
                                      {res.description && (
                                        <p className="text-xs text-[#7a8296] leading-relaxed line-clamp-2">
                                          {res.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 pt-0.5 font-mono text-[11px]">
                                        <span className="text-[#7a8296]">{meta.label}</span>
                                        <span className="text-[#7a8296]">·</span>
                                        <span className={isFree ? 'text-[#4cc38a]' : 'text-amber-400'}>
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
                                    className="p-3.5 rounded-lg bg-[#0b0d14] border border-white/[0.08] hover:border-white/[0.2] group transition-colors flex"
                                  >
                                    {inner}
                                  </a>
                                ) : (
                                  <div
                                    key={rIdx}
                                    className="p-3.5 rounded-lg bg-[#0b0d14] border border-white/[0.08] flex"
                                  >
                                    {inner}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. Practice Exercises */}
                        {m.practical_exercises?.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-mono text-[#7a8296] flex items-center gap-2">
                              <Dumbbell className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                              Practice exercises
                            </h4>
                            <ol className="space-y-1.5">
                              {m.practical_exercises.map((ex, eIdx) => (
                                <li
                                  key={eIdx}
                                  className="flex items-start gap-2.5 text-xs sm:text-sm text-[#a3a9b8]"
                                >
                                  <span className="text-xs font-mono text-[#7a8296] mt-0.5 shrink-0 tnum">
                                    {String(eIdx + 1).padStart(2, '0')}
                                  </span>
                                  <span>{ex}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* 4. Hands-on Projects */}
                        {m.projects?.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-mono text-[#7a8296] flex items-center gap-2">
                              <Hammer className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                              Hands-on projects
                            </h4>
                            <ul className="space-y-2">
                              {m.projects.map((proj, pIdx) => (
                                <li
                                  key={pIdx}
                                  className="p-3 rounded-lg bg-[#0b0d14] border border-white/[0.08] text-xs sm:text-sm text-[#eef0f5] flex items-start gap-2.5"
                                >
                                  <Code className="w-4 h-4 text-[#7a8296] shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden="true" />
                                  <span>{proj}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 5. Deliverables Checklist */}
                        {deliverables.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-mono text-[#7a8296] block">
                              Deliverables
                            </h4>
                            <div className="space-y-1.5">
                              {deliverables.map((del) => (
                                <label
                                  key={del.id}
                                  htmlFor={`del-${del.id}`}
                                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0b0d14] border border-white/[0.08] hover:border-white/[0.18] cursor-pointer text-xs sm:text-sm transition-colors"
                                >
                                  <input
                                    id={`del-${del.id}`}
                                    name={`del-${del.id}`}
                                    type="checkbox"
                                    checked={del.is_completed}
                                    onChange={() =>
                                      toggleDeliverable(m.id, del.id, del.is_completed)
                                    }
                                    className="mt-1 rounded border-white/20 accent-blue-500"
                                  />
                                  <span
                                    className={
                                      del.is_completed
                                        ? 'line-through text-[#7a8296]'
                                        : 'text-[#eef0f5]'
                                    }
                                  >
                                    {del.title}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completion Footer */}
                        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
                          <span className="text-xs font-mono text-[#7a8296] tnum">
                            {completedDeliverables}/{deliverables.length} deliverables verified
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMilestoneToggle(m)}
                            className={`inline-flex items-center gap-2 px-4 h-9 rounded-lg text-xs font-medium border transition-colors ${
                              m.is_completed
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-[#4cc38a] hover:bg-emerald-500/15'
                                : 'btn-primary border-transparent'
                            }`}
                          >
                            {m.is_completed ? (
                              <>
                                <Circle className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                                Mark incomplete
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                                Mark milestone complete
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

        {/* Completion Banner */}
        {progressPercent === 100 && milestones.length > 0 && (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-[#4cc38a] flex items-center justify-center mx-auto">
              <Award className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h3 className="text-base font-medium text-[#eef0f5]">Blueprint complete</h3>
            <p className="text-xs sm:text-sm text-[#a3a9b8]">
              All {milestones.length} milestones in{' '}
              <strong className="text-[#eef0f5] font-medium">{roadmap.title}</strong> are verified.
            </p>
          </div>
        )}
      </div>

      {/* Outcomes Modal */}
      <Modal
        isOpen={showOutcomesModal}
        onClose={() => setShowOutcomesModal(false)}
        title="Expected learning outcomes"
      >
        <div className="space-y-3">
          <p className="text-xs text-[#a3a9b8] leading-relaxed">
            Upon finishing this blueprint, you will have practiced and verified the following capabilities:
          </p>
          <div className="space-y-2">
            {(roadmap.key_outcomes || []).map((outcome, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-[#0b0d14] border border-white/[0.08] text-xs text-[#eef0f5]"
              >
                <span className="font-mono text-[#7a8296] tnum shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span>{outcome}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowOutcomesModal(false)}
              className="btn-primary text-xs h-9 px-4"
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
        title="Milestone verification quiz"
      >
        {quizLoading ? (
          <div className="py-10 text-center space-y-3">
            <Spinner size="md" />
            <p className="text-xs text-[#7a8296] font-mono">
              Generating scenario questions…
            </p>
          </div>
        ) : (
          <form onSubmit={handleQuizSubmit} className="space-y-4">
            <p className="text-xs text-[#a3a9b8]">
              Answer these scenario questions to verify{' '}
              <strong className="text-[#eef0f5] font-medium">{pendingQuizMilestone?.title}</strong>{' '}
              and earn bonus XP.
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
                  className="p-3.5 rounded-lg bg-[#0b0d14] border border-white/[0.08] space-y-2 text-xs"
                >
                  <p className="font-medium text-[#eef0f5]">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-1.5 pl-1">
                    {(q.options || []).map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        htmlFor={`quiz-q-${qIdx}-opt-${oIdx}`}
                        className="flex items-center gap-2 cursor-pointer hover:text-[#eef0f5]"
                      >
                        <input
                          id={`quiz-q-${qIdx}-opt-${oIdx}`}
                          type="radio"
                          name={`quiz-q-${qIdx}`}
                          value={opt}
                          onChange={() => setQuizAnswers({ ...quizAnswers, [qIdx]: opt })}
                          className="accent-blue-500"
                        />
                        <span className="text-[#a3a9b8] text-xs">{opt}</span>
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
                className="btn-secondary text-xs h-9 px-4"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs h-9 px-4">
                Submit &amp; unlock
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Dialog */}
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
