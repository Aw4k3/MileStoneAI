// src/pages/PathwayCompilerPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Clock,
  Zap,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Target,
  BookOpen,
  BarChart3,
  Cpu,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  DEFAULT_PATHWAY_MODEL,
  PATHWAY_MODELS,
  calculateMilestoneCount,
  estimatePathwayDuration,
  compilePathwayWithAI,
  buildPathwayRecord,
} from '../lib/pathway';
import { usePathways } from '../hooks/usePathways';

const PACING_OPTIONS = [
  { value: 'daily', label: 'Every day', description: '30 milestones / month', icon: '🔥' },
  { value: 'every3days', label: 'Every 3 days', description: '10 milestones / month', icon: '⚡' },
  { value: 'weekly', label: 'Weekly', description: '4 milestones / month', icon: '📅' },
  { value: 'biweekly', label: 'Every 2 weeks', description: '2 milestones / month', icon: '🗓️' },
  { value: 'monthly', label: 'Monthly', description: '1 milestone / month', icon: '🌙' },
];

const DURATION_OPTIONS = [1, 3, 6, 12, 24];

const GOAL_TEMPLATES = [
  { label: 'Python for Data Science', icon: '🐍' },
  { label: 'Full-Stack Web Development', icon: '💻' },
  { label: 'Machine Learning Fundamentals', icon: '🤖' },
  { label: 'Mobile App Development with React Native', icon: '📱' },
  { label: 'DevOps & Cloud Engineering', icon: '☁️' },
  { label: 'UI/UX Design Fundamentals', icon: '🎨' },
];

const LOADING_TIPS = [
  'Researching authoritative courses and official docs…',
  'Structuring progressive milestone sequence…',
  'Designing practical exercises and drills…',
  'Matching hands-on build projects to deliverables…',
  'Validating pathway structure and resource quality…',
];

function getPacingLabel(value) {
  return PACING_OPTIONS.find((p) => p.value === value)?.label || value;
}

