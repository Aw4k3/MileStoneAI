// src/pages/WizardPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Target,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
  BookOpen,
  Layers,
  Wand2,
  Check,
  Calendar,
  Clock,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Spinner from '../components/common/Spinner';
import { useRoadmaps } from '../hooks/useRoadmaps';
import {
  generateRoadmapWithAI,
  estimateDurationWithAI,
  suggestTitlesWithAI,
} from '../lib/gemini';
import {
  ROADMAP_TEMPLATES,
  PACING_OPTIONS,
  GEMINI_MODELS,
  DIFFICULTY_LEVELS,
} from '../lib/constants';

const MILESTONE_COUNT_OPTIONS = [4, 6, 8, 10, 12, 16];

export default function WizardPage() {
  const navigate = useNavigate();
  const { createRoadmap } = useRoadmaps();

  // Wizard Step: 0 = Goal & Formal Titles, 1 = Timeline, Pacing & Blueprint Parameters
  const [step, setStep] = useState(0);

  // Form State
  const [goal, setGoal] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [durationMonths, setDurationMonths] = useState(3);
  const [pacing, setPacing] = useState('weekly');
  const [targetMilestones, setTargetMilestones] = useState(8);
  const [geminiModel, setGeminiModel] = useState('pro');

  // AI Formal Title Suggestions State
  const [suggestedTitles, setSuggestedTitles] = useState([]);
  const [isSuggestingTitles, setIsSuggestingTitles] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');

  // AI Duration & Pacing Suggestion State
  const [isEstimatingDuration, setIsEstimatingDuration] = useState(false);
  const [aiDurationSuggestion, setAiDurationSuggestion] = useState(null);

  // AI Generation Loading State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepText, setGenerationStepText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle template selection
  const handleSelectTemplate = (template) => {
    setGoal(template.goal);
    setSelectedTitle(template.title);
    setDifficulty(template.difficulty);
    setDurationMonths(template.duration);
    setSuggestedTitles([]);
  };

  // Run AI Formal Course Title Generator
  const handleSuggestTitles = async () => {
    if (!goal.trim()) return;
    setIsSuggestingTitles(true);
    setErrorMessage('');
    try {
      const res = await suggestTitlesWithAI({ goal: goal.trim() });
      if (res?.titles && Array.isArray(res.titles) && res.titles.length > 0) {
        setSuggestedTitles(res.titles);
      }
    } catch (err) {
      console.warn('AI formal title suggestion notice:', err.message);
    } finally {
      setIsSuggestingTitles(false);
    }
  };

  // Run AI Duration & Pacing Estimation
  const handleEstimateDuration = async () => {
    if (!goal.trim()) return;
    setIsEstimatingDuration(true);
    try {
      const res = await estimateDurationWithAI({ goal, difficulty });
      if (res?.recommended_months) {
        setAiDurationSuggestion(res);
      }
    } catch (err) {
      console.warn('AI duration estimator notice:', err.message);
    } finally {
      setIsEstimatingDuration(false);
    }
  };

  // Apply AI Duration, Pacing & Milestone Count Recommendation
  const applyAiRecommendation = () => {
    if (!aiDurationSuggestion) return;
    if (aiDurationSuggestion.recommended_months) {
      setDurationMonths(aiDurationSuggestion.recommended_months);
    }
    if (aiDurationSuggestion.recommended_pacing) {
      setPacing(aiDurationSuggestion.recommended_pacing);
    }
    if (aiDurationSuggestion.recommended_milestones) {
      setTargetMilestones(aiDurationSuggestion.recommended_milestones);
    }
  };

  // Proceed to Step 1 and trigger AI timeline calibration
  const handleContinueToStep1 = () => {
    setStep(1);
    if (!aiDurationSuggestion) {
      handleEstimateDuration();
    }
  };

  // Overload guardrail: block Daily pacing on plans > 6 months
  const isOverloadBlocked = pacing === 'daily' && durationMonths > 6;

  // Generate complete roadmap with Gemini AI
  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    setGenerationStepText(`Synthesizing blueprint with Gemini ${geminiModel.toUpperCase()}...`);

    let generatedRoadmapId = null;

    try {
      // 1. Live Gemini AI Synthesis via Supabase Proxy (or fallback engine)
      const aiData = await generateRoadmapWithAI({
        goal,
        difficulty,
        duration_months: durationMonths,
        pacing,
        target_milestones: targetMilestones,
        gemini_model: geminiModel,
        model: geminiModel,
      });

      setGenerationStepText(`Generated ${aiData?.milestones?.length || targetMilestones} comprehensive milestones with verified resources...`);

      // 2. Persist using createRoadmap (Hybrid: Supabase + LocalStorage)
      const finalTitle = selectedTitle || aiData?.title || (goal.length > 50 ? `${goal.slice(0, 48)}...` : goal);

      const created = await createRoadmap({
        title: finalTitle,
        goal_summary: aiData?.goal_summary || goal,
        difficulty,
        duration_months: durationMonths,
        pacing,
        key_outcomes: aiData?.key_outcomes || [
          'Master core foundational architecture and mental models',
          'Build, verify, and test decoupled production deliverables',
          'Deploy verified milestone capstones with automated testing',
        ],
        gemini_model: geminiModel,
        milestones: aiData?.milestones || [],
      });

      generatedRoadmapId = created?.id;
      setGenerationStepText('Finalizing roadmap records and deliverables...');

      setTimeout(() => {
        setIsGenerating(false);
        navigate(`/roadmap/${generatedRoadmapId}`);
      }, 400);
    } catch (err) {
      console.error('Roadmap synthesis error:', err);
      // Emergency local fallback to ensure user is never blocked
      try {
        const fallback = await createRoadmap({
          title: selectedTitle || (goal.length > 50 ? `${goal.slice(0, 48)}...` : goal),
          goal_summary: goal,
          difficulty,
          duration_months: durationMonths,
          pacing,
          key_outcomes: ['Master core competencies and project deliverables'],
          gemini_model: geminiModel,
          milestones: [
            {
              title: 'Phase 1: Foundations & Tooling',
              description: 'Initial setup, mental models, and foundational syntax.',
              deliverables: ['Setup development workspace', 'Complete introductory coding exercises'],
              resources: [{ title: 'Official Documentation', url: 'https://developer.mozilla.org', type: 'docs' }],
            },
            {
              title: 'Phase 2: Project Architecture',
              description: 'Build core application features with clean architecture.',
              deliverables: ['Implement primary domain logic', 'Write verification tests'],
              resources: [{ title: 'Clean Architecture Guide', url: 'https://martinfowler.com', type: 'book' }],
            },
          ],
        });

        setIsGenerating(false);
        navigate(`/roadmap/${fallback.id}`);
      } catch (fallbackErr) {
        setIsGenerating(false);
        setErrorMessage('Failed to generate blueprint. Please try again.');
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-2">
        {/* Wizard Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Step {step + 1} of 2</span>
            <span>
              {step === 0 && 'Define Course Objective & AI Title'}
              {step === 1 && 'Timeline, Pacing & Milestone Architecture'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: '50%' }}
              animate={{ width: step === 0 ? '50%' : '100%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Wizard Steps Form */}
        <div className="card p-6 sm:p-8 relative">
          <AnimatePresence mode="wait">
            {/* STEP 0: Goal Input & AI Formal Course Title Generator */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" />
                    What do you want to learn or build?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Describe your objective in natural language. Our Gemini engine will analyze
                    scope, pre-requisites, and synthesize production-grade milestones.
                  </p>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={goal}
                    onChange={(e) => {
                      setGoal(e.target.value);
                      if (selectedTitle && !suggestedTitles.includes(selectedTitle)) {
                        setSelectedTitle('');
                      }
                    }}
                    placeholder="e.g. Master full-stack AI SaaS engineering with Next.js, Stripe subscriptions, and LangChain to build scalable web products..."
                    className="input-field resize-none text-sm leading-relaxed"
                  />
                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400">
                    <span>Be specific about your end deliverable or domain</span>
                    <button
                      type="button"
                      onClick={handleSuggestTitles}
                      disabled={!goal.trim() || isSuggestingTitles}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isSuggestingTitles ? (
                        <>
                          <Spinner size="xs" />
                          <span>Generating Formal Titles...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Suggest Formal Titles with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Suggested Formal Course Titles */}
                {suggestedTitles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-slate-800/40 border border-indigo-500/30 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        AI Formal Course Titles (Click to select)
                      </p>
                      <span className="text-[10px] text-slate-400">Powered by Gemini</span>
                    </div>
                    <div className="space-y-2">
                      {suggestedTitles.map((title, idx) => {
                        const isChosen = selectedTitle === title;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedTitle(title)}
                            className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between gap-3 ${
                              isChosen
                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-100 font-semibold'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{title}</span>
                            {isChosen ? (
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                            ) : (
                              <span className="text-[10px] text-slate-500 shrink-0">Select</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Quick Templates Section */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Or pick a 1-click curated blueprint
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ROADMAP_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.title}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                          goal === tmpl.goal
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-slate-100'
                            : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="text-2xl p-1 bg-slate-900 rounded-lg shrink-0">
                          {tmpl.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-100">{tmpl.title}</p>
                          <p className="text-slate-400 line-clamp-1 mt-0.5">{tmpl.goal}</p>
                          <span className="inline-block mt-1 text-[10px] text-indigo-400 font-medium">
                            {tmpl.duration} mo · {tmpl.difficulty}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={!goal.trim()}
                    onClick={handleContinueToStep1}
                    className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5 disabled:opacity-50"
                  >
                    Continue to Timeline & Milestones
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Timeline, Pacing, Target Milestones & Blueprint Generation */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-400" />
                    Timeline, Pacing & Milestone Architecture
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Fine-tune course duration, milestone frequency, target milestone count, and AI reasoning depth.
                  </p>
                </div>

                {/* AI Duration & Pacing Recommendation Card */}
                {aiDurationSuggestion ? (
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        AI Recommendation for Your Goal
                      </span>
                      <button
                        type="button"
                        onClick={applyAiRecommendation}
                        className="px-2.5 py-1 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-[11px] transition-colors"
                      >
                        Apply AI Recommendation
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {aiDurationSuggestion.reasoning}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        Duration: <strong className="text-indigo-400">{aiDurationSuggestion.recommended_months} months</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        Pacing: <strong className="text-indigo-400 capitalize">{aiDurationSuggestion.recommended_pacing || 'weekly'}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        Milestones: <strong className="text-indigo-400">{aiDurationSuggestion.recommended_milestones || 8} milestones</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Want AI to estimate optimal pacing and duration?
                    </span>
                    <button
                      type="button"
                      onClick={handleEstimateDuration}
                      disabled={isEstimatingDuration}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isEstimatingDuration ? 'Analyzing Goal...' : 'Get AI Recommendation'}
                    </button>
                  </div>
                )}

                {/* Target Milestones Selector (Removes the artificial 6 milestone cap!) */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      Target Milestone Count
                    </label>
                    <span className="text-xs font-bold text-indigo-400">{targetMilestones} Milestones</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {MILESTONE_COUNT_OPTIONS.map((count) => {
                      const isSelected = targetMilestones === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setTargetMilestones(count)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200 font-bold'
                              : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-sm font-semibold">{count}</div>
                          <div className="text-[10px] text-slate-400">Milestones</div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Choose between 4 for compact sprints up to 16 for production-scale masteries. Each milestone includes deliverables and verified learning resources.
                  </p>
                </div>

                {/* Timeline Range Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      Target Duration: <span className="text-indigo-400 font-bold">{durationMonths} Months</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>1 month (Sprint)</span>
                    <span>3 months</span>
                    <span>6 months</span>
                    <span>12 months</span>
                    <span>24 months (Mastery)</span>
                  </div>
                </div>

                {/* Milestone Frequency / Pacing Control */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Milestone Frequency
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PACING_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPacing(opt.value)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all ${
                          pacing === opt.value
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
                            : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <p className="font-semibold text-slate-200">{opt.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{opt.description}</p>
                      </button>
                    ))}
                  </div>

                  {/* Overload Guardrail Alert */}
                  {isOverloadBlocked && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>Overload Warning:</strong> Daily pacing is restricted on plans longer
                        than 6 months to prevent burnout. Choose Weekly or Bi-weekly.
                      </span>
                    </div>
                  )}
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Target Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTY_LEVELS.map((level) => {
                      const isSelected = difficulty === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={`p-3 rounded-xl border text-center text-xs capitalize transition-all ${
                            isSelected
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200 font-semibold'
                              : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gemini Engine Switcher */}
                <div className="space-y-2.5 pt-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    Gemini AI Model Engine
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {GEMINI_MODELS.map((m) => {
                      const isSelected = geminiModel === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setGeminiModel(m.value)}
                          className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-indigo-500/10 border-indigo-500 text-slate-100'
                              : 'bg-slate-800/30 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              m.value === 'flash'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-indigo-500/10 text-indigo-400'
                            }`}
                          >
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{m.label}</p>
                            <p className="text-[11px] text-slate-400">{m.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Blueprint Summary Card */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Blueprint Summary
                  </span>
                  <p className="text-xs font-medium text-slate-200">
                    {selectedTitle ? (
                      <>
                        <span className="text-indigo-400 font-bold">{selectedTitle}</span>
                        <span className="text-slate-400 block mt-0.5">{goal}</span>
                      </>
                    ) : (
                      goal
                    )}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400">Difficulty</span>
                      <p className="font-semibold text-slate-200 capitalize mt-0.5">{difficulty}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Duration</span>
                      <p className="font-semibold text-slate-200 mt-0.5">{durationMonths} Months</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Frequency</span>
                      <p className="font-semibold text-slate-200 capitalize mt-0.5">{pacing}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Milestones</span>
                      <p className="font-semibold text-indigo-400 mt-0.5">{targetMilestones} Milestones</p>
                    </div>
                  </div>
                </div>

                {isGenerating ? (
                  <div className="p-8 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-center space-y-4">
                    <Spinner size="lg" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-indigo-300">
                        {generationStepText}
                      </p>
                      <p className="text-xs text-slate-400">
                        Synthesizing verified documentation, playlists, and learning deliverables...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-4"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Objective
                    </button>
                    <button
                      type="button"
                      disabled={isOverloadBlocked}
                      onClick={handleGenerate}
                      className="btn-primary inline-flex items-center gap-2 text-sm py-3 px-6 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Adaptive Blueprint
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
