// src/pages/LandingPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Compass,
  Clock,
  BookOpen,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  Sun,
  Moon,
  Check,
  ExternalLink,
} from 'lucide-react';
import BrandMark from '../components/common/BrandMark';
import ProgressRing from '../components/common/ProgressRing';

const PLATFORM_FEATURES = [
  {
    index: '01',
    icon: Compass,
    title: 'Personalized curriculum blueprints',
    description:
      'Enter any goal, pick a 1 to 24-month duration, and get a sequenced milestone plan calibrated to daily, every-3-days, weekly, biweekly, or monthly pacing.',
  },
  {
    index: '02',
    icon: Clock,
    title: 'Duration estimator with overload safeguards',
    description:
      'Analyze scope before you commit. Year-long plans automatically guard against unsustainable daily cramming so your schedule holds up in week twelve.',
  },
  {
    index: '03',
    icon: BookOpen,
    title: 'Guided modules with verified study material',
    description:
      'Each checkpoint pairs conceptual objectives with curated courses, reference documentation, focused practice exercises, and hands-on build prompts.',
  },
  {
    index: '04',
    icon: CheckCircle2,
    title: 'Day, Week, and Month timeline tracking',
    description:
      'Work through interactive deliverable checklists with live completion ratios, active study streaks, and synced cloud persistence.',
  },
  {
    index: '05',
    icon: MessageSquare,
    title: 'Context-anchored mentor workspace',
    description:
      'Ask technical questions grounded directly in your active milestone and pending tasks—switchable between Socratic Tutor, Strict Coach, and Study Peer.',
  },
  {
    index: '06',
    icon: RefreshCw,
    title: 'Checkpoint quizzes, rebalancing, and export',
    description:
      'Validate major milestones with scenario quizzes, redistribute remaining work when schedules shift, and export complete plans to Markdown or iCalendar.',
  },
];

const SAMPLE_MILESTONES = [
  {
    index: '01',
    period: 'Week 1',
    title: 'TCP framing & concurrent servers',
    done: true,
    deliverablesCount: '3/3 verified',
  },
  {
    index: '02',
    period: 'Week 2',
    title: 'gRPC service contracts & protobuf',
    done: true,
    deliverablesCount: '3/3 verified',
  },
  {
    index: '03',
    period: 'Week 3',
    title: 'Raft leader election & heartbeats',
    done: false,
    active: true,
    deliverables: [
      { id: 'd1', label: 'Implement RequestVote RPC handler with term checks', initialDone: true },
      { id: 'd2', label: 'Persist currentTerm and votedFor before replying', initialDone: false },
      { id: 'd3', label: 'Simulate randomized election timeouts under partition', initialDone: false },
    ],
    resource: {
      title: 'MIT 6.824 Lecture 6 · Raft Consensus',
      meta: 'Lecture notes · Free',
    },
  },
  {
    index: '04',
    period: 'Week 4',
    title: 'Log replication & snapshot compaction',
    done: false,
    deliverablesCount: '0/4 verified',
  },
];

