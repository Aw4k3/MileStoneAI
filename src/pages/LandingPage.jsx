// src/pages/LandingPage.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Rocket,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon,
  Clock,
  BookOpen,
  Brain,
  RefreshCw,
  Compass,
} from 'lucide-react';

const PLATFORM_FEATURES = [
  {
    icon: Compass,
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    title: 'Personalized Curriculum Blueprints',
    description:
      'Enter any goal, pick a 1 to 24 month duration, and generate an exact sequence of milestones scaled to daily, every-3-days, weekly, biweekly, or monthly pacing.',
  },
  {
    icon: Clock,
    color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    title: 'AI Duration Estimator & Overload Protection',
    description:
      'Get an AI-calibrated timeline estimate with reasoning, plus automatic pacing safeguards that prevent unsustainable daily schedules on year-long blueprints.',
  },
  {
    icon: BookOpen,
    color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    title: 'Guided Course Modules & Real Resources',
    description:
      'Every milestone combines learning objectives, reputable free or paid courses and documentation, practical exercises, hands-on projects, and measurable deliverables.',
  },
  {
    icon: CheckCircle2,
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    title: 'Dynamic Timeline & Progress Tracking',
    description:
      'Track Day, Week, or Month milestones with interactive deliverable checklists, real-time progress rings, streak counters, and synced cloud persistence.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    title: 'Context-Injected 24/7 AI Mentor',
    description:
      'Ask questions inside any blueprint and get responses grounded in your current milestone and progress—switchable between Tutor, Strict Coach, and Peer personas.',
  },
  {
    icon: RefreshCw,
    color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    title: 'Verification Quizzes, Rebalancing & Export',
    description:
      'Validate major checkpoints with micro-quizzes, rebalance remaining milestones when plans shift, and export complete blueprints to Markdown or iCalendar.',
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      <nav
        className="flex items-center justify-between px-6 py-4 max-w-6xl w-full mx-auto border-b border-[#1e293b]"
        aria-label="Main Navigation"
      >
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
            Curriculum Architecture Engine · Gemini 2.5 Flash &amp; Supabase
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white mb-6">
            Turn ambitious goals into structured learning blueprints.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
            Self-directed learning fails on pacing and decision fatigue, not lack of content.
            Milestone AI turns your goal and timeline into sequenced milestones with real educational resources,
            hands-on projects, and a context-aware 24/7 AI mentor.
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

        {/* Platform Capabilities & Features Grid */}
        <section aria-labelledby="platform-features-heading" className="mt-16 pt-12 border-t border-[#1e293b] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                What Milestone AI Includes
              </p>
              <h2 id="platform-features-heading" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Everything needed to plan, study, and ship.
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              Powered by Gemini 2.5 Flash
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-6 rounded-2xl bg-[#121824] border border-[#242f42] space-y-3 hover:border-[#3b4c68] transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${feat.color}`}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </section>
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
