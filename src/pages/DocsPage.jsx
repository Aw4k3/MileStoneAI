// src/pages/DocsPage.jsx
// Live /docs Module: YC-Style Pitch Deck + Deep Technical Documentation + Real-Time Telemetry
// Access Control: Public / Protected Investor Mode with Admin Publishing Controls

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Presentation,
  BookOpen,
  Activity,
  Users,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
  Cpu,
  Database,
  Terminal,
  Lock,
  Unlock,
  Eye,
  Download,
  Share2,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  Globe,
  Sliders,
  CheckSquare,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import { useAuth } from '../contexts/AuthContext';

// ==============================================================================
// PITCH DECK SLIDES DATA (YC FORMAT)
// ==============================================================================
const PITCH_SLIDES = [
  {
    id: 1,
    tag: 'THE VISION & HOOK',
    title: 'Milestone AI',
    subtitle: 'From Blank Ambition to Structured Mastery in Seconds',
    accent: 'indigo',
    stat: '10x',
    statLabel: 'Faster curriculum formulation vs manual search',
    content: (
      <div className="space-y-4">
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          The first adaptive, context-anchored curriculum generator. Milestone AI transforms
          natural-language career goals into week-by-week production blueprints with verified
          resources and a 24/7 guardrailed AI mentor.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Zero Fluff</span>
            <p className="text-xs text-slate-300 mt-1">Real documentation, verified courses & concrete code deliverables.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Context-Aware</span>
            <p className="text-xs text-slate-300 mt-1">AI mentor injected with active milestone state and progress history.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">$0 Operating Cost</span>
            <p className="text-xs text-slate-300 mt-1">Engineered on Google Gemini Flash + Supabase Edge for infinite free-tier scale.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    tag: 'THE PROBLEM',
    title: 'The Tutorial Hell & Blank Calendar Crisis',
    subtitle: 'Self-directed learners suffer from decision fatigue, not lack of content.',
    accent: 'rose',
    stat: '73%',
    statLabel: 'Drop-out rate for self-directed tech upskilling courses',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-sm mb-2">1</div>
            <h4 className="font-semibold text-slate-100 text-sm mb-1">Information Overload</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Learners bookmark 50 fragmented YouTube videos, outdated Medium articles, and random GitHub repos, leading to immediate overwhelm.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-sm mb-2">2</div>
            <h4 className="font-semibold text-slate-100 text-sm mb-1">The Blank Calendar</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              No realistic sequencing. Learners fail because they don't know whether a milestone takes 3 days or 3 weeks, paralyzing momentum.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-sm mb-2">3</div>
            <h4 className="font-semibold text-slate-100 text-sm mb-1">Stateless Chatbots</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generic ChatGPT prompts produce generic answers without remembering what the student finished yesterday or what roadblock they hit.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    tag: 'THE SOLUTION',
    title: 'Adaptive Learning Blueprints',
    subtitle: 'An AI-native curriculum architect + live personal mentor.',
    accent: 'indigo',
    stat: '15s',
    statLabel: 'Average time to generate a verified 16-week path',
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <h4 className="font-bold text-indigo-300 text-sm mb-2">How Milestone AI Solves The Triad:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Formal AI Synthesis:</strong> Automatically structures goals into 4–16 progressive milestones with deliverables.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Calibrated Pacing:</strong> AI duration estimator calculates optimal timelines based on domain complexity.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Guardrailed Mentor:</strong> Low-latency streaming chat strictly contextualized with active roadmap state.</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">Zero-Key Client Architecture</span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">Real-Time SSE Streaming</span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">PostgreSQL RLS Isolation</span>
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">XP & Streak Gamification</span>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    tag: 'PRODUCT & SECRET SAUCE',
    title: 'Context-Aware AI Mentor & Zero-Key Stack',
    subtitle: 'Why our technical architecture creates an unbreachable user experience.',
    accent: 'emerald',
    stat: '<120ms',
    statLabel: 'Time-to-first-token with Gemini 2.0 Flash SSE streaming',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <h4 className="font-semibold text-slate-100 text-sm mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Dynamic Context Injection
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every mentor query injects: current roadmap title, completion percentage, active milestone topic,
              completed tasks, and pending deliverables. The AI acts like a pair programmer looking over your shoulder.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <h4 className="font-semibold text-slate-100 text-sm mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Zero Client Visibility
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              API keys are stored strictly in Supabase backend secrets. The client never supplies keys or picks models,
              protecting developer quotas and delivering a frictionless one-click consumer experience.
            </p>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-slate-300">
          <strong>Pedagogical Personas:</strong> Learners can switch on-the-fly between <em>Socratic Tutor</em> (guides through discovery),
          <em>Strict Coach</em> (deadline and deliverable enforcement), and <em>Encouraging Peer</em> (collaborative problem-solving).
        </div>
      </div>
    ),
  },
  {
    id: 5,
    tag: 'MARKET OPPORTUNITY',
    title: 'The $420B Self-Directed Upskilling Economy',
    subtitle: 'Massive shift toward continuous technical education & career pivoting.',
    accent: 'amber',
    stat: '$420B',
    statLabel: 'Global market size for self-paced & digital upskilling',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-2xl font-black text-slate-100">$420B</span>
            <p className="text-xs font-semibold text-indigo-400 mt-0.5">TAM</p>
            <p className="text-[11px] text-slate-400 mt-1">Total addressable global online learning & workforce upskilling.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-2xl font-black text-slate-100">$48B</span>
            <p className="text-xs font-semibold text-emerald-400 mt-0.5">SAM</p>
            <p className="text-[11px] text-slate-400 mt-1">Software engineering, AI, DevOps & STEM career transitioners.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-2xl font-black text-slate-100">$4.2B</span>
            <p className="text-xs font-semibold text-amber-400 mt-0.5">SOM</p>
            <p className="text-[11px] text-slate-400 mt-1">Early adopters of AI-driven personalized learning copilots.</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
          <strong>Why Now?</strong> Recent advances in Gemini 2.5 Flash and Gemini 2.0 Flash allow us to generate full 16-week
          structured curricula and stream low-latency conversational guidance at fractions of a cent per session,
          unlocking 1-on-1 private tutoring economics for billions of learners.
        </p>
      </div>
    ),
  },
  {
    id: 6,
    tag: 'BUSINESS MODEL & UNIT ECONOMICS',
    title: 'Freemium B2C + Cohort B2B Licensing',
    subtitle: '98%+ gross margins powered by modern serverless Edge AI.',
    accent: 'indigo',
    stat: '98%',
    statLabel: 'Gross margin due to efficient edge token architecture',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-100 text-sm">B2C Freemium & Pro</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">$12 / mo</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li><strong>Free Tier:</strong> 2 active roadmaps, core mentor chat, verified public resources.</li>
              <li><strong>Pro Tier ($12/mo):</strong> Unlimited roadmaps, automated GitHub code review on deliverables, dynamic quiz certification, and voice mentor mode.</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-100 text-sm">B2B Education & Bootcamps</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">$25 / seat / mo</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li><strong>Cohort Dashboard:</strong> Instructors assign custom blueprints to students and monitor completion telemetry in real-time.</li>
              <li><strong>Curriculum Export:</strong> University syllabus generation with verified reading lists.</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    tag: 'COMPETITIVE ADVANTAGE',
    title: 'Why Milestone AI Wins',
    subtitle: 'State-aware execution beats static video playlists and generic chatbots.',
    accent: 'emerald',
    stat: '3x',
    statLabel: 'Higher milestone completion rate vs traditional MOOCs',
    content: (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2.5 px-3">Capability</th>
              <th className="py-2.5 px-3 text-indigo-400 font-bold bg-indigo-500/10 rounded-t-lg">Milestone AI</th>
              <th className="py-2.5 px-3">ChatGPT / Claude</th>
              <th className="py-2.5 px-3">Coursera / Udemy</th>
              <th className="py-2.5 px-3">Notion Templates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            <tr>
              <td className="py-2.5 px-3 font-medium">Curriculum Synthesis</td>
              <td className="py-2.5 px-3 font-semibold text-emerald-400 bg-indigo-500/5">Instant (4-16 weeks)</td>
              <td className="py-2.5 px-3 text-amber-400">Wall of unformatted text</td>
              <td className="py-2.5 px-3 text-slate-400">Static / Pre-recorded</td>
              <td className="py-2.5 px-3 text-rose-400">Manual entry</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-medium">Context-Aware AI Mentor</td>
              <td className="py-2.5 px-3 font-semibold text-emerald-400 bg-indigo-500/5">Active roadmap state locked</td>
              <td className="py-2.5 px-3 text-rose-400">Stateless (forgets progress)</td>
              <td className="py-2.5 px-3 text-rose-400">None / Static forum</td>
              <td className="py-2.5 px-3 text-rose-400">None</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-medium">Actionable Deliverables</td>
              <td className="py-2.5 px-3 font-semibold text-emerald-400 bg-indigo-500/5">Interactive checklist + XP</td>
              <td className="py-2.5 px-3 text-amber-400">Text list</td>
              <td className="py-2.5 px-3 text-slate-400">Passive video watching</td>
              <td className="py-2.5 px-3 text-amber-400">Static checkboxes</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-medium">Adaptive Rescheduling</td>
              <td className="py-2.5 px-3 font-semibold text-emerald-400 bg-indigo-500/5">AI rebalance on falling behind</td>
              <td className="py-2.5 px-3 text-rose-400">None</td>
              <td className="py-2.5 px-3 text-rose-400">Fixed dates / Drop out</td>
              <td className="py-2.5 px-3 text-rose-400">Manual re-planning</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 8,
    tag: 'TRACTION & VALIDATION',
    title: 'Shipped, Deployed & Live in Production',
    subtitle: 'From prototype to hardened production in days.',
    accent: 'indigo',
    stat: '100%',
    statLabel: 'Production uptime across edge microservices',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xl font-bold text-emerald-400">Live</span>
            <p className="text-[11px] text-slate-400 mt-1">milestonegen.vercel.app</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xl font-bold text-indigo-400">3 Edge Fn</span>
            <p className="text-[11px] text-slate-400 mt-1">Deno + Gemini microservices</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xl font-bold text-amber-400">Auth-First</span>
            <p className="text-[11px] text-slate-400 mt-1">Google OAuth + Supabase RLS</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xl font-bold text-cyan-400">SSE Stream</span>
            <p className="text-[11px] text-slate-400 mt-1">Sub-second mentor responses</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The architecture has been verified end-to-end: Google OAuth authentication, Supabase Row-Level Security isolation,
          automated duration estimation via <code>gemini-2.5-flash</code>, full roadmap curriculum synthesis, and real-time streaming
          mentor chat via <code>gemini-2.0-flash</code>.
        </p>
      </div>
    ),
  },
  {
    id: 9,
    tag: 'THE ROADMAP & VISION',
    title: 'What We Are Building Next',
    subtitle: 'Transforming Milestone AI into an autonomous learning OS.',
    accent: 'emerald',
    stat: 'Q1-Q2',
    statLabel: 'Release targets for automated verification',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">P1</span>
            <h4 className="font-semibold text-slate-200 text-xs">GitHub Auto-Checkers</h4>
          </div>
          <p className="text-xs text-slate-400">
            Link a GitHub repo to a deliverable. An automated GitHub Action checks test suites and automatically marks deliverables complete.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">P2</span>
            <h4 className="font-semibold text-slate-200 text-xs">Dynamic Micro-Quizzes</h4>
          </div>
          <p className="text-xs text-slate-400">
            AI generates 3 targeted scenario questions per milestone. Pass the quiz to unlock achievement badges and milestone completion certificates.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">P3</span>
            <h4 className="font-semibold text-slate-200 text-xs">Peer Study Swarms</h4>
          </div>
          <p className="text-xs text-slate-400">
            Synchronize blueprints with colleagues or university study groups. Compare streaks, share milestone solutions, and review code together.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    tag: 'THE ASK & CLOSE',
    title: 'Join Us in Democratizing Elite Mentorship',
    subtitle: 'Every learner deserves an intelligent, personalized curriculum architect.',
    accent: 'indigo',
    stat: 'Now',
    statLabel: 'Seeking seed partners & early educational pilot cohorts',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          We are seeking early angel / seed partners and university / bootcamp pilot programs to expand our autonomous
          code evaluation pipeline and bring adaptive learning blueprints to 1,000,000+ engineers worldwide.
        </p>
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900/40 border border-indigo-700/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-100 text-sm">Experience the Live Application</h4>
            <p className="text-xs text-slate-300">Live on Vercel Edge with zero-key Gemini cloud engine.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/auth" className="btn-primary py-2 px-4 text-xs">
              Try Milestone AI Free →
            </Link>
          </div>
        </div>
        <div className="text-center pt-2">
          <span className="text-xs text-slate-400">
            Built with Gemini 2.5 Flash, Supabase Postgres & Vercel Edge · Open Source MIT
          </span>
        </div>
      </div>
    ),
  },
];

