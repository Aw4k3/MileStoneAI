// src/pages/DocsPage.jsx
// Live /docs Module: YC-Style Pitch Deck + Technical Documentation + Live Telemetry

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Presentation,
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
  Cpu,
  Database,
  Terminal,
  Lock,
  Download,
  Layers,
  ArrowRight,
  RefreshCw,
  Compass,
  X,
} from 'lucide-react';
import BrandMark from '../components/common/BrandMark';

const PITCH_SLIDES = [
  {
    id: 1,
    tag: 'The vision & hook',
    title: 'Milestone AI',
    subtitle: 'From blank ambition to structured mastery in seconds',
    stat: '10x',
    statLabel: 'Faster curriculum formulation vs manual search',
    content: (
      <div className="space-y-4">
        <p className="text-base sm:text-lg text-[#a3a9b8] leading-relaxed">
          An adaptive, context-anchored curriculum generator. Milestone AI transforms
          natural-language career goals into week-by-week production blueprints with verified
          resources and a 24/7 guardrailed AI mentor.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <span className="text-xs font-mono text-blue-400">Zero fluff</span>
            <p className="text-xs text-[#a3a9b8] mt-1">
              Real documentation, verified courses, and concrete code deliverables.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <span className="text-xs font-mono text-[#4cc38a]">Context-aware</span>
            <p className="text-xs text-[#a3a9b8] mt-1">
              AI mentor injected with active milestone state and progress history.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <span className="text-xs font-mono text-amber-400">$0 operating cost</span>
            <p className="text-xs text-[#a3a9b8] mt-1">
              Engineered on Google Gemini Flash and Supabase Edge for free-tier scale.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    tag: 'The problem',
    title: 'The tutorial hell & blank calendar crisis',
    subtitle: 'Self-directed learners suffer from decision fatigue, not lack of content',
    stat: '73%',
    statLabel: 'Drop-out rate for self-directed tech upskilling courses',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-[#e5484d] border border-rose-500/20 flex items-center justify-center font-mono text-xs mb-2.5 tnum">
              01
            </div>
            <h4 className="font-medium text-[#eef0f5] text-sm mb-1">Information overload</h4>
            <p className="text-xs text-[#a3a9b8] leading-relaxed">
              Learners bookmark 50 fragmented YouTube videos, outdated articles, and random GitHub repos, leading to immediate overwhelm.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-[#e5484d] border border-rose-500/20 flex items-center justify-center font-mono text-xs mb-2.5 tnum">
              02
            </div>
            <h4 className="font-medium text-[#eef0f5] text-sm mb-1">The blank calendar</h4>
            <p className="text-xs text-[#a3a9b8] leading-relaxed">
              No realistic sequencing. Learners stall when they cannot judge whether a topic takes 3 days or 3 weeks.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-[#e5484d] border border-rose-500/20 flex items-center justify-center font-mono text-xs mb-2.5 tnum">
              03
            </div>
            <h4 className="font-medium text-[#eef0f5] text-sm mb-1">Stateless chatbots</h4>
            <p className="text-xs text-[#a3a9b8] leading-relaxed">
              Generic prompts return generic replies without remembering what you finished yesterday or where you are stuck.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    tag: 'The solution',
    title: 'Adaptive learning blueprints',
    subtitle: 'An AI curriculum architect paired with a state-aware mentor',
    stat: '15s',
    statLabel: 'Average time to generate a verified 16-week path',
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
          <h4 className="font-medium text-[#eef0f5] text-sm mb-3">How Milestone AI solves the triad</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#a3a9b8]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4cc38a] shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>
                <strong className="text-[#eef0f5] font-medium">Structured synthesis:</strong> breaks goals into progressive milestones with deliverables.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4cc38a] shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>
                <strong className="text-[#eef0f5] font-medium">Calibrated pacing:</strong> duration estimator balances scope against timeline complexity.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4cc38a] shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>
                <strong className="text-[#eef0f5] font-medium">Guardrailed mentor:</strong> low-latency chat contextualized with active roadmap state.
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs text-[#7a8296]">
          <span className="px-2.5 py-1 rounded-md bg-[#0b0d14] border border-white/[0.08]">Zero-key client architecture</span>
          <span className="px-2.5 py-1 rounded-md bg-[#0b0d14] border border-white/[0.08]">Real-time SSE streaming</span>
          <span className="px-2.5 py-1 rounded-md bg-[#0b0d14] border border-white/[0.08]">PostgreSQL RLS isolation</span>
          <span className="px-2.5 py-1 rounded-md bg-[#0b0d14] border border-white/[0.08]">XP &amp; streak tracking</span>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    tag: 'Product & secret sauce',
    title: 'Context-aware AI mentor & zero-key stack',
    subtitle: 'State retention plus edge execution keep learners moving',
    stat: '<120ms',
    statLabel: 'Time-to-first-token with Gemini streaming',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <h4 className="font-medium text-[#eef0f5] text-sm mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
              Dynamic context injection
            </h4>
            <p className="text-xs text-[#a3a9b8] leading-relaxed">
              Every mentor query injects current roadmap title, completion ratio, active milestone,
              completed tasks, and pending deliverables. The mentor sees exact progress.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <h4 className="font-medium text-[#eef0f5] text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4cc38a]" strokeWidth={1.5} />
              Zero client visibility
            </h4>
            <p className="text-xs text-[#a3a9b8] leading-relaxed">
              API keys live strictly in Supabase backend secrets. Clients never supply keys or select models,
              protecting quotas and keeping the flow one-click.
            </p>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0b0d14] border border-white/[0.08] text-xs text-[#a3a9b8]">
          <strong className="text-[#eef0f5] font-medium">Pedagogical personas:</strong> switch anytime between Socratic Tutor (guides discovery),
          Strict Coach (deliverable discipline), and Study Peer (collaborative troubleshooting).
        </div>
      </div>
    ),
  },
  {
    id: 5,
    tag: 'Market opportunity',
    title: 'The $420B self-directed upskilling economy',
    subtitle: 'Continuous technical education and career pivoting at global scale',
    stat: '$420B',
    statLabel: 'Global market size for self-paced digital upskilling',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] text-center">
            <span className="text-2xl font-medium text-[#eef0f5] tnum">$420B</span>
            <p className="text-xs text-blue-400 mt-0.5">TAM</p>
            <p className="text-[11px] text-[#7a8296] mt-1 font-sans">Total addressable global online learning market.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] text-center">
            <span className="text-2xl font-medium text-[#eef0f5] tnum">$48B</span>
            <p className="text-xs text-[#4cc38a] mt-0.5">SAM</p>
            <p className="text-[11px] text-[#7a8296] mt-1 font-sans">Software engineering, AI, DevOps, and STEM transitioners.</p>
          </div>
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] text-center">
            <span className="text-2xl font-medium text-[#eef0f5] tnum">$4.2B</span>
            <p className="text-xs text-amber-400 mt-0.5">SOM</p>
            <p className="text-[11px] text-[#7a8296] mt-1 font-sans">Early adopters of AI curriculum copilots.</p>
          </div>
        </div>
        <p className="text-xs text-[#a3a9b8] leading-relaxed bg-[#0b0d14] p-3.5 rounded-xl border border-white/[0.08]">
          <strong className="text-[#eef0f5] font-medium">Why now:</strong> fast Gemini Flash inference synthesizes full structured curricula and
          streams low-latency mentorship at fractions of a cent per session.
        </p>
      </div>
    ),
  },
  {
    id: 6,
    tag: 'Business model & unit economics',
    title: 'Freemium B2C + cohort B2B licensing',
    subtitle: '98%+ gross margins powered by serverless edge execution',
    stat: '98%',
    statLabel: 'Gross margin via edge token routing',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-[#eef0f5] text-sm">B2C Freemium &amp; Pro</h4>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 tnum">$12 / mo</span>
          </div>
          <ul className="text-xs text-[#a3a9b8] space-y-1.5 list-disc pl-4">
            <li><strong className="text-[#eef0f5] font-medium">Free tier:</strong> 2 active roadmaps, mentor chat, curated public resources.</li>
            <li><strong className="text-[#eef0f5] font-medium">Pro tier ($12/mo):</strong> unlimited blueprints, quiz certification, GitHub deliverable review.</li>
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-[#eef0f5] text-sm">B2B education &amp; bootcamps</h4>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-[#4cc38a] tnum">$25 / seat</span>
          </div>
          <ul className="text-xs text-[#a3a9b8] space-y-1.5 list-disc pl-4">
            <li><strong className="text-[#eef0f5] font-medium">Cohort dashboard:</strong> instructors assign blueprints and track milestone telemetry.</li>
            <li><strong className="text-[#eef0f5] font-medium">Curriculum export:</strong> syllabus generation with verified reading lists.</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    tag: 'Competitive advantage',
    title: 'Why Milestone AI wins',
    subtitle: 'State-aware execution outperforms static playlists and stateless chats',
    stat: '3x',
    statLabel: 'Higher milestone completion vs traditional MOOCs',
    content: (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.1] text-[#7a8296]">
              <th className="py-2.5 px-3 font-medium">Capability</th>
              <th className="py-2.5 px-3 text-blue-400 font-medium bg-blue-500/10 rounded-t-md">Milestone AI</th>
              <th className="py-2.5 px-3 font-medium">ChatGPT / Claude</th>
              <th className="py-2.5 px-3 font-medium">Coursera / Udemy</th>
              <th className="py-2.5 px-3 font-medium">Notion templates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-[#a3a9b8]">
            <tr>
              <td className="py-2.5 px-3 font-medium text-[#eef0f5]">Curriculum synthesis</td>
              <td className="py-2.5 px-3 font-medium text-[#4cc38a] bg-blue-500/5">Instant (4–16+ weeks)</td>
              <td className="py-2.5 px-3 text-amber-400">Unformatted text</td>
              <td className="py-2.5 px-3 text-[#7a8296]">Pre-recorded static</td>
              <td className="py-2.5 px-3 text-[#e5484d]">Manual entry</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-medium text-[#eef0f5]">Context-aware mentor</td>
              <td className="py-2.5 px-3 font-medium text-[#4cc38a] bg-blue-500/5">Roadmap state locked</td>
              <td className="py-2.5 px-3 text-[#e5484d]">Stateless</td>
              <td className="py-2.5 px-3 text-[#e5484d]">Static forum</td>
              <td className="py-2.5 px-3 text-[#e5484d]">None</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-medium text-[#eef0f5]">Actionable deliverables</td>
              <td className="py-2.5 px-3 font-medium text-[#4cc38a] bg-blue-500/5">Checklist + XP</td>
              <td className="py-2.5 px-3 text-amber-400">Plain list</td>
              <td className="py-2.5 px-3 text-[#7a8296]">Passive video</td>
              <td className="py-2.5 px-3 text-amber-400">Static boxes</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-medium text-[#eef0f5]">Adaptive rescheduling</td>
              <td className="py-2.5 px-3 font-medium text-[#4cc38a] bg-blue-500/5">AI rebalance</td>
              <td className="py-2.5 px-3 text-[#e5484d]">None</td>
              <td className="py-2.5 px-3 text-[#e5484d]">Fixed cohorts</td>
              <td className="py-2.5 px-3 text-[#e5484d]">Manual edits</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 8,
    tag: 'Traction & validation',
    title: 'Shipped, deployed & live in production',
    subtitle: 'Verified end-to-end across Vercel Edge and Supabase',
    stat: '100%',
    statLabel: 'Uptime across edge microservices',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
          <div className="p-3.5 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <span className="text-base font-medium text-[#4cc38a]">Live</span>
            <p className="text-[11px] text-[#7a8296] mt-1 font-sans">milestonegen.vercel.app</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <span className="text-base font-medium text-blue-400">Edge Fn</span>
            <p className="text-[11px] text-[#7a8296] mt-1 font-sans">Deno + Gemini microservices</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <span className="text-base font-medium text-amber-400">Auth-first</span>
            <p className="text-[11px] text-[#7a8296] mt-1 font-sans">Google OAuth + RLS</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
            <span className="text-base font-medium text-[#eef0f5]">SSE Stream</span>
            <p className="text-[11px] text-[#7a8296] mt-1 font-sans">Low-latency responses</p>
          </div>
        </div>
        <p className="text-xs text-[#a3a9b8] leading-relaxed">
          Verified end-to-end: Google OAuth authentication, PostgreSQL Row-Level Security isolation,
          automated duration estimation, full blueprint compilation, and real-time mentor chat.
        </p>
      </div>
    ),
  },
  {
    id: 9,
    tag: 'The roadmap & vision',
    title: 'What we are building next',
    subtitle: 'Evolving Milestone AI into an autonomous learning workspace',
    stat: 'Q1–Q2',
    statLabel: 'Release targets for verification & cohorts',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-xs tnum">P1</span>
            <h4 className="font-medium text-[#eef0f5] text-xs">GitHub auto-checkers</h4>
          </div>
          <p className="text-xs text-[#7a8296]">
            Link a repository to a deliverable and automatically verify test suites before checking off milestones.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[#4cc38a] font-mono text-xs tnum">P2</span>
            <h4 className="font-medium text-[#eef0f5] text-xs">Adaptive quizzes</h4>
          </div>
          <p className="text-xs text-[#7a8296]">
            Targeted scenario questions per checkpoint to validate comprehension and unlock verified badges.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-xs tnum">P3</span>
            <h4 className="font-medium text-[#eef0f5] text-xs">Peer study cohorts</h4>
          </div>
          <p className="text-xs text-[#7a8296]">
            Sync blueprints with teammates or classmates, compare progress, and review deliverable code together.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 10,
    tag: 'The ask & close',
    title: 'Join us in structured technical mastery',
    subtitle: 'Every self-directed learner deserves a disciplined curriculum architect',
    stat: 'Now',
    statLabel: 'Seeking seed partners & pilot education cohorts',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[#a3a9b8] leading-relaxed">
          We are partnering with angel investors, seed funds, and university or bootcamp pilot cohorts
          to expand automated evaluation and bring structured blueprints to learners worldwide.
        </p>
        <div className="p-4 rounded-xl bg-[#0b0d14] border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-medium text-[#eef0f5] text-sm">Experience the live application</h4>
            <p className="text-xs text-[#7a8296]">Live on Vercel Edge with zero-key Gemini cloud routing.</p>
          </div>
          <Link to="/auth" className="btn-primary h-9 px-4 text-xs shrink-0">
            Try Milestone AI
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="text-center pt-2">
          <span className="text-xs text-[#7a8296]">
            Built with Gemini, Supabase Postgres &amp; Vercel Edge · Open Source MIT
          </span>
        </div>
      </div>
    ),
  },
];

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
    bio: 'Powering high-precision educational breakdown, duration calibration, and real-time streaming mentorship.',
    github: 'https://deepmind.google/technologies/gemini/',
    avatarLetter: 'G',
    badge: 'AI partner',
  },
  {
    name: 'Supabase Platform',
    role: 'Cloud Persistence & Edge Runtime',
    bio: 'Managing PostgreSQL Row-Level Security, Edge Functions in Deno runtime, and Google OAuth 2.0 authentication.',
    github: 'https://supabase.com',
    avatarLetter: 'S',
    badge: 'Cloud host',
  },
];

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('pitch');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState('');
  const [publishStatus, setPublishStatus] = useState('public');
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [isPinging, setIsPinging] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  const currentSlide = PITCH_SLIDES[currentSlideIndex];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'pitch') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlideIndex((prev) => (prev < PITCH_SLIDES.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

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
    <div className="min-h-screen flex flex-col bg-[#0b0d14] text-[#eef0f5]">
      {/* Docs Top Header */}
      <header className="sticky top-0 z-40 bg-[#0b0d14]/95 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
              <BrandMark suffix="/docs" />
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 text-[#7a8296] text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cc38a]" />
              <span>v1.2</span>
            </div>
          </div>

          <div
            className="flex items-center p-1 rounded-lg bg-[#07080d] border border-white/[0.08] text-xs font-mono"
            role="tablist"
          >
            {[
              { id: 'pitch', label: 'Pitch deck', short: 'Deck', icon: Presentation },
              { id: 'technical', label: 'Technical spec', short: 'Tech', icon: Terminal },
              { id: 'telemetry', label: 'Live status', short: 'Status', icon: Activity },
              { id: 'team', label: 'Team', short: 'Team', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 h-7 rounded-md font-medium transition-colors ${
                    active ? 'bg-[#1a1e28] text-[#eef0f5]' : 'text-[#7a8296] hover:text-[#eef0f5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a8296] hover:text-[#eef0f5] hover:bg-[#1a1e28] border border-white/[0.08] transition-colors"
              title="Access & publishing settings"
              aria-label="Access & publishing settings"
            >
              <Shield className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <Link to="/dashboard" className="btn-secondary text-xs h-8 px-3 hidden md:inline-flex">
              Enter app <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW 1: PITCH DECK */}
        {activeTab === 'pitch' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#11141c] border border-white/[0.08] text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[#eef0f5] tnum">
                  Slide {String(currentSlideIndex + 1).padStart(2, '0')} / {String(PITCH_SLIDES.length).padStart(2, '0')}
                </span>
                <span className="text-[#7a8296]">·</span>
                <span className="text-blue-400 font-mono hidden sm:inline">{currentSlide.tag}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a3a9b8] hover:text-[#eef0f5] bg-[#1a1e28] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous slide (Left arrow)"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                </button>

                <div className="hidden sm:flex items-center gap-1" role="tablist" aria-label="Pitch deck slides">
                  {PITCH_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={idx === currentSlideIndex}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-colors ${
                        idx === currentSlideIndex ? 'w-5 bg-blue-500' : 'w-1.5 bg-white/15 hover:bg-white/30'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentSlideIndex === PITCH_SLIDES.length - 1}
                  onClick={() => setCurrentSlideIndex((i) => Math.min(PITCH_SLIDES.length - 1, i + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a3a9b8] hover:text-[#eef0f5] bg-[#1a1e28] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next slide (Right arrow or Space)"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a3a9b8] hover:text-[#eef0f5] bg-[#1a1e28] transition-colors ml-1"
                  title="Print or save PDF"
                >
                  <Download className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="p-6 sm:p-10 rounded-2xl bg-[#11141c] border border-white/[0.1] min-h-[400px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
                    {currentSlide.tag}
                  </span>

                  {currentSlide.stat && (
                    <div className="text-right">
                      <span className="text-3xl font-medium text-[#eef0f5] font-mono tnum">
                        {currentSlide.stat}
                      </span>
                      <p className="text-xs text-[#7a8296]">{currentSlide.statLabel}</p>
                    </div>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#eef0f5] mb-2">
                  {currentSlide.title}
                </h2>
                <p className="text-sm sm:text-base text-[#7a8296] mb-6">
                  {currentSlide.subtitle}
                </p>

                <div className="text-sm text-[#a3a9b8]">{currentSlide.content}</div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#7a8296] font-mono">
                <span>Milestone AI · Architecture pitch deck</span>
                <span>Use arrow keys to navigate</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="card space-y-1">
                <span className="text-xs font-mono text-[#7a8296]">The moat</span>
                <p className="text-xs text-[#a3a9b8]">
                  Active state retention and pedagogical guardrails keep answers aligned with student deliverables.
                </p>
              </div>
              <div className="card space-y-1">
                <span className="text-xs font-mono text-[#7a8296]">The engine</span>
                <p className="text-xs text-[#a3a9b8]">
                  Gemini synthesis routed through Supabase Edge functions with zero client key exposure.
                </p>
              </div>
              <div className="card space-y-1">
                <span className="text-xs font-mono text-[#7a8296]">The stack</span>
                <p className="text-xs text-[#a3a9b8]">
                  Serverless edge stack designed to support thousands of active learners cleanly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: TECHNICAL DOCUMENTATION */}
        {activeTab === 'technical' && (
          <div className="space-y-8">
            <div className="card p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1a1e28] border border-white/[0.08] text-[#a3a9b8] flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-[#eef0f5]">System architecture &amp; security model</h2>
                  <p className="text-xs text-[#7a8296]">Zero-key cloud engine &amp; Deno serverless edge execution</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#a3a9b8] leading-relaxed">
                Milestone AI utilizes a decoupled serverless architecture designed for high availability and zero client credentials leakage.
                All generative reasoning is proxied through Supabase Edge Functions running on Deno, accessing Google Gemini
                with streaming Server-Sent Events (SSE).
              </p>

              <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] text-xs font-mono overflow-x-auto text-[#a3a9b8]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
                  <div className="p-3 rounded-lg bg-[#11141c] border border-white/[0.08] w-full md:w-auto">
                    <span className="text-blue-400 font-medium block">React 19 + Vite</span>
                    <span className="text-[11px] text-[#7a8296]">Client (Vercel Edge)</span>
                  </div>
                  <span className="text-[#7a8296]">── HTTPS / SSE ──►</span>
                  <div className="p-3 rounded-lg bg-[#11141c] border border-white/[0.08] w-full md:w-auto">
                    <span className="text-[#4cc38a] font-medium block">Supabase Edge Functions</span>
                    <span className="text-[11px] text-[#7a8296]">Deno Runtime (pgoeqctzvbzwhafcrcvq)</span>
                  </div>
                  <span className="text-[#7a8296]">── Secret API Key ──►</span>
                  <div className="p-3 rounded-lg bg-[#11141c] border border-white/[0.08] w-full md:w-auto">
                    <span className="text-amber-400 font-medium block">Google Gemini Engine</span>
                    <span className="text-[11px] text-[#7a8296]">Auto-fallback routing</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
                  <span className="text-xs font-medium text-[#4cc38a] flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} /> Secret key isolation
                  </span>
                  <p className="text-xs text-[#7a8296]">
                    <code>GEMINI_API_KEY</code> is never exposed in client bundles or network requests. Injected strictly in serverless runtime.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
                  <span className="text-xs font-medium text-blue-400 flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5" strokeWidth={1.5} /> Postgres RLS
                  </span>
                  <p className="text-xs text-[#7a8296]">
                    Row-Level Security ensures users can only query, modify, and delete their own roadmaps, milestones, and chat logs.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3.5 h-3.5" strokeWidth={1.5} /> Strict domain lock
                  </span>
                  <p className="text-xs text-[#7a8296]">
                    Mentor system instructions enforce pedagogical discipline, rejecting prompt-injection attempts and off-topic queries.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-medium text-[#eef0f5] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} />
                Supabase Edge Functions API reference
              </h3>

              <div className="space-y-4">
                {TECH_ENDPOINTS.map((endpoint) => (
                  <div key={endpoint.slug} className="card p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-xs">
                          {endpoint.method}
                        </span>
                        <code className="text-xs sm:text-sm font-medium text-[#eef0f5]">{endpoint.path}</code>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-[#0b0d14] border border-white/[0.08] text-[#a3a9b8]">
                          Model: {endpoint.model}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#0b0d14] border border-white/[0.08] text-[#a3a9b8]">
                          Temp: {endpoint.temp}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#a3a9b8] leading-relaxed">{endpoint.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#7a8296]">
                        <span>cURL execution</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(endpoint.curl, endpoint.slug)}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {copiedKey === endpoint.slug ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#4cc38a]" strokeWidth={1.5} />
                              <span className="text-[#4cc38a]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                              <span>Copy cURL</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3.5 rounded-lg bg-[#0b0d14] border border-white/[0.08] text-xs font-mono text-[#a3a9b8] overflow-x-auto whitespace-pre-wrap break-words">
                        {endpoint.curl}
                      </pre>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-[#7a8296] block">
                        Response schema ({endpoint.responseMime})
                      </span>
                      <pre className="p-3.5 rounded-lg bg-[#0b0d14] border border-white/[0.08] text-xs font-mono text-[#a3a9b8] overflow-x-auto max-h-48 whitespace-pre-wrap break-words">
                        {typeof endpoint.response === 'string'
                          ? endpoint.response
                          : JSON.stringify(endpoint.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h3 className="text-base font-medium text-[#eef0f5] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} />
                PostgreSQL schema &amp; Row-Level Security
              </h3>
              <p className="text-xs text-[#a3a9b8] leading-relaxed">
                Relational tables structured for atomic milestone progression, deliverable checklists, and conversation turns.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] space-y-2">
                  <span className="font-medium text-blue-400 block">roadmaps</span>
                  <ul className="text-[#7a8296] space-y-1 list-disc pl-4 text-xs">
                    <li><code>id (UUID, PK)</code></li>
                    <li><code>user_id (UUID, FK -&gt; auth.users)</code></li>
                    <li><code>title (TEXT)</code></li>
                    <li><code>goal_summary (TEXT)</code></li>
                    <li><code>difficulty (TEXT)</code></li>
                    <li><code>duration_months (INT)</code></li>
                    <li><code>pacing (TEXT)</code></li>
                    <li><code>status (TEXT: &apos;active&apos; | &apos;completed&apos;)</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] space-y-2">
                  <span className="font-medium text-[#4cc38a] block">milestones</span>
                  <ul className="text-[#7a8296] space-y-1 list-disc pl-4 text-xs">
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

                <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] space-y-2">
                  <span className="font-medium text-amber-400 block">deliverables</span>
                  <ul className="text-[#7a8296] space-y-1 list-disc pl-4 text-xs">
                    <li><code>id (UUID, PK)</code></li>
                    <li><code>milestone_id (UUID, FK -&gt; milestones)</code></li>
                    <li><code>title (TEXT)</code></li>
                    <li><code>is_completed (BOOLEAN)</code></li>
                    <li><code>order_index (INT)</code></li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] space-y-2">
                  <span className="font-medium text-[#eef0f5] block">chat_messages</span>
                  <ul className="text-[#7a8296] space-y-1 list-disc pl-4 text-xs">
                    <li><code>id (UUID, PK)</code></li>
                    <li><code>roadmap_id (UUID, FK -&gt; roadmaps)</code></li>
                    <li><code>user_id (UUID, FK -&gt; auth.users)</code></li>
                    <li><code>role (TEXT: &apos;user&apos; | &apos;assistant&apos;)</code></li>
                    <li><code>content (TEXT)</code></li>
                    <li><code>persona (TEXT: &apos;tutor&apos; | &apos;coach&apos; | &apos;peer&apos;)</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: LIVE TELEMETRY */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1a1e28] border border-white/[0.08] text-[#4cc38a] flex items-center justify-center">
                    <Activity className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-[#eef0f5]">Live infrastructure telemetry</h2>
                    <p className="text-xs text-[#7a8296]">Microservice latency &amp; health verification</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runLiveHealthProbe}
                  disabled={isPinging}
                  className="btn-primary h-9 px-4 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} strokeWidth={1.5} aria-hidden="true" />
                  {isPinging ? 'Pinging edge…' : 'Execute health probe'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: 'estimate-duration', state: 'Operational', sub: 'Supabase Edge' },
                  { name: 'generate-roadmap', state: 'Operational', sub: 'Supabase Edge' },
                  { name: 'chat-mentor (SSE)', state: 'Operational', sub: 'Streaming enabled' },
                  { name: 'PostgreSQL RLS', state: 'Connected', sub: 'pgoeqctzvbzwhafcrcvq' },
                ].map((svc) => (
                  <div key={svc.name} className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#7a8296] font-mono">{svc.name}</span>
                      <span className="w-2 h-2 rounded-full bg-[#4cc38a]" />
                    </div>
                    <span className="text-base font-medium text-[#eef0f5]">{svc.state}</span>
                    <p className="text-xs text-[#7a8296] mt-0.5 font-mono">{svc.sub}</p>
                  </div>
                ))}
              </div>

              {probeResult && (
                <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#eef0f5] flex items-center gap-1.5 tnum">
                      <CheckCircle2 className="w-4 h-4 text-[#4cc38a]" strokeWidth={1.5} />
                      Live probe response ({probeResult.durationMs}ms)
                    </span>
                    <span className="text-[#7a8296] font-mono">{probeResult.timestamp}</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-[#07080d] font-mono text-xs text-[#a3a9b8] overflow-x-auto">
                    {JSON.stringify(probeResult.data || probeResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: TEAM */}
        {activeTab === 'team' && (
          <div className="card p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-[#eef0f5]">Builders &amp; partners</h2>
              <p className="text-xs text-[#7a8296]">Engineering structured technical education</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TEAM_MEMBERS.map((member) => (
                <div key={member.name} className="p-5 rounded-xl bg-[#0b0d14] border border-white/[0.08] flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-[#1a1e28] text-[#eef0f5] flex items-center justify-center font-mono text-sm border border-white/[0.08]">
                        {member.avatarLetter}
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {member.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#eef0f5] text-sm">{member.name}</h4>
                      <p className="text-xs text-blue-400 mt-0.5">{member.role}</p>
                    </div>
                    <p className="text-xs text-[#7a8296] leading-relaxed">{member.bio}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.08]">
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#a3a9b8] hover:text-[#eef0f5] transition-colors"
                    >
                      Learn more <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Admin Access Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11141c] border border-white/[0.12] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="font-medium text-[#eef0f5] flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-[#7a8296]" strokeWidth={1.5} />
                Docs publishing controls
              </h3>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1.5 rounded-lg text-[#7a8296] hover:text-[#eef0f5] hover:bg-[#1a1e28] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#a3a9b8] font-medium mb-1">Publishing visibility</label>
                <select
                  value={publishStatus}
                  onChange={(e) => setPublishStatus(e.target.value)}
                  className="input-field text-xs h-9"
                >
                  <option value="public">Public (open access)</option>
                  <option value="investor_locked">Investor locked (passcode)</option>
                  <option value="embargo">Embargoed (draft)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#a3a9b8] font-medium mb-1">Deck version</label>
                <input
                  type="text"
                  disabled
                  value="v1.2.0-spec (Production)"
                  className="input-field text-xs h-9 opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="btn-primary text-xs h-9 px-4"
              >
                Save &amp; close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-[#7a8296] py-6 border-t border-white/[0.08]">
        <p>© {new Date().getFullYear()} Milestone AI · Architecture &amp; Technical Documentation</p>
      </footer>
    </div>
  );
}
