// src/pages/LandingPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Rocket,
  CheckCircle2,
  Terminal,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';

const STARTER_BLUEPRINTS = [
  {
    title: 'Full-Stack Machine Learning Engineering',
    duration: '4 Months',
    milestones: '8 Milestones',
    xp: '1,200 XP',
    difficulty: 'Intermediate',
    sampleTasks: [
      'Implement gradient boosted trees with Optuna tuning',
      'Fine-tune Transformer models with LoRA & PEFT',
      'Deploy FastAPI inference endpoints with automated drift monitoring',
    ],
  },
  {
    title: 'Rust Systems & High-Throughput Microservices',
    duration: '6 Months',
    milestones: '12 Milestones',
    xp: '1,800 XP',
    difficulty: 'Advanced',
    sampleTasks: [
      'Master ownership, lifetimes, and zero-cost abstractions',
      'Build async network engine with Tokio and Axum',
      'Implement Raft consensus algorithm with verification tests',
    ],
  },
  {
    title: 'Indie SaaS MVP: From Idea to First Paid User',
    duration: '3 Months',
    milestones: '6 Milestones',
    xp: '950 XP',
    difficulty: 'Beginner',
    sampleTasks: [
      'Define problem statement and validate with 10 customer interviews',
      'Build core feature prototype with Supabase and React',
      'Integrate Stripe billing, launch on Product Hunt & Hacker News',
    ],
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (window.location.hash?.includes('access_token')) {
      navigate('/dashboard' + window.location.hash, { replace: true });
    } else if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const activeBlueprint = STARTER_BLUEPRINTS[activeTab];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">
      {/* Top Header */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl w-full mx-auto border-b border-[#1e293b]" aria-label="Main Navigation">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Rocket className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-base sm:text-lg">
            <span>Milestone</span>
            <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] border border-[#242f42] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-blue-500" aria-hidden="true" />
            )}
          </button>
          <Link
            to="/docs"
            className="font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors hidden sm:inline-block"
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
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-3xl">
          {/* Engine Capability Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#131b26] border border-[#242f42] text-xs font-mono text-slate-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
            Curriculum Architecture Engine · Gemini 2.5 &amp; 2.0 Flash
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-6">
            Turn ambitious goals into week-by-week curriculum blueprints.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
            Self-directed learning fails on pacing and decision fatigue, not lack of content.
            Milestone AI formats goals into 4–16 progressive milestones with concrete deliverables,
            verified resources, and a context-aware 24/7 AI mentor.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/auth"
              className="btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2 font-semibold shadow-md"
            >
              Start Free Blueprint
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
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
        <div className="mt-14 rounded-2xl bg-[#121824] border border-[#242f42] overflow-hidden shadow-2xl">
          {/* Blueprint Selector Tabs */}
          <div className="px-5 py-3.5 bg-[#0e141f] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-300">
              <Terminal className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <span className="font-semibold">Interactive Blueprint Architecture:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {STARTER_BLUEPRINTS.map((bp, idx) => (
                <button
                  key={bp.title}
                  onClick={() => setActiveTab(idx)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    activeTab === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#161f2e] text-slate-400 hover:text-slate-200 hover:bg-[#1c2738]'
                  }`}
                >
                  {bp.title.split(' ')[0]} {bp.title.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Blueprint Detail Panel */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e293b]">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {activeBlueprint.title}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                    {activeBlueprint.duration}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    {activeBlueprint.milestones}
                  </span>
                  <span>·</span>
                  <span className="text-amber-400 font-semibold">{activeBlueprint.xp}</span>
                </div>
              </div>

              <span className="self-start sm:self-auto px-2.5 py-1 rounded-md text-xs font-mono font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {activeBlueprint.difficulty}
              </span>
            </div>

            {/* Structured Deliverables Preview */}
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Sample Verified Deliverables Checklist
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeBlueprint.sampleTasks.map((task, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#0e141f] border border-[#1e293b] flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {task}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#192231] text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Verified deliverable
                      </span>
                      <span>+150 XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">Adaptive rebalancing enabled when schedule shifts</span>
              <Link to="/auth" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1">
                Generate this blueprint <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Pillars of Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 pt-12 border-t border-[#1e293b]">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Layers className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Actionable Sequencing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every milestone ends with a concrete, testable deliverable — not a vague suggestion to "read documentation."
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Context-Injected Mentor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The AI mentor knows your active week, completed deliverables, and roadblocks. No repeating context in prompts.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Real Resource Curation</h3>
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
