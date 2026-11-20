// src/pages/LandingPage.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Rocket,
  Target,
  Brain,
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Adaptive Learning Blueprints',
    description: 'Transform goals into week-by-week milestones with deliverables and verified resources.',
  },
  {
    icon: Brain,
    title: 'Guardrailed AI Mentor',
    description: 'A 24/7 Socratic tutor strictly locked to your curriculum context and progress history.',
  },
  {
    icon: Zap,
    title: 'Gamified Milestone Tracking',
    description: 'Earn XP, uphold your streak, unlock achievement badges, and conquer gated micro-quizzes.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Budget Architecture',
    description: '100% free-tier stack powered by Google Gemini, Supabase Postgres RLS, and Vercel edge.',
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated or returning with OAuth hash, navigate to dashboard
  useEffect(() => {
    if (window.location.hash?.includes('access_token')) {
      navigate('/dashboard' + window.location.hash, { replace: true });
    } else if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl w-full mx-auto border-b border-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Milestone <span className="text-gradient">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="btn-primary text-xs sm:text-sm py-2 px-4 inline-flex items-center gap-1.5"
            >
              Open Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/wizard"
                className="btn-primary text-xs sm:text-sm py-2 px-4 inline-flex items-center gap-1.5"
              >
                Create Roadmap
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 text-center max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto flex flex-col items-center"
        >
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Adaptive Roadmap Generator · Gemini AI Engine
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6">
            Turn natural language goals into{' '}
            <span className="text-gradient">actionable roadmaps</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
            Stop staring at blank calendars. Type what you want to achieve, and let
            Milestone AI curate time-bound milestones, clickable resources, and a
            guardrailed AI mentor.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <Link
              to="/wizard"
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-base px-6 py-3"
            >
              Start Free Blueprint
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 text-base px-6 py-3"
            >
              Explore Sample Roadmaps
            </Link>
          </div>

          {/* Social Proof / Stats Pill */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Free Forever ($0 Tier)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Dual Gemini Flash / Pro</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Adaptive Rescheduling</span>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 w-full"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="card text-left flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-800/40">
        <p>© {new Date().getFullYear()} Milestone AI · Free Tier AI Architecture</p>
      </footer>
    </div>
  );
}