const PACING_PREVIEW = [
  { label: '3 months · Weekly', months: 3, rate: '4/mo', count: 12, safe: true },
  { label: '6 months · Every 3 days', months: 6, rate: '10/mo', count: 60, safe: true },
  { label: '12 months · Protected weekly', months: 12, rate: '4/mo', count: 48, safe: false },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [previewTab, setPreviewTab] = useState('timeline');
  const [checkedIds, setCheckedIds] = useState({ d1: true, d2: false, d3: false });
  const [pacingIdx, setPacingIdx] = useState(0);

  useEffect(() => {
    if (window.location.hash?.includes('access_token')) {
      navigate('/dashboard' + window.location.hash, { replace: true });
    } else if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const toggleSampleDeliverable = (id) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedDemoDeliverables = Object.values(checkedIds).filter(Boolean).length;
  const demoProgress = Math.round(((8 + completedDemoDeliverables) / 14) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d14] text-[#eef0f5]">
      {/* Quiet Top Navigation */}
      <nav
        className="flex items-center justify-between px-6 h-16 max-w-6xl w-full mx-auto border-b border-white/[0.08]"
        aria-label="Main Navigation"
      >
        <Link to="/" className="focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
          <BrandMark />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 text-[13px]">
          <Link
            to="/docs"
            className="font-medium text-[#a3a9b8] hover:text-[#eef0f5] px-2 py-1.5 transition-colors hidden sm:inline-block"
          >
            Docs
          </Link>
          <Link
            to="/auth"
            className="font-medium text-[#a3a9b8] hover:text-[#eef0f5] px-2 py-1.5 transition-colors"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a8296] hover:text-[#eef0f5] hover:bg-[#1a1e28] border border-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-blue-500" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
          <Link to="/auth" className="btn-primary text-[13px] h-9 px-4">
            Create blueprint
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6">
        {/* Hero: Asymmetric split with interactive product workspace */}
        <section className="py-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <h1 className="text-4xl sm:text-5xl font-medium tracking-[-0.03em] leading-[1.06] text-[#eef0f5]">
              Turn ambitious goals into structured learning blueprints
            </h1>

            <p className="text-base sm:text-lg text-[#a3a9b8] max-w-md leading-[1.6]">
              Self-directed study stalls on pacing and decision fatigue, not lack of material. Map
              any topic and timeline into sequenced milestones, curated resources, and a mentor
              anchored to your progress.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link to="/auth" className="btn-primary h-11 px-6 text-sm">
                Start free blueprint
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              </Link>
              <Link to="/docs" className="btn-secondary h-11 px-5 text-sm">
                Architecture &amp; spec
              </Link>
            </div>

            {/* Signature Benchmark Rule */}
            <div className="pt-6 border-t border-white/[0.08] flex items-center gap-6 font-mono text-xs text-[#7a8296] tnum">
              <span>01 · 1 to 24 mo timelines</span>
              <span>02 · Daily to monthly</span>
            </div>
          </div>

          {/* Interactive Coded Product Moment */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-[#11141c] border border-white/[0.12] overflow-hidden">
              {/* Studio Chrome Bar */}
              <div className="px-4 py-3 bg-[#07080d] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/[0.14]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/[0.14]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/[0.14]" />
                  </div>
                  <span className="font-mono text-xs text-[#7a8296] truncate">
                    Blueprints / Distributed Systems in Go
                  </span>
                </div>

                {/* Mode Switcher */}
                <div
                  className="inline-flex p-0.5 rounded-lg bg-[#11141c] border border-white/[0.08] text-xs font-mono"
                  role="tablist"
                  aria-label="Blueprint workspace preview"
                >
                  {[
                    { id: 'timeline', label: '01 Timeline' },
                    { id: 'mentor', label: '02 Mentor' },
                    { id: 'pacing', label: '03 Pacing' },
                  ].map((tab) => {
                    const active = previewTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setPreviewTab(tab.id)}
                        className={`px-2.5 py-1 rounded-md transition-colors ${
                          active
                            ? 'bg-[#1a1e28] text-[#eef0f5]'
                            : 'text-[#7a8296] hover:text-[#eef0f5]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview Body */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Summary Row inside Product Frame */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 font-mono text-xs text-[#7a8296] tnum">
                      <span>Intermediate</span>
                      <span>·</span>
                      <span>12 weeks</span>
                      <span>·</span>
                      <span>Weekly</span>
                    </div>
                    <p className="text-base font-medium text-[#eef0f5] truncate">
                      Distributed Systems &amp; Consensus in Go
                    </p>
                  </div>
                  <ProgressRing progress={demoProgress} size={48} strokeWidth={4} />
                </div>

                {previewTab === 'timeline' && (
                  <div className="space-y-2.5" aria-label="Interactive milestone preview">
                    {SAMPLE_MILESTONES.map((item) => {
                      if (item.active) {
                        return (
                          <div
                            key={item.index}
                            className="p-4 rounded-xl active-step-surface border space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-mono text-xs text-blue-400 font-medium tnum shrink-0">
                                  {item.index}
                                </span>
                                <span className="text-sm font-medium text-[#eef0f5] truncate">
                                  {item.title}
                                </span>
                              </div>
                              <span className="font-mono text-xs text-blue-400 shrink-0 tnum">
                                {item.period}
                              </span>
                            </div>

                            {/* Interactive Checkboxes right inside hero */}
                            <div className="space-y-1.5 pl-6">
                              {item.deliverables.map((d) => {
                                const isChecked = Boolean(checkedIds[d.id]);
                                return (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => toggleSampleDeliverable(d.id)}
                                    className="w-full text-left flex items-start gap-2.5 py-1 text-xs transition-colors group"
                                  >
                                    <span
                                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                                        isChecked
                                          ? 'bg-blue-500 border-blue-500 text-white'
                                          : 'border-white/20 bg-[#0b0d14] group-hover:border-white/40'
                                      }`}
                                    >
                                      {isChecked && <Check className="w-3 h-3" strokeWidth={2} />}
                                    </span>
                                    <span
                                      className={
                                        isChecked
                                          ? 'line-through text-[#7a8296]'
                                          : 'text-[#a3a9b8] group-hover:text-[#eef0f5]'
                                      }
                                    >
                                      {d.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="ml-6 pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-2 text-xs">
                              <span className="text-[#a3a9b8] flex items-center gap-2 truncate">
                                <BookOpen className="w-3.5 h-3.5 text-[#7a8296] shrink-0" strokeWidth={1.5} />
                                <span className="truncate">{item.resource.title}</span>
                              </span>
                              <span className="font-mono text-[11px] text-[#7a8296] shrink-0 flex items-center gap-1">
                                {item.resource.meta}
                                <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.index}
                          className="px-4 py-2.5 rounded-xl bg-[#0b0d14] border border-white/[0.08] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`font-mono text-xs tnum shrink-0 ${
                                item.done ? 'text-[#4cc38a]' : 'text-[#7a8296]'
                              }`}
                            >
                              {item.index}
                            </span>
                            <span
                              className={`text-xs truncate ${
                                item.done ? 'text-[#7a8296] line-through' : 'text-[#a3a9b8]'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-[#7a8296] shrink-0 tnum">
                            {item.period} · {item.deliverablesCount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {previewTab === 'mentor' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-[#7a8296] px-1">
                      <span>Context · Week 3: Raft leader election</span>
                      <span>Persona: Socratic Tutor</span>
                    </div>

                    <div className="space-y-3 p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08]">
                      <div className="flex justify-end">
                        <div className="max-w-[85%] px-3.5 py-2.5 rounded-xl bg-[#1a1e28] border border-white/[0.08] text-xs text-[#eef0f5]">
                          Why can two candidates split a vote even with randomized election timers?
                        </div>
                      </div>
                      <div className="space-y-2 border-l-2 border-blue-500 pl-3.5 text-xs text-[#a3a9b8] leading-relaxed">
                        <p className="text-[#eef0f5] font-medium">
                          Check how narrow your random jitter window is relative to RPC round-trip time.
                        </p>
                        <p>
                          For milestone deliverable #2, trace two nodes timing out within 4ms of each
                          other across an even cluster size—what invariant breaks if votes are not
                          flushed to stable storage before responding?
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === 'pacing' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {PACING_PREVIEW.map((opt, idx) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setPacingIdx(idx)}
                          className={`p-3 rounded-xl border text-left transition-colors ${
                            pacingIdx === idx
                              ? 'active-step-surface text-[#eef0f5]'
                              : 'bg-[#0b0d14] border-white/[0.08] text-[#7a8296] hover:text-[#eef0f5]'
                          }`}
                        >
                          <p className="font-mono text-xs text-blue-400 tnum">
                            {opt.months} mo · {opt.rate}
                          </p>
                          <p className="text-xs font-medium mt-1">{opt.label.split(' · ')[1]}</p>
                        </button>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-[#0b0d14] border border-white/[0.08] flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="font-mono text-xs text-[#7a8296]">Calculated checkpoints</span>
                        <p className="text-2xl font-medium font-mono text-[#eef0f5] tnum">
                          {PACING_PREVIEW[pacingIdx].count} milestones
                        </p>
                      </div>
                      <div className="text-right font-mono text-xs text-[#7a8296] max-w-[200px]">
                        {PACING_PREVIEW[pacingIdx].safe
                          ? 'Balanced workload across schedule'
                          : 'Overload safeguard active for 12+ mo tracks'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* System Capabilities Section */}
        <section
          aria-labelledby="platform-features-heading"
          className="py-16 border-t border-white/[0.08]"
        >
          <div className="max-w-xl mb-10">
            <h2
              id="platform-features-heading"
              className="text-2xl sm:text-3xl font-medium text-[#eef0f5] tracking-tight mb-2"
            >
              Built for sustained execution
            </h2>
            <p className="text-sm text-[#a3a9b8]">
              Six connected tools inside every blueprint, from initial scope to verified completion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-white/[0.08] rounded-xl overflow-hidden bg-[#11141c]">
            {PLATFORM_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.index}
                  className="p-6 border-r border-b border-white/[0.08] flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center text-[#a3a9b8] shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-mono text-xs text-[#7a8296] tnum">{feat.index}</span>
                      <h3 className="text-sm font-medium text-[#eef0f5]">{feat.title}</h3>
                    </div>
                    <p className="text-xs text-[#7a8296] leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-xs text-[#7a8296] py-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between max-w-6xl w-full mx-auto px-6 gap-3">
        <p>© {new Date().getFullYear()} Milestone AI · Adaptive learning blueprints</p>
        <div className="flex items-center gap-5">
          <Link to="/docs" className="text-[#7a8296] hover:text-[#eef0f5] transition-colors">
            Docs &amp; architecture
          </Link>
          <a
            href="https://github.com/Aw4k3/MileStoneAI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7a8296] hover:text-[#eef0f5] transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
