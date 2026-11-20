// src/pages/RoadmapPage.jsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Award,
  Layers,
  Share2,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import ProgressRing from '../components/common/ProgressRing';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { useRoadmapDetail } from '../hooks/useRoadmapDetail';
import { useStats } from '../hooks/useStats';
import {
  generateMicroQuizWithAI,
  rebalanceRoadmapWithAI,
} from '../lib/gemini';

export default function RoadmapPage() {
  const { id } = useParams();
  const {
    roadmap,
    milestones,
    loading,
    toggleDeliverable,
    toggleMilestone,
  } = useRoadmapDetail(id);
  const { awardXp } = useStats();

  // Expanded milestone accordion states
  const [expandedId, setExpandedId] = useState(null);

  // Outcomes Modal State
  const [showOutcomesModal, setShowOutcomesModal] = useState(false);

  // Micro-Quiz Gate Modal State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [pendingQuizMilestone, setPendingQuizMilestone] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizError, setQuizError] = useState('');

  // Rebalance toast simulation
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceToast, setRebalanceToast] = useState('');

  // Auto-expand first incomplete milestone when loaded
  React.useEffect(() => {
    if (milestones.length > 0 && expandedId === null) {
      const firstIncomplete = milestones.find((m) => !m.is_completed) || milestones[0];
      setExpandedId(firstIncomplete.id);
    }
  }, [milestones, expandedId]);

  if (loading || !roadmap) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400">Loading blueprint details...</p>
        </div>
      </Layout>
    );
  }

  // Calculate dynamic progress
  const completedCount = milestones.filter((m) => m.is_completed).length;
  const progressPercent = milestones.length > 0
    ? Math.round((completedCount / milestones.length) * 100)
    : 0;

  // Toggle milestone completion (Triggers Micro-Quiz if milestone is major)
  const handleMilestoneToggle = async (milestone) => {
    // If completing a major milestone that isn't complete yet -> trigger Quiz Gate!
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

    // Direct toggle
    const willBeCompleted = !milestone.is_completed;
    toggleMilestone(milestone.id, milestone.is_completed);

    if (willBeCompleted) {
      awardXp(milestone.xp_reward || 100);
    }
  };

  // Submit Micro-Quiz
  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      setQuizError(`Please answer all ${quizQuestions.length} verification questions.`);
      return;
    }

    if (pendingQuizMilestone) {
      toggleMilestone(pendingQuizMilestone.id, false);
      awardXp((pendingQuizMilestone.xp_reward || 200) + 100); // bonus quiz XP
    }

    setShowQuizModal(false);
    setPendingQuizMilestone(null);
  };

  // Adaptive Rebalance Schedule Action
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

  // Export to Markdown
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

  // Export to .ics Calendar format
  const handleExportCalendar = () => {
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Milestone AI//Adaptive Learning Blueprints//EN',
      'CALSCALE:GREGORIAN',
    ];

    milestones.forEach((m, idx) => {
      const now = new Date();
      const dueDate = new Date(now.getTime() + (idx + 1) * 7 * 24 * 60 * 60 * 1000);
      const dateStr = dueDate.toISOString().slice(0, 10).replace(/-/g, '');

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:milestone-${m.id}@milestoneai.dev`);
      ics.push(`DTSTAMP:${now.toISOString().slice(0, 10).replace(/-/g, '')}T090000Z`);
      ics.push(`DTSTART;VALUE=DATE:${dateStr}`);
      ics.push(`SUMMARY:🎯 Milestone: ${m.title}`);
      ics.push(`DESCRIPTION:${(m.description || '').replace(/\n/g, ' ')}`);
      ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');

    const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
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
        {/* Rebalance Toast Notice */}
        <AnimatePresence>
          {rebalanceToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{rebalanceToast}</span>
              </div>
              <button
                onClick={() => setRebalanceToast('')}
                className="text-xs text-indigo-300 font-bold hover:text-white"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roadmap Blueprint Header Card */}
        <div className="card p-5 sm:p-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {roadmap.difficulty}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {roadmap.duration_months} Months Timeline
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {roadmap.pacing} Pacing
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                {roadmap.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {roadmap.goal_summary}
              </p>
            </div>

            {/* Circular Progress Display */}
            <div className="flex items-center gap-4 self-center md:self-start shrink-0 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <ProgressRing progress={progressPercent} size={74} strokeWidth={6} />
              <div className="text-left">
                <p className="text-xs text-slate-400 font-medium">Blueprint Progress</p>
                <p className="text-lg font-bold text-slate-100">
                  {completedCount} <span className="text-xs font-normal text-slate-400">of</span> {milestones.length}
                </p>
                <p className="text-[11px] text-indigo-400 font-medium">milestones completed</p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Key Outcomes Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowOutcomesModal(true)}
                className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Key Target Outcomes
              </button>

              {/* Adaptive Rebalance Button */}
              <button
                type="button"
                onClick={handleRebalance}
                disabled={isRebalancing}
                className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5 disabled:opacity-50"
                title="Redistribute remaining milestones evenly without losing completed progress"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRebalancing ? 'animate-spin' : ''}`} />
                {isRebalancing ? 'Rebalancing with AI...' : 'Adaptive Rebalance'}
              </button>

              {/* Export Markdown */}
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                title="Export complete roadmap to Markdown document"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                Export .md
              </button>

              {/* Export Calendar (.ics) */}
              <button
                type="button"
                onClick={handleExportCalendar}
                className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                title="Download iCalendar file to sync milestone due dates with Apple / Google Calendar"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Sync .ics
              </button>
            </div>

            {/* Launch AI Mentor Chat Link */}
            <Link
              to={`/roadmap/${roadmap.id}/chat`}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with Guardrailed Mentor
            </Link>
          </div>
        </div>

        {/* Milestones List */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Curriculum Milestones
            </h2>
            <span className="text-xs text-slate-400">
              Click checkboxes to update your progress
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
                  className={`card transition-all duration-200 overflow-hidden ${
                    m.is_completed ? 'border-slate-800/60 bg-slate-900/40' : 'hover:border-slate-700'
                  }`}
                >
                  {/* Milestone Card Summary Header */}
                  <div
                    className="p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  >
                    {/* Completion Checkbox Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMilestoneToggle(m);
                      }}
                      className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors"
                      aria-label="Toggle milestone completion"
                    >
                      {m.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-5 h-5 hover:text-indigo-400" />
                      )}
                    </button>

                    {/* Milestone Title & Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Milestone {idx + 1}
                        </span>
                        {m.is_major && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            Gated Micro-Quiz
                          </span>
                        )}
                        <span className="text-[11px] text-indigo-400 font-medium ml-auto">
                          +{m.xp_reward} XP
                        </span>
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-bold tracking-tight transition-colors ${
                          m.is_completed ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {m.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {completedDeliverables} of {deliverables.length} deliverables checked
                      </p>
                    </div>

                    {/* Expand/Collapse Chevron */}
                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Expanded Content Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-800/80 space-y-4"
                      >
                        {/* Description */}
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                          {m.description}
                        </p>

                        {/* Deliverables Checklist */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Required Deliverables Checklist
                          </p>
                          <div className="space-y-1.5">
                            {deliverables.map((del) => (
                              <label
                                key={del.id}
                                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer text-xs transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={del.is_completed}
                                  onChange={() => toggleDeliverable(m.id, del.id, del.is_completed)}
                                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                                />
                                <span className={del.is_completed ? 'line-through text-slate-400' : 'text-slate-200'}>
                                  {del.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Curated Resources */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Curated Learning Resources
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(m.resources || []).map((res) => {
                              const ResIcon = getResourceIcon(res.type);
                              return (
                                <a
                                  key={res.id}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-xs flex items-center justify-between gap-2 transition-all group"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <ResIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                                    <span className="text-slate-200 font-medium truncate group-hover:text-indigo-300">
                                      {res.title}
                                    </span>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0 group-hover:text-slate-300" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Outcomes Modal */}
        <Modal
          isOpen={showOutcomesModal}
          onClose={() => setShowOutcomesModal(false)}
          title="Key Target Outcomes"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Upon successful completion of this blueprint, you will have demonstrably achieved:
            </p>
            <div className="space-y-2.5">
              {(roadmap.key_outcomes || []).map((outcome, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs sm:text-sm text-slate-200"
                >
                  <Target className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOutcomesModal(false)}
                className="btn-primary text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>

        {/* Gated Micro-Quiz Modal */}
        <Modal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          title="Major Milestone AI Gate Quiz 🧠"
        >
          {quizLoading ? (
            <div className="p-8 text-center space-y-3">
              <Spinner size="md" />
              <p className="text-xs text-slate-400">
                Generating verification questions for "{pendingQuizMilestone?.title}"...
              </p>
            </div>
          ) : (
            <form onSubmit={handleQuizSubmit} className="space-y-5">
              <p className="text-xs text-slate-400">
                Before marking this major milestone complete and collecting XP, pass this verification
                quiz curated by Gemini AI to test genuine conceptual retention.
              </p>

              {quizError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {quizError}
                </div>
              )}

              {quizQuestions.map((q, idx) => (
                <div key={q.id || idx} className="space-y-2">
                  <p className="text-xs font-semibold text-slate-200">
                    {idx + 1}. {q.question}
                  </p>
                  <div className="space-y-1">
                    {q.options.map((opt, oIdx) => (
                      <label
                        key={oIdx}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer text-xs text-slate-300"
                      >
                        <input
                          type="radio"
                          name={`quiz-${q.id || idx}`}
                          onChange={() =>
                            setQuizAnswers((p) => ({ ...p, [q.id || idx]: oIdx }))
                          }
                          className="accent-indigo-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Review Material First
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-4"
                >
                  Submit Answers & Complete (+XP)
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
