// src/pages/WizardPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Target,
  Brain,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Spinner from '../components/common/Spinner';
import { useRoadmaps } from '../hooks/useRoadmaps';
import {
  generateRoadmapWithAI,
  estimateDurationWithAI,
} from '../lib/gemini';
import {
  ROADMAP_TEMPLATES,
  PACING_OPTIONS,
  GEMINI_MODELS,
} from '../lib/constants';

const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'exp',
    question: 'How much prior experience do you have in this exact domain?',
    options: [
      { label: 'Complete beginner (zero background)', score: 'beginner' },
      { label: 'Some self-taught exposure or related basics', score: 'beginner' },
      { label: 'Intermediate (built small projects or academic foundation)', score: 'intermediate' },
      { label: 'Advanced professional seeking mastery and architecture', score: 'advanced' },
    ],
  },
  {
    id: 'time',
    question: 'How many dedicated hours per week can you realistically commit?',
    options: [
      { label: '2 to 4 hours / week (casual pacing)', pacing: 'biweekly' },
      { label: '5 to 8 hours / week (steady progress)', pacing: 'weekly' },
      { label: '10 to 15 hours / week (focused sprint)', pacing: 'weekly' },
      { label: '20+ hours / week (full immersion / bootcamp mode)', pacing: 'every_3_days' },
    ],
  },
  {
    id: 'goal_type',
    question: 'What is your primary measure of success?',
    options: [
      { label: 'Passing an interview or getting certified' },
      { label: 'Shipping a tangible production-ready project' },
      { label: 'Casual fluency and personal hobby enrichment' },
      { label: 'Foundational comprehension of core principles' },
    ],
  },
];

