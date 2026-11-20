// src/pages/LandingPage.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Rocket,
  CheckCircle2,
  Terminal,
  Layers,
  ArrowRight,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash?.includes('access_token')) {
      navigate('/dashboard' + window.location.hash, { replace: true });
    } else if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">
      {/* Top Header */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl w-full mx-auto border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Rocket className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-base sm:text-lg">
            <span>Milestone</span>
            <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <Link
            to="/docs"
            className="font-medium text-slate-400 hover:text-white px-2.5 py-1.5 transition-colors hidden sm:inline-block"
          >
            YC Pitch Deck &amp; Docs
          </Link>
          <Link
            to="/auth"
            className="font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            Create Blueprint
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl">
          {/* Distinct Non-cliché Monospace Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#131b26] border border-[#242f42] text-xs font-mono text-slate-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Curriculum Architecture Engine · Gemini 2.5 &amp; 2.0 Flash
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-6">
            Turn ambitious goals into week-by-week curriculum blueprints.
          </h1>

          <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-2xl leading-relaxed">
            Self-directed learning fails on pacing and decision fatigue, not lack of content.
            Milestone AI formats goals into 4–16 progressive milestones with deliverables,
            verified resources, and a context-aware 24/7 AI mentor.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/auth"
              className="btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2 font-semibold"
            >
              Start Free Blueprint
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/docs"
              className="btn-secondary py-3 px-5 text-sm flex items-center justify-center gap-2 font-medium"
            >
              Read Architecture &amp; Spec
            </Link>
          </div>
        </div>

        {/* Live Interactive Blueprint Preview Canvas */}
        <div className="mt-16 rounded-2xl bg-[#121824] border border-[#242f42] overflow-hidden shadow-2xl">
          <div className="px-5 py-3.5 bg-[#0e141f] border-b border-[#1e293b] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Blueprint Preview: Full-Stack Machine Learning Engineering</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
                4 Months · 8 Milestones
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 Sample */}
            <div className="space-y-3 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-[#1e293b] md:pr-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-blue-400 font-semibold">Month 1 · Foundations</span>
                <span className="text-[11px] text-slate-500">200 XP</span>
              </div>
              <h3 className="text-sm font-bold text-white">Advanced Modeling &amp; Feature Pipelines</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Implement gradient boosted trees, feature scaling, and time-series backtesting strategies.
              </p>
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Ensemble learning with Optuna tuning</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>SHAP model interpretability pipeline</span>
                </div>
              </div>
            </div>

            {/* Step 2 Sample */}
            <div className="space-y-3 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-[#1e293b] md:pr-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-blue-400 font-semibold">Month 2 · Deep Learning</span>
                <span className="text-[11px] text-slate-500">350 XP</span>
              </div>
              <h3 className="text-sm font-bold text-white">Transformer Architectures &amp; Fine-Tuning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fine-tune BERT &amp; modern LLMs with LoRA, parameter-efficient adaptations, and evaluate loss curves.
              </p>
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>PyTorch attention mechanism from scratch</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Quantization &amp; LoRA adapters with HuggingFace</span>
                </div>
              </div>
            </div>

            {/* Step 3 Sample */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-emerald-400 font-semibold">Month 3–4 · Production</span>
                <span className="text-[11px] text-slate-500">500 XP</span>
              </div>
              <h3 className="text-sm font-bold text-white">Distributed Serving &amp; MLOps CI/CD</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deploy dynamic FastAPI inference endpoints on cloud infrastructure with automated monitoring.
              </p>
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Docker containerization &amp; Ray serving</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Live drift monitoring &amp; Prometheus telemetry</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Pillars of Craft */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-12 border-t border-[#1e293b]">
          <div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Actionable Sequencing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every milestone ends with a concrete, testable deliverable — not a vague suggestion to "read documentation."
            </p>
          </div>

          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Context-Injected Mentor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The AI mentor knows your current week, completed deliverables, and roadblocks. No repeating context in prompts.
            </p>
          </div>

          <div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Real Resource Curation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Curated official documentation, video course playlists, and books with zero dead links or generic Google search prompts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-xs text-slate-500 py-6 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between max-w-6xl w-full mx-auto px-6 gap-3">
        <p>© {new Date().getFullYear()} Milestone AI · Gemini 2.5 Flash &amp; Supabase Edge</p>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/docs" className="text-blue-400 hover:text-white transition-colors">
            YC Pitch Deck &amp; Architecture
          </Link>
          <a
            href="https://github.com/Aw4k3/MileStoneAI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