export default function PathwayCompilerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addPathway } = usePathways();

  // Step: 0 = configure, 1 = confirm & compile
  const [step, setStep] = useState(0);

  // User inputs (preserved on errors and step transitions)
  const [goal, setGoal] = useState('');
  const [durationMonths, setDurationMonths] = useState(3);
  const [pacing, setPacing] = useState('weekly');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_PATHWAY_MODEL);
  const [overloadAutoSwitched, setOverloadAutoSwitched] = useState(false);

  // AI duration estimate state
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateResult, setEstimateResult] = useState(null);
  const [estimateError, setEstimateError] = useState('');

  // Compilation state
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState('');
  const [error, setError] = useState('');

  // Loading tip rotation
  const [tipIndex, setTipIndex] = useState(0);
  const tipIntervalRef = useRef(null);

  useEffect(() => {
    if (isCompiling) {
      tipIntervalRef.current = setInterval(() => {
        setTipIndex((i) => (i + 1) % LOADING_TIPS.length);
      }, 3000);
    } else {
      clearInterval(tipIntervalRef.current);
      setTipIndex(0);
    }
    return () => clearInterval(tipIntervalRef.current);
  }, [isCompiling]);

  const milestoneCount = calculateMilestoneCount(durationMonths, pacing);
  const isOverloadRestricted = durationMonths >= 12;

  const handleSelectDuration = (months) => {
    setDurationMonths(months);
    if (months >= 12 && (pacing === 'daily' || pacing === 'every3days')) {
      setPacing('weekly');
      setOverloadAutoSwitched(true);
    } else {
      setOverloadAutoSwitched(false);
    }
  };

  const handleSelectPacing = (nextPacing) => {
    const disabled = isOverloadRestricted && (nextPacing === 'daily' || nextPacing === 'every3days');
    if (disabled) return;
    setPacing(nextPacing);
    setOverloadAutoSwitched(false);
  };

  const handleEstimate = async () => {
    if (!goal.trim()) return;
    setIsEstimating(true);
    setEstimateError('');
    setEstimateResult(null);
    try {
      const result = await estimatePathwayDuration({
        goal: goal.trim(),
        model: selectedModel,
      });
      setEstimateResult(result);
    } catch (err) {
      setEstimateError(err.message || 'Could not reach AI duration estimator. Please try again.');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleApplyEstimate = () => {
    if (!estimateResult) return;
    const months = Math.min(24, Math.max(1, Number(estimateResult.recommended_months) || 3));
    const matched = DURATION_OPTIONS.includes(months)
      ? months
      : DURATION_OPTIONS.reduce((prev, curr) =>
          Math.abs(curr - months) < Math.abs(prev - months) ? curr : prev
        );
    handleSelectDuration(matched);
  };

  const handleCompile = async (overrideModel = null) => {
    const modelToUse = overrideModel || selectedModel;
    if (overrideModel) {
      setSelectedModel(overrideModel);
    }

    setIsCompiling(true);
    setError('');
    setCompileStatus(`Compiling with ${modelToUse}…`);

    try {
      const count = calculateMilestoneCount(durationMonths, pacing);
      const compiled = await compilePathwayWithAI({
        goal: goal.trim(),
        durationMonths,
        pacing,
        milestoneCount: count,
        model: modelToUse,
        onProgress: (msg) => setCompileStatus(msg),
      });

      const pathway = buildPathwayRecord({
        userId: user?.id || null,
        goal: goal.trim(),
        durationMonths,
        pacing,
        milestoneCount: count,
        modelUsed: compiled?.model_used || modelToUse,
        compiled,
      });

      addPathway(pathway);
      navigate(`/pathway/${pathway.id}`);
    } catch (err) {
      setError(err.message || 'Failed to compile pathway. Your inputs are preserved—please retry or switch model.');
      setIsCompiling(false);
      setCompileStatus('');
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
  };

  if (isCompiling) {
    return (
      <Layout>
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0f17] px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-7 max-w-md w-full text-center"
          >
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-blue-400 border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-8 h-8 text-blue-400" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-white">AI is Compiling Your Pathway</h2>
              <p className="text-slate-400 text-sm">
                Building <strong className="text-white">{milestoneCount}</strong> structured milestones with real resources…
              </p>
              {compileStatus && (
                <p className="text-xs font-mono text-blue-400 pt-1">{compileStatus}</p>
              )}
            </div>

            <div className="w-full bg-[#121824] border border-[#242f42] rounded-xl p-4 min-h-[60px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="text-blue-300 text-sm font-medium"
                >
                  {LOADING_TIPS[tipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex gap-1.5">
              {LOADING_TIPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === tipIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-4 px-2 sm:px-0">
        {/* Back link & Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 space-y-4"
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">AI Pathway Compiler</h1>
              <p className="text-slate-400 text-sm">
                Turn any learning goal into a structured curriculum with curated real resources
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-1">
            {['Configure Goal & Pace', 'Review & Compile'].map((label, i) => (
              <React.Fragment key={label}>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    step === i
                      ? 'bg-blue-600 text-white'
                      : i < step
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#121824] border border-[#242f42] text-slate-400'
                  }`}
                >
                  {i < step ? (
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                  )}
                  {label}
                </div>
                {i < 1 && <div className="flex-1 h-px bg-[#242f42]" />}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 0 — Goal & Configuration */}
          {step === 0 && (
            <motion.div key="step0" {...cardVariants} className="space-y-5">
              {/* 1. Goal Input & Templates */}
              <div className="bg-[#121824] border border-[#242f42] rounded-2xl p-5 sm:p-6">
                <label
                  htmlFor="pathway-goal-input"
                  className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2"
                >
                  <Target className="w-4 h-4 text-blue-400" aria-hidden="true" />
                  What do you want to learn?
                </label>
                <textarea
                  id="pathway-goal-input"
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value);
                    if (estimateError) setEstimateError('');
                  }}
                  placeholder="e.g. Machine learning with Python, from fundamentals to deploying production models…"
                  rows={3}
                  className="w-full bg-[#0b0f17] border border-[#242f42] rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />

                <div className="mt-4">
                  <p className="text-[11px] text-slate-400 mb-2 font-mono uppercase tracking-wider">
                    Quick-Start Templates
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_TEMPLATES.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => {
                          setGoal(t.label);
                          setEstimateResult(null);
                          setEstimateError('');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          goal === t.label
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                            : 'bg-[#0b0f17] border-[#242f42] text-slate-300 hover:border-blue-500/40 hover:text-white'
                        }`}
                      >
                        <span aria-hidden="true">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Duration Selector + AI Estimator */}
              <div className="bg-[#121824] border border-[#242f42] rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    Available Learning Duration
                  </label>
                  <span className="text-xs font-mono text-slate-400">{durationMonths} months</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {DURATION_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectDuration(m)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        durationMonths === m
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                          : 'bg-[#0b0f17] border-[#242f42] text-slate-300 hover:border-blue-500/40 hover:text-white'
                      }`}
                    >
                      {m} mo
                    </button>
                  ))}
                </div>

                {/* AI Estimate button & output */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleEstimate}
                    disabled={!goal.trim() || isEstimating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 hover:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isEstimating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Brain className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {isEstimating ? 'Analyzing Goal Complexity…' : 'AI Estimate Realistic Duration'}
                  </button>

                  <AnimatePresence>
                    {estimateResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-blue-300">
                                AI Recommends: {estimateResult.recommended_months}{' '}
                                {estimateResult.recommended_months === 1 ? 'Month' : 'Months'}
                              </p>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {estimateResult.reasoning}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleApplyEstimate}
                              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {estimateError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs">
                          <span className="text-rose-300">{estimateError}</span>
                          <button
                            type="button"
                            onClick={handleEstimate}
                            className="shrink-0 px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500"
                          >
                            Retry
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 3. Pacing Selector + Real-time Milestone Calculation */}
              <div className="bg-[#121824] border border-[#242f42] rounded-2xl p-5 sm:p-6">
                <label className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" aria-hidden="true" />
                  Study Frequency &amp; Pacing
                </label>

                <AnimatePresence>
                  {(overloadAutoSwitched || isOverloadRestricted) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <p className="text-xs text-amber-300 leading-relaxed">
                          {overloadAutoSwitched
                            ? 'Overload Protection: High-frequency daily/3-day pacing is disabled for 12+ month pathways — automatically switched to Weekly.'
                            : 'Overload Protection Active: Plans of 12 months or longer disable Daily and Every 3 Days pacing to prevent burnout.'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PACING_OPTIONS.map((opt) => {
                    const isDisabled =
                      isOverloadRestricted && (opt.value === 'daily' || opt.value === 'every3days');
                    const isSelected = pacing === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSelectPacing(opt.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500/60 text-white'
                            : isDisabled
                            ? 'opacity-40 cursor-not-allowed bg-[#0b0f17] border-[#242f42] text-slate-500'
                            : 'bg-[#0b0f17] border-[#242f42] text-slate-300 hover:border-blue-500/40 hover:text-white cursor-pointer'
                        }`}
                      >
                        <span className="text-lg shrink-0" aria-hidden="true">{opt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${isSelected ? 'text-blue-300' : ''}`}>
                              {opt.label}
                            </p>
                            {isDisabled && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                12+ mo locked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{opt.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Milestone Count Display */}
                <div className="mt-4 flex items-center justify-between gap-3 p-3.5 bg-blue-500/10 border border-blue-500/25 rounded-xl">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-blue-400 shrink-0" aria-hidden="true" />
                    <div>
                      <span className="text-2xl font-bold text-blue-400 font-mono tnum">
                        {milestoneCount}
                      </span>
                      <span className="text-slate-300 text-sm ml-2">
                        structured milestones will be generated
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-blue-300 hidden sm:inline">
                    {durationMonths} mo × {getPacingLabel(pacing)}
                  </span>
                </div>
              </div>

              {/* 4. Gemini Model Selector (default: gemini-2.5-flash) */}
              <div className="bg-[#121824] border border-[#242f42] rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    Gemini AI Engine
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">Auto-failover enabled</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PATHWAY_MODELS.map((m) => {
                    const active = selectedModel === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setSelectedModel(m.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-blue-600/15 border-blue-500/60 text-white'
                            : 'bg-[#0b0f17] border-[#242f42] text-slate-300 hover:border-blue-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{m.label}</span>
                          <span className="text-[10px] font-mono text-blue-400">{m.value}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{m.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <motion.button
                type="button"
                onClick={() => {
                  setError('');
                  setStep(1);
                }}
                disabled={!goal.trim()}
                whileHover={goal.trim() ? { scale: 1.01 } : {}}
                whileTap={goal.trim() ? { scale: 0.99 } : {}}
                className="w-full btn-primary py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20"
              >
                Review Pathway Configuration
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </motion.button>
            </motion.div>
          )}

          {/* STEP 1 — Review & Compile */}
          {step === 1 && (
            <motion.div key="step1" {...cardVariants} className="space-y-5">
              {/* Summary card */}
              <div className="bg-[#121824] border border-[#242f42] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    Pathway Blueprint Summary
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {selectedModel}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Learning Goal
                  </p>
                  <p className="text-white font-medium leading-relaxed">{goal}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0b0f17] rounded-xl p-3.5 text-center border border-[#242f42]">
                    <p className="text-2xl font-bold text-blue-400 font-mono tnum">{durationMonths}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {durationMonths === 1 ? 'month' : 'months'}
                    </p>
                  </div>
                  <div className="bg-[#0b0f17] rounded-xl p-3.5 text-center border border-[#242f42] flex flex-col justify-center">
                    <p className="text-sm font-bold text-blue-300">{getPacingLabel(pacing)}</p>
                    <p className="text-xs text-slate-400 mt-1">frequency</p>
                  </div>
                  <div className="bg-[#0b0f17] rounded-xl p-3.5 text-center border border-[#242f42]">
                    <p className="text-2xl font-bold text-emerald-400 font-mono tnum">{milestoneCount}</p>
                    <p className="text-xs text-slate-400 mt-1">milestones</p>
                  </div>
                </div>
              </div>

              {/* Error state + Retry + Model Switcher */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <div className="flex-1">
                          <p className="text-sm text-rose-300 font-semibold mb-1">Compilation Error</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCompile()}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                          Retry
                        </button>
                      </div>

                      <div className="pt-2 border-t border-rose-500/20 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
                          Or switch model &amp; retry:
                        </span>
                        {PATHWAY_MODELS.filter((m) => m.value !== selectedModel).map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => handleCompile(m.value)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#0b0f17] border border-[#242f42] text-slate-200 hover:border-blue-500/50 hover:text-blue-300 transition-colors"
                          >
                            Try {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(0);
                    setError('');
                  }}
                  className="btn-secondary px-5 py-3 text-sm font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  Edit Settings
                </button>

                <motion.button
                  type="button"
                  onClick={() => handleCompile()}
                  disabled={isCompiling}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 btn-primary py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20"
                >
                  {isCompiling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Compiling…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      Compile {milestoneCount}-Milestone Pathway
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-center text-xs text-slate-400">
                Supports up to 90s deep research &amp; resource curation — your configuration is safely preserved if an error occurs.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