export default function WizardPage() {
  const navigate = useNavigate();
  const { createRoadmap } = useRoadmaps();

  // Wizard Step (0: Goal/Templates, 1: Diagnostic, 2: Pacing & AI Estimator, 3: Review & Generate)
  const [step, setStep] = useState(0);

  // Form State
  const [goal, setGoal] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [durationMonths, setDurationMonths] = useState(3);
  const [pacing, setPacing] = useState('weekly');
  const [geminiModel, setGeminiModel] = useState('pro');

  // Diagnostic State
  const [diagnosticAnswers, setDiagnosticAnswers] = useState({});

  // AI Duration Estimator
  const [isEstimatingDuration, setIsEstimatingDuration] = useState(false);
  const [aiDurationSuggestion, setAiDurationSuggestion] = useState(null);

  // AI Generation Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepText, setGenerationStepText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle template selection
  const handleSelectTemplate = (template) => {
    setGoal(template.goal);
    setDifficulty(template.difficulty);
    setDurationMonths(template.duration);
  };

  // Milestone frequency multiplier
  const pacingMultiplier = {
    daily: 30,
    every_3_days: 10,
    weekly: 4,
    biweekly: 2,
    monthly: 1,
  };

  const estimatedMilestones = Math.round(durationMonths * (pacingMultiplier[pacing] || 4));

  // Overload guardrail: block Daily pacing on plans > 6 months
  const isOverloadBlocked = pacing === 'daily' && durationMonths > 6;

  // Run real AI Duration Estimation
  const handleEstimateDuration = async () => {
    if (!goal.trim()) return;
    setIsEstimatingDuration(true);
    try {
      const res = await estimateDurationWithAI({ goal, difficulty });
      if (res?.recommended_months) {
        setAiDurationSuggestion(res);
      }
    } catch (err) {
      console.warn('AI duration estimator notice:', err);
    } finally {
      setIsEstimatingDuration(false);
    }
  };

  const handleDiagnosticAnswer = (questionId, option) => {
    setDiagnosticAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));

    if (questionId === 'exp' && option.score) {
      setDifficulty(option.score);
    }
    if (questionId === 'time' && option.pacing) {
      setPacing(option.pacing);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    setGenerationStepText(`Synthesizing blueprint with Gemini ${geminiModel.toUpperCase()}...`);

    let generatedRoadmapId = null;

    try {
      // 1. Live Gemini AI Synthesis (or local AI fallback)
      const aiData = await generateRoadmapWithAI({
        goal,
        difficulty,
        duration_months: durationMonths,
        pacing,
        gemini_model: geminiModel,
      });

      setGenerationStepText('Creating curriculum milestones, deliverables, and verified resources...');

      // 2. Persist using createRoadmap (Hybrid: LocalStorage + Supabase)
      const created = await createRoadmap({
        title: aiData?.title || (goal.length > 40 ? `${goal.slice(0, 38)}...` : goal),
        goal_summary: aiData?.goal_summary || goal,
        difficulty,
        duration_months: durationMonths,
        pacing,
        key_outcomes: aiData?.key_outcomes || [
          'Master core foundational principles and primitives',
          'Build and test decoupled production components',
          'Deploy verified milestone capstone deliverable',
        ],
        gemini_model: geminiModel,
        milestones: aiData?.milestones || [],
      });

      generatedRoadmapId = created?.id;
      setGenerationStepText('Finalizing blueprint records...');

      setTimeout(() => {
        setIsGenerating(false);
        // Direct navigation to the created roadmap!
        navigate(`/roadmap/${generatedRoadmapId}`);
      }, 400);
    } catch (err) {
      console.error('Roadmap synthesis error:', err);
      // Fallback: create emergency local blueprint so user is never stuck
      try {
        const fallback = await createRoadmap({
          title: goal.length > 40 ? `${goal.slice(0, 38)}...` : goal,
          goal_summary: goal,
          difficulty,
          duration_months: durationMonths,
          pacing,
          key_outcomes: ['Master core competencies and project deliverables'],
          gemini_model: geminiModel,
          milestones: [
            {
              title: 'Phase 1: Fundamentals & Tooling',
              description: 'Initial setup, mental models, and foundational syntax.',
              deliverables: ['Setup development workspace', 'Complete introductory coding exercises'],
              resources: [{ title: 'Documentation & Guides', url: 'https://docs.github.com', type: 'docs' }],
            },
            {
              title: 'Phase 2: Project Architecture',
              description: 'Build core application features with clean architecture.',
              deliverables: ['Implement primary domain logic', 'Write verification tests'],
              resources: [{ title: 'Best Practice Architecture Guide', url: 'https://martinfowler.com', type: 'book' }],
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
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Step {step + 1} of 4</span>
            <span>
              {step === 0 && 'Define Your Goal'}
              {step === 1 && 'AI Diagnostic Assessment'}
              {step === 2 && 'Timeline & Pacing Guardrails'}
              {step === 3 && 'Generate Roadmap'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: '25%' }}
              animate={{ width: `${((step + 1) / 4) * 100}%` }}
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
            {/* STEP 0: Goal Input & Quick Templates */}
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
                    scope, pre-requisites, and target milestones.
                  </p>
                </div>

                <div>
                  <textarea
                    rows={4}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Master Jetpack Compose and Kotlin Coroutines to build clean architecture Android applications from scratch..."
                    className="input-field resize-none text-sm leading-relaxed"
                  />
                  <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                    <span>Be specific about your end deliverable</span>
                    <span>{goal.length} chars</span>
                  </div>
                </div>

                {/* Templates Section */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
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
                    onClick={() => {
                      setStep(1);
                      handleEstimateDuration();
                    }}
                    className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5 disabled:opacity-50"
                  >
                    Continue to Assessment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: AI Diagnostic Assessment */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-400" />
                      3-Question AI Diagnostic
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Helps calibrate baseline difficulty and time pacing automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-slate-400 hover:text-slate-200 underline"
                  >
                    Skip Diagnostic
                  </button>
                </div>

                <div className="space-y-5">
                  {DIAGNOSTIC_QUESTIONS.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-2.5">
                      <p className="text-xs sm:text-sm font-semibold text-slate-200">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const isSelected = diagnosticAnswers[q.id]?.label === opt.label;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => handleDiagnosticAnswer(q.id, opt)}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                                isSelected
                                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200 font-medium'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calibrated Level Notice */}
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Calibrated Difficulty: <strong className="text-indigo-400 capitalize">{difficulty}</strong>
                  </span>
                  <span className="text-slate-400">Pacing: <strong className="text-indigo-400 capitalize">{pacing}</strong></span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5"
                  >
                    Continue to Configuration
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Timeline, Pacing & Model Controls */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-400" />
                    Pacing & Guardrails
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Fine-tune target duration, milestone frequency, and AI reasoning depth.
                  </p>
                </div>

                {/* Timeline Selector */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Target Duration: <span className="text-indigo-400 font-bold">{durationMonths} Months</span>
                    </label>

                    {/* AI Duration Estimator Chip */}
                    {aiDurationSuggestion ? (
                      <button
                        type="button"
                        onClick={() => setDurationMonths(aiDurationSuggestion.recommended_months)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs hover:bg-indigo-500/20 transition-colors"
                        title={aiDurationSuggestion.reasoning}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        AI Recommends {aiDurationSuggestion.recommended_months} mo · Apply
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEstimateDuration}
                        disabled={isEstimatingDuration}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isEstimatingDuration ? 'Estimating...' : 'Estimate Duration with AI'}
                      </button>
                    )}
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
                    <span>6 months</span>
                    <span>12 months</span>
                    <span>24 months (Mastery)</span>
                  </div>
                </div>

                {/* Pacing Control */}
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
                  {isOverloadBlocked ? (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>Overload Warning:</strong> Daily pacing is restricted on plans longer
                        than 6 months to prevent burnout. Choose Weekly or Bi-weekly.
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-800/30 text-xs text-slate-400 flex items-center justify-between">
                      <span>Estimated Milestone Count:</span>
                      <strong className="text-slate-200">~{estimatedMilestones} milestones</strong>
                    </div>
                  )}
                </div>

                {/* Dual Gemini Engine Switcher */}
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
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            m.value === 'flash' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
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

                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isOverloadBlocked}
                    onClick={() => setStep(3)}
                    className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5 disabled:opacity-50"
                  >
                    Review Blueprint
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Review & Generate */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    Review & Blueprint Summary
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Your parameters are locked. Ready to invoke Gemini AI synthesis and database persistence.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Objective Statement
                    </span>
                    <p className="text-sm font-medium text-slate-100 mt-1">
                      {goal}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400">Difficulty</span>
                      <p className="font-semibold text-slate-200 capitalize mt-0.5">{difficulty}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Duration</span>
                      <p className="font-semibold text-slate-200 mt-0.5">{durationMonths} Months</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Milestone Pacing</span>
                      <p className="font-semibold text-slate-200 capitalize mt-0.5">{pacing}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">AI Engine</span>
                      <p className="font-semibold text-indigo-400 capitalize mt-0.5">Gemini {geminiModel}</p>
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
                        Synthesizing verified documentation and learning deliverables...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-4"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Adjust
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="btn-primary inline-flex items-center gap-2 text-sm py-3 px-6 shadow-lg shadow-indigo-500/20"
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