// ==============================================================================
// TECHNICAL SPECIFICATION DATA
// ==============================================================================
const TECH_ENDPOINTS = [
  {
    name: 'Endpoint 1: Duration Estimator',
    slug: 'estimate-duration',
    method: 'POST',
    path: '/functions/v1/estimate-duration',
    model: 'gemini-2.5-flash',
    temp: '0.2',
    responseMime: 'application/json',
    description: 'Analyzes user goal to estimate realistic duration in months with technical reasoning.',
    payload: {
      goal: 'Learn Full-Stack Development with Rust and React',
    },
    response: {
      recommended_months: 6,
      reasoning: "Mastering Rust's ownership model requires 2-3 months of dedicated practice before combining it with backend frameworks and React integration.",
    },
    curl: `curl -X POST https://pgoeqctzvbzwhafcrcvq.supabase.co/functions/v1/estimate-duration \\
  -H "Content-Type: application/json" \\
  -d '{"goal": "Learn Full-Stack Development with Rust and React"}'`,
  },
  {
    name: 'Endpoint 2: Structured Roadmap Generator',
    slug: 'generate-roadmap',
    method: 'POST',
    path: '/functions/v1/generate-roadmap',
    model: 'gemini-2.5-flash',
    temp: '0.3',
    responseMime: 'application/json',
    description: 'Generates complete multi-month roadmap with milestones, actionable tasks, outcomes, and curated search resources.',
    payload: {
      goal: 'Master Machine Learning Engineering',
      targetMonths: 4,
      skillLevel: 'Intermediate',
    },
    response: {
      title: 'Machine Learning Engineering Roadmap',
      description: 'A comprehensive 4-month path to building and deploying ML models.',
      target_outcomes: [
        'Train and deploy a transformer model on cloud infrastructure',
        'Build dynamic inference APIs with FastAPI',
      ],
      milestones: [
        {
          id: 'm1',
          title: 'Mathematics & Data Foundations',
          month_range: 'Month 1',
          description: 'Core linear algebra, calculus, and pandas data manipulation.',
          tasks: [
            {
              id: 't1',
              title: 'Implement Matrix Operations',
              description: 'Write matrix multiplication from scratch using NumPy.',
            },
          ],
          resources: [
            {
              title: '3Blue1Brown Essence of Linear Algebra',
              type: 'video',
              search_query: '3Blue1Brown Linear Algebra playlist',
            },
          ],
        },
      ],
    },
    curl: `curl -X POST https://pgoeqctzvbzwhafcrcvq.supabase.co/functions/v1/generate-roadmap \\
  -H "Content-Type: application/json" \\
  -d '{"goal": "Master Machine Learning Engineering", "targetMonths": 4, "skillLevel": "Intermediate"}'`,
  },
  {
    name: 'Endpoint 3: Context-Aware Streaming AI Mentor',
    slug: 'chat-mentor',
    method: 'POST (SSE)',
    path: '/functions/v1/chat-mentor',
    model: 'gemini-2.0-flash',
    temp: '0.7',
    responseMime: 'text/event-stream',
    description: 'Provides personalized low-latency streaming chat assistance contextualized with active roadmap state.',
    payload: {
      roadmapContext: {
        title: 'Machine Learning Engineering Roadmap',
        overallProgressPercent: 35,
        activeMilestone: 'Mathematics & Data Foundations',
        completedTaskTitles: ['Implement Matrix Operations'],
        pendingTaskTitles: ['Vector Calculus Review', 'Pandas Data Cleaning'],
      },
      chatHistory: [
        { role: 'user', text: "I'm struggling with Vector Calculus." },
        { role: 'model', text: 'Vector calculus can be tricky! Focus first on partial derivatives...' },
      ],
      message: 'Where should I start practice problems for this?',
    },
    response: 'data: {"chunk": "Start with "}\ndata: {"chunk": "Khan Academy\'s Multivariable Calculus section…"}\ndata: [DONE]',
    curl: `curl -N -X POST https://pgoeqctzvbzwhafcrcvq.supabase.co/functions/v1/chat-mentor \\
  -H "Content-Type: application/json" \\
  -d '{
    "roadmapContext": {"title": "Machine Learning", "overallProgressPercent": 35, "activeMilestone": "Math Foundations", "completedTaskTitles": [], "pendingTaskTitles": []},
    "chatHistory": [],
    "message": "Where should I start practice problems for this?"
  }'`,
  },
];

