// src/pages/WizardPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Pencil,
  Check,
  CheckCircle2,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Spinner from '../components/common/Spinner';
import { useRoadmaps } from '../hooks/useRoadmaps';
import { useStats } from '../hooks/useStats';
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
  { id: 0, label: 'Learning goal', short: '01' },
  { id: 1, label: 'Duration', short: '02' },
  { id: 2, label: 'Frequency', short: '03' },
  { id: 3, label: 'Review', short: '04' },
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
  const { recordBlueprintCreated } = useStats();

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

  // Trigger AI title once on Review step if not yet attempted
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

      await recordBlueprintCreated(finalTitle);
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
    if (months <= 1) return 'Focused sprint — fast foundational immersion';
    if (months <= 3) return 'Sprint track — structured skill acquisition';
    if (months <= 6) return 'Standard track — balanced proficiency and builds';
    if (months <= 12) return 'Year-long track — deep competence across systems';
    return 'Multi-year mastery — comprehensive senior-level depth';
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-2">
        {/* Stepper Header */}
        <div className="mb-6 pb-5 border-b border-white/[0.08]">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-mono text-[#7a8296] tnum">
              Step <span className="text-[#eef0f5]">{String(step + 1).padStart(2, '0')}</span> of{' '}
              {String(STEPS.length).padStart(2, '0')}
            </span>
            <span className="text-[#a3a9b8] font-medium">{STEPS[step].label}</span>
          </div>

          <div className="w-full h-1 bg-[#11141c] rounded-full overflow-hidden border border-white/[0.08]">
            <motion.div
              className="h-full bg-blue-500 origin-left"
              initial={false}
              animate={{ scaleX: (step + 1) / STEPS.length }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {STEPS.map((s, idx) => {
              const isPast = step > idx;
              const isCurrent = step === idx;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs font-mono transition-colors ${
                    isCurrent
                      ? 'bg-[#1a1e28] text-[#eef0f5] border border-white/[0.12]'
                      : isPast
                      ? 'text-[#a3a9b8]'
                      : 'text-[#7a8296]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center text-[11px] shrink-0 tnum ${
                      isCurrent
                        ? 'bg-blue-500 text-white'
                        : isPast
                        ? 'bg-emerald-500/15 text-[#4cc38a]'
                        : 'bg-[#11141c] text-[#7a8296] border border-white/[0.08]'
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3" strokeWidth={2} /> : s.short}
                  </span>
                  <span className="truncate hidden sm:inline font-sans">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Panel */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#11141c] border border-white/[0.1] relative">
          <AnimatePresence mode="wait">
            {/* STEP 0: Goal Input */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-xl sm:text-2xl font-medium text-[#eef0f5] tracking-tight">
                    What do you want to master?
                  </h1>
                  <p className="text-xs sm:text-sm text-[#a3a9b8] mt-1.5">
                    Describe what you want to learn in plain words. Your blueprint will organize real
                    courses, documentation, exercises, and projects around your schedule.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="goal-input" className="block text-xs font-medium text-[#a3a9b8]">
                    Learning goal
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
                    placeholder="e.g. Learn machine learning with Python, from linear algebra to training and deploying production models"
                    className="input-field resize-none text-xs sm:text-sm leading-relaxed"
                  />
                  <p className="text-xs text-[#7a8296]">
                    Include your focus or background — the blueprint title and syllabus adapt automatically.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    disabled={!goal.trim()}
                    onClick={handleContinueFromGoal}
                    className="btn-primary text-xs h-9 px-5 disabled:opacity-45"
                  >
                    Continue to duration
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Duration + Estimator */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-medium text-[#eef0f5] tracking-tight">
                    How long do you plan to study?
                  </h2>
                  <p className="text-xs sm:text-sm text-[#a3a9b8] mt-1.5">
                    Pick a duration from 1 to 24 months, or estimate a realistic completion timeframe.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0b0d14] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-[#7a8296] block">Selected duration</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-medium text-blue-400 font-mono tnum">
                        {durationMonths}
                      </span>
                      <span className="text-base font-medium text-[#eef0f5]">
                        {durationMonths === 1 ? 'Month' : 'Months'}
                      </span>
                    </div>
                    <p className="text-xs text-[#a3a9b8] pt-0.5">{getDurationContext(durationMonths)}</p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    {DURATION_PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectDuration(m)}
                        className={`h-8 px-3 rounded-lg text-xs font-mono border transition-colors tnum ${
                          durationMonths === m
                            ? 'active-step-surface text-[#eef0f5]'
                            : 'bg-[#11141c] text-[#a3a9b8] border-white/[0.08] hover:border-white/[0.2] hover:text-[#eef0f5]'
                        }`}
                      >
                        {m} mo
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="duration-slider" className="font-medium text-[#a3a9b8]">
                      Duration slider (1 to 24 months)
                    </label>
                    <span className="font-mono text-blue-400 tnum">
                      {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
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
                    className="w-full accent-blue-500 h-2 bg-[#0b0d14] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#7a8296] font-mono tnum">
                    <span>1 mo</span>
                    <span>6 mo</span>
                    <span>12 mo</span>
                    <span>18 mo</span>
                    <span>24 mo</span>
                  </div>
                </div>

                {/* Duration Estimator */}
                {aiDurationSuggestion ? (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-blue-400 tnum">
                        Recommended duration · {aiDurationSuggestion.recommended_months}{' '}
                        {aiDurationSuggestion.recommended_months === 1 ? 'month' : 'months'}
                      </span>
                      <button
                        type="button"
                        onClick={applyAiRecommendation}
                        className="h-7 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-xs text-[#a3a9b8] leading-relaxed">
                      {aiDurationSuggestion.reasoning}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] text-xs">
                      <span className="text-[#a3a9b8]">Unsure how many months this scope requires?</span>
                      <button
                        type="button"
                        onClick={handleEstimateDuration}
                        disabled={isEstimatingDuration}
                        className="btn-secondary h-8 px-3 text-xs disabled:opacity-50"
                      >
                        {isEstimatingDuration ? 'Estimating…' : 'Estimate duration'}
                      </button>
                    </div>

                    {estimateError && (
                      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs">
                        <span className="text-rose-300">{estimateError}</span>
                        <button
                          type="button"
                          onClick={handleEstimateDuration}
                          className="shrink-0 h-7 px-3 rounded bg-rose-600 text-white font-medium hover:bg-rose-500"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="btn-secondary text-xs h-9 px-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                    Back to goal
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-primary text-xs h-9 px-5"
                  >
                    Continue to frequency
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Milestone Frequency + Overload Protection */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-medium text-[#eef0f5] tracking-tight">
                    Study frequency and pacing
                  </h2>
                  <p className="text-xs sm:text-sm text-[#a3a9b8] mt-1.5">
                    Choose how often new milestones occur. Checkpoints calculate automatically from duration and cadence.
                  </p>
                </div>

                {(overloadAutoSwitched || isOverloadRestricted) && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden="true" />
                    <p className="text-xs text-amber-300 leading-relaxed">
                      {overloadAutoSwitched
                        ? 'Overload protection: daily and every-3-days pacing are disabled for 12+ month blueprints, switched to Weekly.'
                        : 'Overload protection active: for plans of 12 months or longer, daily and every-3-days pacing are locked to keep the workload sustainable.'}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-medium text-[#a3a9b8] block">
                    Select study cadence
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
                          className={`p-4 rounded-xl border text-left transition-colors flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'active-step-surface text-[#eef0f5]'
                              : isDisabled
                              ? 'opacity-40 cursor-not-allowed bg-[#0b0d14] border-white/[0.06] text-[#7a8296]'
                              : 'bg-[#0b0d14] border-white/[0.08] text-[#a3a9b8] hover:border-white/[0.2] hover:text-[#eef0f5]'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="font-mono text-xs text-blue-400 pt-0.5 w-11 shrink-0 tnum">
                              {opt.rate}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-[#eef0f5] text-sm">{opt.label}</p>
                                {isDisabled && (
                                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                    12+ mo limit
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#7a8296] mt-0.5">{opt.description}</p>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                              isSelected
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'border-white/[0.2] bg-[#11141c]'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Milestone Formula Ledger */}
                <div className="p-5 rounded-xl bg-[#0b0d14] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-mono text-[#7a8296]">Calculated milestone count</span>
                    <span className="text-xs font-mono text-[#7a8296] tnum">
                      {durationMonths} mo × {getPacingLabel(pacing)}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-medium text-[#eef0f5] font-mono tnum">
                      {automatedMilestones}
                    </span>
                    <span className="text-sm text-[#a3a9b8]">milestones</span>
                  </div>

                  <p className="pt-2 border-t border-white/[0.08] text-xs text-[#7a8296]">
                    Every checkpoint includes learning objectives, curated study resources, practical
                    exercises, projects, and deliverables.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary text-xs h-9 px-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                    Back to duration
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setStep(3);
                    }}
                    className="btn-primary text-xs h-9 px-5"
                  >
                    Continue to review
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Review Your Course Blueprint */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-medium text-[#eef0f5] tracking-tight">
                    Review your course blueprint
                  </h2>
                  <p className="text-xs sm:text-sm text-[#a3a9b8] mt-1.5">
                    Confirm your blueprint title and schedule below before compiling your milestones.
                  </p>
                </div>

                {/* Editable AI Blueprint Title */}
                <div className="p-5 rounded-xl bg-[#0b0d14] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="blueprint-title-input"
                      className="text-xs font-medium text-[#a3a9b8] flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                      Blueprint title
                    </label>
                    {isGeneratingTitle ? (
                      <span className="text-xs font-mono text-blue-400 flex items-center gap-1.5">
                        <Spinner size="sm" />
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
                        className="text-xs font-mono text-blue-400 hover:text-blue-300"
                      >
                        {courseTitle.trim() ? 'Regenerate title' : 'Auto-generate title'}
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-[#7a8296]">Editable</span>
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
                        ? 'Generating title…'
                        : 'Generated automatically if left blank'
                    }
                    className="input-field text-sm font-medium h-10"
                  />
                </div>

                {/* Specification Summary */}
                <div className="p-5 rounded-xl bg-[#0b0d14] border border-white/[0.08] space-y-4">
                  <div>
                    <span className="text-xs font-mono text-[#7a8296] block">Learning goal</span>
                    <p className="text-xs sm:text-sm text-[#eef0f5] mt-1 leading-relaxed">
                      {goal}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.08] tnum">
                    <div className="p-3 rounded-lg bg-[#11141c] border border-white/[0.08]">
                      <span className="text-[#7a8296] text-xs font-mono block">Duration</span>
                      <p className="text-[#eef0f5] font-medium text-sm mt-1">
                        {durationMonths} {durationMonths === 1 ? 'Month' : 'Months'}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#11141c] border border-white/[0.08]">
                      <span className="text-[#7a8296] text-xs font-mono block">Frequency</span>
                      <p className="text-[#eef0f5] font-medium text-sm mt-1">
                        {getPacingLabel(pacing)}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#11141c] border border-white/[0.08]">
                      <span className="text-[#7a8296] text-xs font-mono block">Milestones</span>
                      <p className="text-blue-400 font-medium text-sm mt-1 font-mono">
                        {automatedMilestones} checkpoints
                      </p>
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div
                    className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3"
                    role="alert"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#e5484d] shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-rose-200">Unable to compile blueprint</p>
                      <p className="text-xs text-[#a3a9b8] mt-1 leading-relaxed">{errorMessage}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-500"
                    >
                      <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                      Retry
                    </button>
                  </div>
                )}

                {isGenerating ? (
                  <div className="p-8 rounded-xl bg-[#0b0d14] border border-white/[0.1] text-center space-y-3">
                    <Spinner size="lg" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-[#eef0f5]">{generationStepText}</p>
                      <p className="text-xs text-[#7a8296] font-mono">{LOADING_TIPS[tipIndex]}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-4 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setStep(2);
                      }}
                      className="btn-secondary text-xs h-9 px-4"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                      Back to frequency
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="btn-primary text-xs h-10 px-6"
                    >
                      <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                      Generate complete blueprint
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
