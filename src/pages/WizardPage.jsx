// src/pages/WizardPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Target,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wand2,
  Check,
  Calendar,
  Sparkles,
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
  DIFFICULTY_LEVELS,
} from '../lib/constants';

const MILESTONE_COUNT_OPTIONS = [4, 6, 8, 10, 12, 16];

export default function WizardPage() {
  const navigate = useNavigate();
  const { createRoadmap } = useRoadmaps();

  const [step, setStep] = useState(0);

  // Form State
  const [goal, setGoal] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [durationMonths, setDurationMonths] = useState(3);
  const [pacing, setPacing] = useState('weekly');
  const [targetMilestones, setTargetMilestones] = useState(8);

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

  const handleSelectTemplate = (template) => {
    setGoal(template.goal);
    setSelectedTitle(template.title);
    setDifficulty(template.difficulty);
    setDurationMonths(template.duration);
    setSuggestedTitles([]);
  };

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
      console.warn('Title suggestion notice:', err.message);
    } finally {
      setIsSuggestingTitles(false);
    }
  };

  const handleEstimateDuration = async () => {
    if (!goal.trim()) return;
    setIsEstimatingDuration(true);
    try {
      const res = await estimateDurationWithAI({ goal, difficulty });
      if (res?.recommended_months) {
        setAiDurationSuggestion(res);
      }
    } catch (err) {
      console.warn('Duration estimation notice:', err.message);
    } finally {
      setIsEstimatingDuration(false);
    }
  };

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

  const handleContinueToStep1 = () => {
    setStep(1);
    if (!aiDurationSuggestion) {
      handleEstimateDuration();
    }
  };

  const isOverloadBlocked = pacing === 'daily' && durationMonths > 6;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    setGenerationStepText('Synthesizing structured curriculum blueprint with Gemini AI...');

    let generatedRoadmapId = null;

    try {
      const aiData = await generateRoadmapWithAI({
        goal,
        difficulty,
        duration_months: durationMonths,
        pacing,
        target_milestones: targetMilestones,
      });

      setGenerationStepText(`Generated ${aiData?.milestones?.length || targetMilestones} comprehensive milestones with verified resources...`);

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
      try {
        const fallback = await createRoadmap({
          title: selectedTitle || (goal.length > 50 ? `${goal.slice(0, 48)}...` : goal),
          goal_summary: goal,
          difficulty,
          duration_months: durationMonths,
          pacing,
          key_outcomes: ['Master core competencies and project deliverables'],
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
        {/* Step Indicator Header */}
        <div className="mb-6 pb-4 border-b border-[#1e293b] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
              step === 0 ? 'bg-blue-600 text-white' : 'bg-[#1a2332] text-slate-400'
            }`}>
              01
            </span>
            <span className={step === 0 ? 'text-white font-semibold' : 'text-slate-400'}>
              Objective &amp; Title
            </span>
            <span className="text-slate-600">/</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
              step === 1 ? 'bg-blue-600 text-white' : 'bg-[#1a2332] text-slate-400'
            }`}>
              02
            </span>
            <span className={step === 1 ? 'text-white font-semibold' : 'text-slate-400'}>
              Timeline &amp; Pacing
            </span>
          </div>

          <span className="font-mono text-slate-400 hidden sm:inline">
            Step {step + 1} of 2
          </span>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Wizard Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121824] border border-[#242f42] relative">
          <AnimatePresence mode="wait">
            {/* STEP 0: Goal Input & Title Suggestions */}
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
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    What do you want to master or build?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Describe your end goal in natural language. Gemini will analyze prerequisites and build a sequential milestone path.
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
                    placeholder="e.g. Master Full-Stack AI SaaS engineering with Next.js, Stripe subscriptions, and PostgreSQL to ship production software..."
                    className="input-field resize-none text-xs sm:text-sm leading-relaxed"
                  />
                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-400">
                    <span className="text-[11px] text-slate-500">Be concrete about your technology stack or target deliverables</span>
                    <button
                      type="button"
                      onClick={handleSuggestTitles}
                      disabled={!goal.trim() || isSuggestingTitles}
                      className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${isSuggestingTitles ? 'animate-spin' : ''}`} />
                      {isSuggestingTitles ? 'Generating Titles...' : 'Suggest Formal Titles'}
                    </button>
                  </div>
                </div>

                {/* AI Formal Title Suggestions */}
                {suggestedTitles.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-2.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                      AI Formal Title Suggestions (Click to Select)
                    </span>
                    <div className="flex flex-col gap-2">
                      {suggestedTitles.map((title) => {
                        const isChosen = selectedTitle === title;
                        return (
                          <button
                            key={title}
                            type="button"
                            onClick={() => setSelectedTitle(title)}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between gap-2 ${
                              isChosen
                                ? 'bg-blue-600/10 border-blue-500 text-white font-semibold'
                                : 'bg-[#121824] border-[#242f42] text-slate-300 hover:border-[#3b4c68]'
                            }`}
                          >
                            <span>{title}</span>
                            {isChosen && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Curated Templates */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Or Start from an Engineering Blueprint Template
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ROADMAP_TEMPLATES.slice(0, 4).map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                          goal === tmpl.goal
                            ? 'bg-blue-600/10 border-blue-500 text-white'
                            : 'bg-[#0e141f] border-[#242f42] hover:border-[#3b4c68] text-slate-300'
                        }`}
                      >
                        <span className="text-xl p-1 bg-[#161f2e] rounded-lg shrink-0 border border-[#242f42]">
                          {tmpl.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{tmpl.title}</p>
                          <p className="text-slate-400 line-clamp-1 mt-0.5 text-[11px]">{tmpl.goal}</p>
                          <span className="inline-block mt-1 text-[10px] font-mono text-blue-400">
                            {tmpl.duration} mo · {tmpl.difficulty}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next Button */}
                <div className="flex justify-end pt-4 border-t border-[#1e293b]">
                  <button
                    type="button"
                    disabled={!goal.trim()}
                    onClick={handleContinueToStep1}
                    className="btn-primary text-xs py-2.5 px-5"
                  >
                    Continue to Timeline &amp; Pacing
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Timeline, Pacing, Target Milestones */}
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
                    <Sliders className="w-5 h-5 text-blue-400" />
                    Timeline, Pacing &amp; Milestone Count
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Calibrate the total duration, milestone count, and execution frequency for your curriculum.
                  </p>
                </div>

                {/* AI Duration Recommendation */}
                {aiDurationSuggestion ? (
                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        AI Timeline Calibration
                      </span>
                      <button
                        type="button"
                        onClick={applyAiRecommendation}
                        className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        Apply Recommendation
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {aiDurationSuggestion.reasoning}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-[#0b0f17] border border-[#242f42] text-slate-300">
                        Duration: <strong className="text-blue-400">{aiDurationSuggestion.recommended_months} mo</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#0b0f17] border border-[#242f42] text-slate-300">
                        Pacing: <strong className="text-blue-400 capitalize">{aiDurationSuggestion.recommended_pacing || 'weekly'}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#0b0f17] border border-[#242f42] text-slate-300">
                        Milestones: <strong className="text-blue-400">{aiDurationSuggestion.recommended_milestones || 8}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e141f] border border-[#1e293b] text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Auto-estimate timeline with Gemini
                    </span>
                    <button
                      type="button"
                      onClick={handleEstimateDuration}
                      disabled={isEstimatingDuration}
                      className="text-xs text-blue-400 hover:text-white font-medium"
                    >
                      {isEstimatingDuration ? 'Analyzing Goal...' : 'Estimate Duration'}
                    </button>
                  </div>
                )}

                {/* Target Milestones Selector */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      Milestone Count
                    </label>
                    <span className="font-mono font-bold text-blue-400">{targetMilestones} Milestones</span>
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
                              ? 'bg-blue-600/10 border-blue-500 text-white font-bold'
                              : 'bg-[#0e141f] border-[#242f42] text-slate-400 hover:text-slate-200 hover:border-[#3b4c68]'
                          }`}
                        >
                          <div className="text-sm font-semibold font-mono">{count}</div>
                          <div className="text-[10px] text-slate-500">Milestones</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      Course Duration
                    </label>
                    <span className="font-mono font-bold text-blue-400">{durationMonths} Months</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-[#0e141f] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>1 mo (Sprint)</span>
                    <span>3 mo</span>
                    <span>6 mo</span>
                    <span>12 mo</span>
                    <span>24 mo (Mastery)</span>
                  </div>
                </div>

                {/* Pacing Control */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
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
                            ? 'bg-blue-600/10 border-blue-500 text-white'
                            : 'bg-[#0e141f] border-[#242f42] text-slate-400 hover:text-slate-200 hover:border-[#3b4c68]'
                        }`}
                      >
                        <p className="font-semibold text-white">{opt.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{opt.description}</p>
                      </button>
                    ))}
                  </div>

                  {isOverloadBlocked && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Daily pacing is restricted on plans longer than 6 months to prevent burnout.</span>
                    </div>
                  )}
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                    Target Difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTY_LEVELS.map((level) => {
                      const isSelected = difficulty === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDifficulty(level)}
                          className={`p-2.5 rounded-xl border text-center text-xs capitalize transition-all ${
                            isSelected
                              ? 'bg-blue-600/10 border-blue-500 text-white font-semibold'
                              : 'bg-[#0e141f] border-[#242f42] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Blueprint Summary Receipt */}
                <div className="p-4 rounded-xl bg-[#0e141f] border border-[#1e293b] space-y-3 font-mono text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                    Curriculum Specification
                  </span>
                  <p className="text-slate-200 font-sans font-semibold text-sm">
                    {selectedTitle || goal}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1e293b] text-[11px]">
                    <div>
                      <span className="text-slate-500">Difficulty</span>
                      <p className="text-white capitalize">{difficulty}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Duration</span>
                      <p className="text-white">{durationMonths} Months</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Pacing</span>
                      <p className="text-white capitalize">{pacing}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Milestones</span>
                      <p className="text-blue-400 font-bold">{targetMilestones}</p>
                    </div>
                  </div>
                </div>

                {isGenerating ? (
                  <div className="p-8 rounded-2xl bg-[#0e141f] border border-blue-500/30 text-center space-y-3">
                    <Spinner size="lg" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        {generationStepText}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        Synthesizing verified documentation and deliverables...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-4 border-t border-[#1e293b]">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Objective
                    </button>
                    <button
                      type="button"
                      disabled={isOverloadBlocked}
                      onClick={handleGenerate}
                      className="btn-primary text-xs py-2.5 px-6 font-semibold"
                    >
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