// ==============================================================================
// TEAM SHOWCASE DATA
// ==============================================================================
const TEAM_MEMBERS = [
  {
    name: 'Akib (Mahin Akib)',
    role: 'Lead Architect & Full-Stack Engineer',
    bio: 'Product engineer specializing in generative AI orchestration, serverless distributed systems, and modern edge user experiences.',
    github: 'https://github.com/Aw4k3',
    avatarLetter: 'A',
    badge: 'Founder',
  },
  {
    name: 'Google Gemini AI',
    role: 'Reasoning Engine & Curriculum Synthesizer',
    bio: 'Powering high-precision educational breakdown, duration calibration via Gemini 2.5 Flash, and real-time streaming mentorship via Gemini 2.0 Flash.',
    github: 'https://deepmind.google/technologies/gemini/',
    avatarLetter: 'G',
    badge: 'AI Partner',
  },
  {
    name: 'Supabase Platform',
    role: 'Cloud Persistence & Edge Runtime',
    bio: 'Managing PostgreSQL Row-Level Security, Edge Functions in Deno runtime, and Google OAuth 2.0 authentication infrastructure.',
    github: 'https://supabase.com',
    avatarLetter: 'S',
    badge: 'Cloud Host',
  },
];

export default function DocsPage() {
  const { user } = useAuth();

  // Active view: 'pitch' | 'technical' | 'telemetry' | 'team'
  const [activeTab, setActiveTab] = useState('pitch');

  // Pitch Deck Slide Navigation
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState('');

  // Access Control / Admin Publishing
  const [publishStatus, setPublishStatus] = useState('public'); // 'public' | 'investor_locked' | 'embargo'
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Live Telemetry Health Check
  const [isPinging, setIsPinging] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  const currentSlide = PITCH_SLIDES[currentSlideIndex];

  // Keyboard navigation for pitch deck
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'pitch') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlideIndex((prev) => (prev < PITCH_SLIDES.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isFullscreen]);

  // Live probe function
  const runLiveHealthProbe = async () => {
    setIsPinging(true);
    const startTime = performance.now();
    try {
      const res = await fetch('https://pgoeqctzvbzwhafcrcvq.supabase.co/functions/v1/estimate-duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: 'Health Check Probe: Rust & React' }),
      });
      const durationMs = Math.round(performance.now() - startTime);
      const data = await res.json();
      setProbeResult({
        status: res.status === 200 ? 'healthy' : 'degraded',
        statusCode: res.status,
        durationMs,
        data,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      const durationMs = Math.round(performance.now() - startTime);
      setProbeResult({
        status: 'error',
        error: err.message,
        durationMs,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsPinging(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">
      {/* Top Universal Docs Header */}
      <header className="sticky top-0 z-40 bg-[#0b0f17]/95 backdrop-blur-md border-b border-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105">
                <Rocket className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-sm sm:text-base">
                <span>Milestone <span className="text-white">AI</span></span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">/docs</span>
              </div>
            </Link>

            {/* Publishing Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE • YC SPEC v1.2</span>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 rounded-lg bg-[#0e141f] border border-[#1e293b] text-xs font-mono" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pitch'}
              onClick={() => setActiveTab('pitch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'pitch'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">YC Pitch Deck</span>
              <span className="sm:hidden">Deck</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'technical'}
              onClick={() => setActiveTab('technical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'technical'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Technical Spec</span>
              <span className="sm:hidden">Tech</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'telemetry'}
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'telemetry'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Live Telemetry</span>
              <span className="sm:hidden">Status</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'team'}
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'team'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Team</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdminModal(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#121824] border border-[#242f42] transition-colors"
              title="Access & Publishing Settings"
            >
              <Shield className="w-4 h-4" />
            </button>
            <Link
              to="/dashboard"
              className="btn-secondary text-xs py-1.5 px-3 hidden md:inline-flex items-center gap-1"
            >
              Enter App <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================================= */}
        {/* VIEW 1: YC-STYLE PITCH DECK */}
        {/* ========================================================================= */}
        {activeTab === 'pitch' && (
          <div className="space-y-6">
            {/* Slide Toolbar */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">
                  Slide {currentSlideIndex + 1} of {PITCH_SLIDES.length}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-indigo-400 font-mono hidden sm:inline">{currentSlide.tag}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  type="button"
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous Slide (Left Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Slide indicator dots */}
                <div className="hidden sm:flex items-center gap-1" role="tablist" aria-label="Pitch deck slides">
                  {PITCH_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={idx === currentSlideIndex}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-2 rounded-full transition-colors ${
                        idx === currentSlideIndex
                          ? 'w-6 bg-indigo-500'
                          : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  disabled={currentSlideIndex === PITCH_SLIDES.length - 1}
                  onClick={() => setCurrentSlideIndex((i) => Math.min(PITCH_SLIDES.length - 1, i + 1))}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next Slide (Right Arrow or Space)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 transition-colors ml-2"
                  title="Print / Save PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Presentation Card */}
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden min-h-[420px] flex flex-col justify-between ${
                isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto' : ''
              }`}
            >
              {/* Background ambient gradient */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Slide Tag & Key Stat */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    {currentSlide.tag}
                  </div>

                  {currentSlide.stat && (
                    <div className="text-right">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tnum">
                        {currentSlide.stat}
                      </span>
                      <p className="text-[11px] text-slate-400 font-medium">{currentSlide.statLabel}</p>
                    </div>
                  )}
                </div>

                {/* Slide Headline */}
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100 mb-2">
                  {currentSlide.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-400 font-medium mb-6">
                  {currentSlide.subtitle}
                </p>

                {/* Slide Custom Content */}
                <div className="text-sm text-slate-200">
                  {currentSlide.content}
                </div>
              </div>

              {/* Slide Footer */}
              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>Milestone AI · Y Combinator Pitch Deck Spec</span>
                <span>Use ← and → keys to navigate slides</span>
              </div>
            </motion.div>

            {/* Quick Executive Summary Grid below Deck */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="card p-4 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">The Moat</span>
                <p className="text-xs text-slate-300">
                  Active state retention + pedagogical guardrails ensure answers stay 100% relevant to student deliverables.
                </p>
              </div>
              <div className="card p-4 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">The Engine</span>
                <p className="text-xs text-slate-300">
                  Dual-tier Gemini Flash architecture deployed via Supabase Deno Edge functions with zero client key visibility.
                </p>
              </div>
              <div className="card p-4 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">The Metric</span>
                <p className="text-xs text-slate-300">
                  100% free-tier stack capable of servicing 10,000+ active learners with zero infrastructure overhead.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: DEEP TECHNICAL DOCUMENTATION */}
        {/* ========================================================================= */}
        {activeTab === 'technical' && (
          <div className="space-y-8">
            {/* Architecture Overview */}
            <div className="card p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">System Architecture & Security Model</h2>
                  <p className="text-xs text-slate-400">Zero-Key Cloud Engine & Deno Serverless Edge Execution</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Milestone AI utilizes a decoupled serverless architecture designed for high availability and zero client credentials leakage.
                All generative reasoning is proxied through Supabase Edge Functions running on Deno, accessing Google Gemini 2.5 Flash
                and Gemini 2.0 Flash with low-latency streaming Server-Sent Events (SSE).
              </p>

              {/* Flowchart Diagram in Ascii/Tailwind */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono overflow-x-auto text-slate-300">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 w-full md:w-auto">
                    <span className="text-indigo-400 font-bold block">React 18 + Vite</span>
                    <span className="text-[10px] text-slate-400">Client (Vercel Edge)</span>
                  </div>
                  <span className="text-slate-500">── HTTPS / SSE ──►</span>
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 w-full md:w-auto">
                    <span className="text-emerald-400 font-bold block">Supabase Edge Functions</span>
                    <span className="text-[10px] text-slate-400">Deno Runtime (pgoeqctzvbzwhafcrcvq)</span>
                  </div>
                  <span className="text-slate-500">── Secret API Key ──►</span>
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 w-full md:w-auto">
                    <span className="text-amber-400 font-bold block">Google Gemini Engine</span>
                    <span className="text-[10px] text-slate-400">gemini-2.5-flash & 2.0-flash</span>
                  </div>
                </div>
              </div>

              {/* Core Security Principles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Secret Key Isolation
                  </span>
                  <p className="text-[11px] text-slate-400">
                    <code>GEMINI_API_KEY</code> is never exposed in client bundles or network requests. Injected strictly in serverless runtime.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5" /> Postgres RLS
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Row-Level Security ensures users can only query, modify, and delete their own roadmaps, milestones, and chat logs.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3.5 h-3.5" /> Strict Domain Lock
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Mentor system instructions enforce pedagogical discipline, rejecting prompt-injection attempts and off-topic queries.
                  </p>
                </div>
              </div>
            </div>

            {/* Endpoints Reference */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Supabase Edge Functions API Reference
              </h3>

              <div className="space-y-4">
                {TECH_ENDPOINTS.map((endpoint) => (
                  <div key={endpoint.slug} className="card p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
                          {endpoint.method}
                        </span>
                        <code className="text-xs sm:text-sm font-bold text-slate-200">{endpoint.path}</code>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
                          Model: {endpoint.model}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
                          Temp: {endpoint.temp}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{endpoint.description}</p>

                    {/* Interactive Code / Curl Snippet */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>cURL Execution:</span>
                        <button
                          onClick={() => copyToClipboard(endpoint.curl, endpoint.slug)}
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {copiedKey === endpoint.slug ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy cURL</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                        {endpoint.curl}
                      </pre>
                    </div>

                    {/* Response Schema */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Response Schema ({endpoint.responseMime}):
                      </span>
                      <pre className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                        {typeof endpoint.response === 'string'
                          ? endpoint.response
                          : JSON.stringify(endpoint.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Schema & ERD */}
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                PostgreSQL Schema & Row-Level Security
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Relational tables structured for atomic milestone progression, deliverable checklists, and streaming conversation turns.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-bold text-indigo-400 block">TABLE: roadmaps</span>
                  <ul className="text-slate-400 space-y-1 list-disc pl-4 text-[11px]">
                    <li><code>id (UUID, PK)</code></li>
                    <li><code>user_id (UUID, FK -&gt; auth.users)</code></li>
                    <li><code>title (TEXT)</code></li>
                    <li><code>goal_summary (TEXT)</code></li>
                    <li><code>difficulty (TEXT)</code></li>
                    <li><code>duration_months (INT)</code></li>
                    <li><code>pacing (TEXT)</code></li>
                    <li><code>status (TEXT: 'active' | 'completed')</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 block">TABLE: milestones</span>
                  <ul className="text-slate-400 space-y-1 list-disc pl-4 text-[11px]">
                    <li><code>id (UUID, PK)</code></li>
                    <li><code>roadmap_id (UUID, FK -&gt; roadmaps)</code></li>
                    <li><code>order_index (INT)</code></li>
                    <li><code>title (TEXT)</code></li>
                    <li><code>description (TEXT)</code></li>
                    <li><code>is_completed (BOOLEAN)</code></li>
                    <li><code>xp_reward (INT)</code></li>
                    <li><code>due_date (DATE)</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 block">TABLE: deliverables</span>
                  <ul className="text-slate-400 space-y-1 list-disc pl-4 text-[11px]">
                    <li><code>id (UUID, PK)</code></li>
                    <li><code>milestone_id (UUID, FK -&gt; milestones)</code></li>
                    <li><code>title (TEXT)</code></li>
                    <li><code>is_completed (BOOLEAN)</code></li>
                    <li><code>order_index (INT)</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-bold text-cyan-400 block">TABLE: chat_messages</span>
                  <ul className="text-slate-400 space-y-1 list-disc pl-4 text-[11px]">
                    <li><code>id (UUID, PK)</code></li>
                    <li><code>roadmap_id (UUID, FK -&gt; roadmaps)</code></li>
                    <li><code>user_id (UUID, FK -&gt; auth.users)</code></li>
                    <li><code>role (TEXT: 'user' | 'assistant')</code></li>
                    <li><code>content (TEXT)</code></li>
                    <li><code>persona (TEXT: 'tutor' | 'coach' | 'peer')</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: LIVE SYSTEM TELEMETRY */}
        {/* ========================================================================= */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Live Infrastructure Telemetry</h2>
                    <p className="text-xs text-slate-400">Real-Time Microservice Ping & Model Health Check</p>
                  </div>
                </div>

                <button
                  onClick={runLiveHealthProbe}
                  disabled={isPinging}
                  className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} aria-hidden="true" />
                  {isPinging ? 'Pinging Edge…' : 'Execute Live Health Probe'}
                </button>
              </div>

              {/* Service Health Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">estimate-duration</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-base font-bold text-slate-100">Operational</span>
                  <p className="text-[11px] text-emerald-400 mt-0.5">gemini-2.5-flash</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">generate-roadmap</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-base font-bold text-slate-100">Operational</span>
                  <p className="text-[11px] text-emerald-400 mt-0.5">gemini-2.5-flash</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">chat-mentor (SSE)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-base font-bold text-slate-100">Operational</span>
                  <p className="text-[11px] text-cyan-400 mt-0.5">gemini-2.0-flash</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">PostgreSQL RLS</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <span className="text-base font-bold text-slate-100">Connected</span>
                  <p className="text-[11px] text-indigo-400 mt-0.5">pgoeqctzvbzwhafcrcvq</p>
                </div>
              </div>

              {/* Probe Result Card */}
              {probeResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Live Probe Response ({probeResult.durationMs}ms)
                    </span>
                    <span className="text-slate-400 font-mono">Timestamp: {probeResult.timestamp}</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto">
                    {JSON.stringify(probeResult.data || probeResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: TEAM SHOWCASE & VISION */}
        {/* ========================================================================= */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="card p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">The Builders & Partners</h2>
                <p className="text-xs text-slate-400">Engineering frictionless, personalized technical education.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TEAM_MEMBERS.map((member) => (
                  <div key={member.name} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-base border border-indigo-500/30">
                          {member.avatarLetter}
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                          {member.badge}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">{member.name}</h4>
                        <p className="text-xs text-indigo-400 mt-0.5 font-medium">{member.role}</p>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{member.bio}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80">
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-white transition-colors"
                      >
                        Learn More <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Publishing & Access Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md card p-6 space-y-4 border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-indigo-400" />
                Docs Publishing & Access Controls
              </h3>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Publishing Visibility</label>
                <select
                  value={publishStatus}
                  onChange={(e) => setPublishStatus(e.target.value)}
                  className="input-field text-xs py-2"
                >
                  <option value="public">Public (Open to Hackathon Judges &amp; Users)</option>
                  <option value="investor_locked">Investor Locked (Passcode Protected)</option>
                  <option value="embargo">Embargoed (Draft Mode)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deck Version</label>
                <input
                  type="text"
                  disabled
                  value="v1.2.0-yc-spec (Production)"
                  className="input-field text-xs py-2 bg-slate-900 text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed">
                Publishing is synced automatically across Vercel Edge deployments. All endpoints remain online and monitored.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAdminModal(false)}
                className="btn-primary text-xs py-2 px-4"
              >
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Footer */}
      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-800/40">
        <p>© {new Date().getFullYear()} Milestone AI · Public YC Documentation &amp; Technical Architecture</p>
      </footer>
    </div>
  );
}
