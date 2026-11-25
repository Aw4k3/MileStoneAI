// src/pages/WizardPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Target,
  Calendar,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Brain,
  Pencil,
  Loader2,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Spinner from '../components/common/Spinner';
import { useRoadmaps } from '../hooks/useRoadmaps';
import {
  generateRoadmapWithAI,
  estimateDurationWithAI,
  generateBlueprintTitleWithAI,
} from '../lib/gemini';
import {
  PACING_OPTIONS,
  calculateMilestones,
  getPacingLabel,
} from '../lib/constants';

const STEPS = [
  { id: 0, label: 'Learning Goal', short: '01' },
  { id: 1, label: 'Course Duration', short: '02' },
  { id: 2, label: 'Milestone Frequency', short: '03' },
  { id: 3, label: 'Review & Generate', short: '04' },
];

const DURATION_PRESETS = [1, 3, 6, 12, 24];

const LOADING_TIPS = [
  'Researching courses, tutorials, and official documentation…',
  'Sequencing milestones from fundamentals to hands-on builds…',
  'Designing practical exercises and measurable deliverables…',
  'Finalizing your milestone timeline and resource checklist…',
];

export default function WizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createRoadmap } = useRoadmaps();

  const [step, setStep] = useState(0);

  // Preserved user configuration state across steps and retries
  const [goal, setGoal] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [hasCustomTitle, setHasCustomTitle] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [durationMonths, setDurationMonths] = useState(3);
  const [pacing, setPacing] = useState('weekly');
  const [overloadAutoSwitched, setOverloadAutoSwitched] = useState(false);

  // AI Duration Estimator state
  const [isEstimatingDuration, setIsEstimatingDuration] = useState(false);
  const [aiDurationSuggestion, setAiDurationSuggestion] = useState(null);
  const [estimateError, setEstimateError] = useState('');

  // Compilation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepText, setGenerationStepText] = useState('');
  const [tipIndex, setTipIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const tipTimerRef = useRef(null);
  const lastTitledGoalRef = useRef('');
  const titleAttemptFailedRef = useRef('');
  const hasCustomTitleRef = useRef(false);

  useEffect(() => {
    hasCustomTitleRef.current = hasCustomTitle;
  }, [hasCustomTitle]);

  useEffect(() => {
    const goalParam = searchParams.get('goal');
    if (goalParam && !goal) {
      setGoal(goalParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isGenerating) {
      tipTimerRef.current = setInterval(() => {
        setTipIndex((i) => (i + 1) % LOADING_TIPS.length);
      }, 3000);
    } else {
      clearInterval(tipTimerRef.current);
      setTipIndex(0);
    }
    return () => clearInterval(tipTimerRef.current);
  }, [isGenerating]);

  const fetchAiTitle = useCallback(async (targetGoal, { force = false } = {}) => {
    const clean = String(targetGoal || '').trim();
    if (!clean) return;
    if (!force && (lastTitledGoalRef.current === clean || titleAttemptFailedRef.current === clean)) {
      return;
    }

    lastTitledGoalRef.current = clean;
    titleAttemptFailedRef.current = '';
    setIsGeneratingTitle(true);
    try {
      const aiTitle = await generateBlueprintTitleWithAI({ goal: clean });
      if (aiTitle && !hasCustomTitleRef.current && lastTitledGoalRef.current === clean) {
        setCourseTitle(aiTitle);
      }
    } catch (err) {
      console.warn('Title generation notice:', err.message);
      lastTitledGoalRef.current = '';
      titleAttemptFailedRef.current = clean;
    } finally {
      setIsGeneratingTitle(false);
    }
  }, []);

  // Pre-generate AI Blueprint Title automatically shortly after goal input settles
  useEffect(() => {
    const clean = goal.trim();
    if (clean.length < 8 || hasCustomTitle) return undefined;
    if (lastTitledGoalRef.current === clean || titleAttemptFailedRef.current === clean) {
      return undefined;
    }
    const timer = setTimeout(() => {
      fetchAiTitle(clean);
    }, 900);
    return () => clearTimeout(timer);
  }, [goal, hasCustomTitle, fetchAiTitle]);

  // Trigger AI title once on Review step if not yet attempted (never loops infinitely on error)
  useEffect(() => {
    const clean = goal.trim();
    if (
      step === 3 &&
      clean &&
      !hasCustomTitle &&
      !courseTitle.trim() &&
      !isGeneratingTitle &&
      titleAttemptFailedRef.current !== clean
    ) {
      fetchAiTitle(clean);
    }
  }, [step, goal, hasCustomTitle, courseTitle, isGeneratingTitle, fetchAiTitle]);

  const automatedMilestones = calculateMilestones(durationMonths, pacing);
  const isOverloadRestricted = durationMonths >= 12;

  const handleContinueFromGoal = () => {
    const clean = goal.trim();
    if (!clean) return;
    if (!hasCustomTitle && lastTitledGoalRef.current !== clean) {
      setCourseTitle('');
      fetchAiTitle(clean);
    }
    setStep(1);
  };

  const handleSelectDuration = (months) => {
    const cleanMonths = Math.min(24, Math.max(1, Number(months) || 1));
    setDurationMonths(cleanMonths);
    if (cleanMonths >= 12 && (pacing === 'daily' || pacing === 'every_3_days')) {
      setPacing('weekly');
      setOverloadAutoSwitched(true);
    } else {
      setOverloadAutoSwitched(false);
    }
  };

  const handleSelectPacing = (nextPacing) => {
    const disabled =
      isOverloadRestricted && (nextPacing === 'daily' || nextPacing === 'every_3_days');
    if (disabled) return;
    setPacing(nextPacing);
    setOverloadAutoSwitched(false);
  };

  const handleEstimateDuration = async () => {
    if (!goal.trim()) return;
    setIsEstimatingDuration(true);
    setEstimateError('');
    setAiDurationSuggestion(null);
    try {
      const res = await estimateDurationWithAI({ goal: goal.trim() });
      if (res?.recommended_months) {
        setAiDurationSuggestion(res);
      } else {
        throw new Error('Could not determine duration recommendation.');
      }
    } catch (err) {
      setEstimateError(err.message || 'Unable to estimate duration right now. Please try again.');
    } finally {
      setIsEstimatingDuration(false);
    }
  };

  const applyAiRecommendation = () => {
    if (!aiDurationSuggestion?.recommended_months) return;
    handleSelectDuration(aiDurationSuggestion.recommended_months);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    setGenerationStepText(`Creating your ${automatedMilestones}-milestone course blueprint…`);

    try {
      const aiData = await generateRoadmapWithAI({
        goal: goal.trim(),
        titleOverride: courseTitle.trim(),
        durationMonths,
        pacing,
        milestoneCount: automatedMilestones,
        onProgress: (msg) => setGenerationStepText(msg),
      });

      const finalTitle =
        courseTitle.trim() ||
        (aiData?.overview?.ai_title || '').trim() ||
        aiData?.title ||
        goal.trim();

      const created = await createRoadmap({
        title: finalTitle,
        goal_summary: aiData?.goal_summary || aiData?.overview?.goal_summary || goal.trim(),
        difficulty: aiData?.difficulty || 'intermediate',
        duration_months: durationMonths,
        estimated_duration_weeks: aiData?.estimated_duration_weeks,
        pacing,
        key_outcomes: aiData?.key_outcomes || aiData?.overview?.expected_outcomes || [],
        gemini_model: String(aiData?.model_used || '').includes('pro') ? 'pro' : 'flash',
        ai_model: aiData?.model_used || 'auto',
        milestones: aiData?.milestones || [],
      });

      setIsGenerating(false);
      navigate(`/roadmap/${created.id}`);
    } catch (err) {
      console.error('Blueprint compilation error:', err);
      setIsGenerating(false);
      setErrorMessage(
        err.message || 'Could not generate your blueprint right now. Your settings are saved—please retry.'
      );
    }
  };

  const getDurationContext = (months) => {
    if (months <= 1) return 'Focused Sprint — Fast foundational immersion';
    if (months <= 3) return 'Sprint Track — Intensive, structured skill acquisition';
    if (months <= 6) return 'Standard Track — Balanced proficiency and project builds';
    if (months <= 12) return 'Year-Long Track — Deep competence across real systems';
    return 'Multi-Year Mastery — Comprehensive senior-level depth';
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-2">
        {/* Step Progress Header */}
        <div className="mb-6 pb-4 border-b border-[#1e293b]">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-mono text-slate-400 tnum">
              Step <strong className="text-white">{step + 1}</strong> of {STEPS.length}
            </span>
            <span className="text-slate-300 font-medium">{STEPS[step].label}</span>
          </div>

          <div className="w-full h-1.5 bg-[#0e141f] rounded-full overflow-hidden border border-[#1e293b]">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={false}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-3">
            {STEPS.map((s, idx) => {
              const isPast = step > idx;
              const isCurrent = step === idx;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md text-[11px] font-mono transition-colors ${
                    isCurrent
                      ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30'
                      : isPast
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-[#161f2e] text-slate-500'
                    }`}
                  >
                    {isPast ? '✓' : idx + 1}
                  </span>
                  <span className="truncate hidden sm:inline">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121824] border border-[#242f42] relative shadow-xl">
          <AnimatePresence mode="wait">
            {/* STEP 0: Goal Input */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" aria-hidden="true" />
                    What do you want to master?
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Describe what you want to learn in plain language. We&apos;ll organize real courses, documentation, exercises, and projects around your schedule.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="goal-input" className="block text-xs font-semibold text-slate-300">
                    Learning Goal
                  </label>
                  <textarea
                    id="goal-input"
                    name="goal"
                    rows={4}
                    value={goal}
                    onChange={(e) => {
                      setGoal(e.target.value);
                      if (estimateError) setEstimateError('');
                    }}
                    placeholder="e.g. Learn machine learning with Python, from fundamentals to training and deploying production models…"
                    className="input-field resize-none text-xs sm:text-sm leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Tip: Mention your goal focus or background — AI will automatically create a clean title and curriculum.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#1e293b]">
                  <button
                    type="button"
                    disabled={!goal.trim()}
                    onClick={handleContinueFromGoal}
                    className="btn-primary text-xs py-2.5 px-5 disabled:opacity-50"
                  >
                    Continue to Duration
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Course Duration + AI Estimator */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" aria-hidden="true" />
                    How long do you plan to study?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Pick a duration from 1 to 24 months, or let AI recommend a realistic completion timeframe.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0e141f] border border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      Selected Duration
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-blue-400 font-mono tnum">
                        {durationMonths}
                      </span>
                      <span className="text-base font-semibold text-slate-200">
                        {durationMonths === 1 ? 'Month' : 'Months'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium pt-1">
                      {getDurationContext(durationMonths)}
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    {DURATION_PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectDuration(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                          durationMonths === m
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-[#121824] text-slate-300 border-[#242f42] hover:border-slate-500'
                        }`}
                      >
                        {m} mo
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="duration-slider" className="font-semibold text-slate-300">
                      Duration Slider (1 to 24 Months)
                    </label>
                    <span className="font-mono text-blue-400 font-bold tnum">
                      {durationMonths} {durationMonths === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>
                  <input
                    id="duration-slider"
                    name="duration"
                    type="range"
                    min={1}
                    max={24}
                    value={durationMonths}
                    aria-label="Course duration in months"
                    aria-valuemin={1}
                    aria-valuemax={24}
                    aria-valuenow={durationMonths}
                    onChange={(e) => handleSelectDuration(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-[#0e141f] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono tnum">
                    <span>1 mo</span>
                    <span>6 mo</span>
                    <span>12 mo</span>
                    <span>18 mo</span>
                    <span>24 mo</span>
                  </div>
                </div>

                {/* AI Duration Estimator */}
                {aiDurationSuggestion ? (
                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5 font-mono">
                        <Brain className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                        Recommended Duration: {aiDurationSuggestion.recommended_months}{' '}
                        {aiDurationSuggestion.recommended_months === 1 ? 'Month' : 'Months'}
                      </span>
                      <button
                        type="button"
                        onClick={applyAiRecommendation}
                        className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {aiDurationSuggestion.reasoning}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e141f] border border-[#1e293b] text-xs">
                      <span className="text-slate-300 flex items-center gap-2 font-mono">
                        <Brain className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                        Unsure how long this takes?
                      </span>
                      <button
                        type="button"
                        onClick={handleEstimateDuration}
                        disabled={isEstimatingDuration}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 hover:bg-blue-600/25 font-semibold transition-colors disabled:opacity-50"
                      >
                        {isEstimatingDuration ? 'Estimating…' : 'AI Estimate'}
                      </button>
                    </div>

                    {estimateError && (
                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                        <span className="text-rose-300">{estimateError}</span>
                        <button
                          type="button"
                          onClick={handleEstimateDuration}
                          className="shrink-0 px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    Back to Goal
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-primary text-xs py-2.5 px-5"
                  >
                    Continue to Frequency
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Milestone Frequency + Overload Protection */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" aria-hidden="true" />
                    Study Frequency &amp; Pacing
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Choose your study frequency. Milestones are calculated automatically from your duration and pace.
                  </p>
                </div>

                {(overloadAutoSwitched || isOverloadRestricted) && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-xs text-amber-300 leading-relaxed">
                      {overloadAutoSwitched
                        ? 'Overload Protection: Daily and Every 3 days pacing are disabled for 12+ month blueprints — automatically switched to Weekly.'
                        : 'Overload Protection Active: For durations of 12 months or longer, Every day and Every 3 days pacing are disabled to keep your plan sustainable.'}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono block">
                    Select Study Frequency
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PACING_OPTIONS.map((opt) => {
                      const isDisabled =
                        isOverloadRestricted && (opt.value === 'daily' || opt.value === 'every_3_days');
                      const isSelected = pacing === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectPacing(opt.value)}
                          className={`p-3.5 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/40 shadow-xs'
                              : isDisabled
                              ? 'opacity-40 cursor-not-allowed bg-[#0e141f] border-[#242f42] text-slate-500'
                              : 'bg-[#0e141f] border-[#242f42] text-slate-300 hover:border-slate-500 hover:text-white'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="text-base shrink-0 mt-0.5" aria-hidden="true">
                              {opt.icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-white text-sm">{opt.label}</p>
                                {isDisabled && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                    12+ mo limit
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'border-slate-600 bg-[#121824]'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Milestone Calculation Card */}
                <div className="p-5 rounded-2xl bg-[#0e141f] border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" aria-hidden="true" />
                      <span className="text-xs font-semibold text-blue-300 font-mono uppercase tracking-wider">
                        Calculated Milestone Count
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-500/30">
                      Real-Time Formula
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2.5 pt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tnum">
                      {automatedMilestones}
                    </span>
                    <span className="text-base text-slate-300 font-semibold">Milestones</span>
                  </div>

                  <div className="pt-2 border-t border-[#1e293b] text-xs text-slate-300 leading-relaxed font-mono">
                    <p>
                      <strong className="text-white tnum">{durationMonths} months</strong> &times;{' '}
                      <strong className="text-white">{getPacingLabel(pacing)}</strong> ={' '}
                      <strong className="text-blue-400 tnum">{automatedMilestones} checkpoints</strong>
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1 font-sans">
                      Every milestone includes learning objectives, real courses &amp; docs, practical exercises, projects, and completion checklists.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#1e293b]">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    Back to Duration
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setStep(3);
                    }}
                    className="btn-primary text-xs py-2.5 px-5"
                  >
                    Continue to Review
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Review Your Course Blueprint (Gemini Title + Summary + Clean Generate) */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" aria-hidden="true" />
                    Review Your Course Blueprint
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Review your AI-named blueprint title and schedule below, then generate your roadmap.
                  </p>
                </div>

                {/* AI-Generated Blueprint Title Input */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0e141f] border border-[#1e293b] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="blueprint-title-input"
                      className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                      Blueprint Title
                    </label>
                    {isGeneratingTitle ? (
                      <span className="text-[11px] font-mono text-blue-400 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                        Naming blueprint…
                      </span>
                    ) : hasCustomTitle || !courseTitle.trim() ? (
                      <button
                        type="button"
                        onClick={() => {
                          setHasCustomTitle(false);
                          lastTitledGoalRef.current = '';
                          titleAttemptFailedRef.current = '';
                          setCourseTitle('');
                          fetchAiTitle(goal, { force: true });
                        }}
                        className="text-[11px] font-mono text-blue-400 hover:text-blue-300"
                      >
                        {courseTitle.trim() ? 'Regenerate AI title' : 'Auto-generate title'}
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        AI Generated · Editable
                      </span>
                    )}
                  </div>
                  <input
                    id="blueprint-title-input"
                    type="text"
                    value={courseTitle}
                    onChange={(e) => {
                      setHasCustomTitle(true);
                      setCourseTitle(e.target.value);
                    }}
                    placeholder={
                      isGeneratingTitle
                        ? 'Generating clean title…'
                        : 'Generated automatically if left blank'
                    }
                    className="input-field text-sm font-semibold py-2.5"
                  />
                </div>

                {/* Specification Summary */}
                <div className="p-5 rounded-2xl bg-[#0e141f] border border-[#1e293b] space-y-4 font-mono text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Learning Goal
                    </span>
                    <p className="text-xs text-slate-200 font-sans mt-1 leading-relaxed">
                      {goal}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#1e293b] tnum">
                    <div className="p-3 rounded-xl bg-[#121824] border border-[#242f42]">
                      <span className="text-slate-400 text-[10px] uppercase block">Duration</span>
                      <p className="text-white font-bold text-sm mt-0.5">
                        {durationMonths} {durationMonths === 1 ? 'Month' : 'Months'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#121824] border border-[#242f42]">
                      <span className="text-slate-400 text-[10px] uppercase block">Frequency</span>
                      <p className="text-white font-bold text-sm mt-0.5">{getPacingLabel(pacing)}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#121824] border border-[#242f42]">
                      <span className="text-slate-400 text-[10px] uppercase block">Milestones</span>
                      <p className="text-blue-400 font-bold text-sm mt-0.5">
                        {automatedMilestones} Milestones
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clean Error & Retry Alert (No internal AI model details) */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3" role="alert">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-rose-300">Unable to Compile Blueprint</p>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{errorMessage}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                      Retry
                    </button>
                  </div>
                )}

                {isGenerating ? (
                  <div className="p-8 rounded-2xl bg-[#0e141f] border border-blue-500/30 text-center space-y-3">
                    <Spinner size="lg" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-white">{generationStepText}</p>
                      <p className="text-xs text-blue-300 font-mono">{LOADING_TIPS[tipIndex]}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-4 border-t border-[#1e293b]">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setStep(2);
                      }}
                      className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                      Back to Frequency
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="btn-primary text-xs py-2.5 px-6 font-semibold inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-blue-200" aria-hidden="true" />
                      Generate Complete Blueprint
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
