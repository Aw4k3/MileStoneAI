// src/pages/RoadmapPage.jsx
import React, { useState } from 'react';
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
} from '../lib/gemini';

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

  const [expandedId, setExpandedId] = useState(null);
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

  React.useEffect(() => {
    if (milestones.length > 0 && expandedId === null) {
      const firstIncomplete = milestones.find((m) => !m.is_completed) || milestones[0];
      setExpandedId(firstIncomplete.id);
    }
  }, [milestones, expandedId]);

  if (loading || !roadmap) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 font-mono">Loading curriculum specification…</p>
        </div>
      </Layout>
    );
  }

  const completedCount = milestones.filter((m) => m.is_completed).length;
  const progressPercent = milestones.length > 0
    ? Math.round((completedCount / milestones.length) * 100)
    : 0;

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

      setRebalanceToast(res?.message || 'Schedule adapted: Remaining milestones redistributed across timeline.');
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
    md += `**Difficulty:** ${roadmap.difficulty} | **Duration:** ${roadmap.duration_months} Months | **Pacing:** ${roadmap.pacing}\n\n`;
    md += `## Target Key Outcomes\n`;
    (roadmap.key_outcomes || []).forEach((o) => {
      md += `- [ ] ${o}\n`;
    });
    md += `\n## Milestones Curriculum\n\n`;
    milestones.forEach((m, idx) => {
      md += `### ${idx + 1}. ${m.title} ${m.is_completed ? '(Completed)' : ''}\n`;
      md += `${m.description}\n\n`;
      md += `**Deliverables:**\n`;
      (m.deliverables || []).forEach((d) => {
        md += `- [${d.is_completed ? 'x' : ' '}] ${d.title}\n`;
      });
      md += `\n**Curated Resources:**\n`;
      (m.resources || []).forEach((r) => {
        md += `- [${r.title}](${r.url}) (${r.type})\n`;
      });
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
    let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Milestone AI//Roadmap Calendar//EN\nCALSCALE:GREGORIAN\n`;
    milestones.forEach((m, idx) => {
      const now = new Date();
      const targetDate = new Date(now.getTime() + (idx + 1) * 7 * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().replace(/[-:]/g, '').slice(0, 8);
      ics += `BEGIN:VEVENT\nSUMMARY:Milestone ${idx + 1}: ${m.title}\nDESCRIPTION:${m.description.replace(/\n/g, ' ')}\nDTSTART;VALUE=DATE:${dateStr}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
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

  const getResourceIcon = (type) => {
    switch (type) {
      case 'course': return BookOpen;
      case 'video': return Video;
      case 'docs': return FileText;
      case 'project': return Code;
      default: return BookOpen;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
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
                onClick={() => setRebalanceToast('')}
                className="text-xs text-blue-300 font-semibold hover:text-white"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blueprint Overview Header Card */}
        <div className="p-5 sm:p-7 rounded-2xl bg-[#121824] border border-[#242f42] space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tnum">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold uppercase">
                  {roadmap.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0e141f] text-slate-300 border border-[#1e293b]">
                  {roadmap.duration_months} Months
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0e141f] text-slate-300 border border-[#1e293b] capitalize">
                  {roadmap.pacing}
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
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] shrink-0 self-start">
              <ProgressRing progress={progressPercent} size={64} strokeWidth={5} />
              <div className="text-left font-mono">
                <span className="text-[11px] text-slate-400 block uppercase">Progress</span>
                <p className="text-lg font-bold text-white tnum">
                  {completedCount}<span className="text-xs text-slate-500 font-normal">/{milestones.length}</span>
                </p>
                <span className="text-[10px] text-emerald-400 font-medium">completed</span>
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
                Key Target Outcomes
              </button>

              <button
                type="button"
                onClick={handleRebalance}
                disabled={isRebalancing}
                className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 disabled:opacity-50"
                title="Redistribute remaining milestones evenly without losing progress"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRebalancing ? 'animate-spin' : ''}`} aria-hidden="true" />
                {isRebalancing ? 'Adapting…' : 'Adaptive Rebalance'}
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
                title="Export complete roadmap to Markdown document"
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

        {/* Milestones Curriculum Sequence */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" aria-hidden="true" />
              Curriculum Milestones
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Check deliverables to advance progress
            </span>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => {
              const isExpanded = expandedId === m.id;
              const deliverables = m.deliverables || [];
              const completedDeliverables = deliverables.filter((d) => d.is_completed).length;

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border transition-colors duration-150 overflow-hidden ${
                    m.is_completed
                      ? 'bg-[#0d131d] border-[#1a2332]'
                      : 'bg-[#121824] border-[#242f42] hover:border-[#3b4c68]'
                  }`}
                >
                  {/* Milestone Card Header */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedId(isExpanded ? null : m.id);
                      }
                    }}
                    className="p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMilestoneToggle(m);
                      }}
                      className="mt-0.5 text-slate-500 hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                      aria-label={m.is_completed ? 'Mark milestone incomplete' : 'Mark milestone complete'}
                    >
                      {m.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/10" aria-hidden="true" />
                      ) : (
                        <Circle className="w-5 h-5" aria-hidden="true" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1 font-mono text-xs">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold tnum">
                          Milestone {String(idx + 1).padStart(2, '0')}
                        </span>
                        {m.is_major && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Brain className="w-3 h-3" aria-hidden="true" />
                            Gated Quiz
                          </span>
                        )}
                        <span className="text-[11px] text-blue-400 ml-auto tnum font-semibold">
                          +{m.xp_reward} XP
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
                      {isExpanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>

                  {/* Expanded Content Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#1e293b] space-y-4"
                      >
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                          {m.description}
                        </p>

                        {/* Deliverables Checklist */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                            Required Deliverables Checklist
                          </span>
                          <div className="space-y-1.5">
                            {deliverables.map((del) => (
                              <label
                                key={del.id}
                                htmlFor={`del-${del.id}`}
                                className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0e141f] border border-[#1e293b] hover:border-[#2d3a4e] cursor-pointer text-xs transition-colors"
                              >
                                <input
                                  id={`del-${del.id}`}
                                  name={`del-${del.id}`}
                                  type="checkbox"
                                  checked={del.is_completed}
                                  onChange={() => toggleDeliverable(m.id, del.id, del.is_completed)}
                                  className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 accent-blue-600"
                                />
                                <span className={del.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                                  {del.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Curated Resources */}
                        {(m.resources || []).length > 0 && (
                          <div className="space-y-2 pt-1">
                            <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                              Curated Learning Resources
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {m.resources.map((res, rIdx) => {
                                const Icon = getResourceIcon(res.type);
                                return (
                                  <a
                                    key={rIdx}
                                    href={res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-lg bg-[#0e141f] border border-[#1e293b] hover:border-blue-500/40 text-xs flex items-center justify-between gap-2 group transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Icon className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                                      <span className="text-slate-300 group-hover:text-white truncate">
                                        {res.title}
                                      </span>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 shrink-0" aria-hidden="true" />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Target Key Outcomes Modal */}
      <Modal
        isOpen={showOutcomesModal}
        onClose={() => setShowOutcomesModal(false)}
        title="Key Target Outcomes"
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
            <p className="text-xs text-slate-400 font-mono">Synthesizing verification scenario questions…</p>
          </div>
        ) : (
          <form onSubmit={handleQuizSubmit} className="space-y-4">
            <p className="text-xs text-slate-300">
              Answer these short conceptual scenarios to certify mastery of <strong>{pendingQuizMilestone?.title}</strong> and earn bonus XP!
            </p>

            {quizError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs" role="alert" aria-live="polite">
                {quizError}
              </div>
            )}

            <div className="space-y-3">
              {quizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="p-3.5 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-2 text-xs">
                  <p className="font-semibold text-slate-200">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-1.5 pl-1">
                    {(q.options || []).map((opt, oIdx) => (
                      <label key={oIdx} htmlFor={`quiz-q-${qIdx}-opt-${oIdx}`} className="flex items-center gap-2 cursor-pointer hover:text-white">
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
              <button
                type="submit"
                className="btn-primary text-xs py-2 px-4"
              >
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
