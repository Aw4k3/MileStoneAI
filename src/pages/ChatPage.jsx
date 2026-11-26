// src/pages/ChatPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  GraduationCap,
  Target,
  Users,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Spinner from '../components/common/Spinner';
import { useRoadmapDetail } from '../hooks/useRoadmapDetail';
import { useChat } from '../hooks/useChat';
import { MENTOR_PERSONAS } from '../lib/constants';

const PERSONA_ICONS = {
  tutor: GraduationCap,
  coach: Target,
  peer: Users,
};

const QUICK_PROMPTS = [
  'Give me practical implementation tips for this milestone',
  'Recommend 2 mini-project ideas to practice',
  'Explain the core concept in plain English with an analogy',
  'Quiz me with a scenario question',
  'How do I debug common runtime pitfalls?',
];

export default function ChatPage() {
  const { id } = useParams();
  const { roadmap, milestones, loading: roadmapLoading } = useRoadmapDetail(id);

  const activeMilestone = milestones.find((m) => !m.is_completed) || milestones[0];

  const { messages, isTyping, loading: chatLoading, sendMessage } = useChat(
    id,
    roadmap?.title,
    roadmap?.goal_summary,
    activeMilestone?.title
  );

  const [inputText, setInputText] = useState('');
  const [persona, setPersona] = useState('tutor');
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text) => {
    const query = text || inputText;
    if (!query.trim() || isTyping) return;
    sendMessage(query, persona);
    setInputText('');
  };

  const handleCopyMessage = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (roadmapLoading || chatLoading) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-[#7a8296] font-mono">Initializing mentor workspace…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-9.5rem)] max-w-4xl mx-auto rounded-2xl bg-[#11141c] border border-white/[0.1] overflow-hidden">
        {/* Studio Header */}
        <div className="px-4 py-3 bg-[#07080d] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/roadmap/${roadmap?.id || id}`}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a8296] hover:text-[#eef0f5] hover:bg-[#1a1e28] border border-white/[0.08] transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Return to blueprint"
              aria-label="Return to blueprint"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4cc38a] shrink-0" aria-hidden="true" />
                <h1 className="text-sm font-medium text-[#eef0f5] truncate max-w-[200px] sm:max-w-xs">
                  {roadmap?.title || 'AI Mentor'}
                </h1>
              </div>
              <p className="text-xs font-mono text-[#7a8296] truncate max-w-xs sm:max-w-md">
                Context · {activeMilestone?.title || 'General curriculum'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[#7a8296] font-mono text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4cc38a]" strokeWidth={1.5} aria-hidden="true" />
              <span>Context locked</span>
            </div>

            {/* Persona Switcher */}
            <div
              className="flex items-center p-0.5 rounded-lg bg-[#11141c] border border-white/[0.08] text-xs"
              role="radiogroup"
              aria-label="Mentor Persona"
            >
              {MENTOR_PERSONAS.map((p) => {
                const Icon = PERSONA_ICONS[p.value] || Bot;
                const active = persona === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPersona(p.value)}
                    className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#1a1e28] text-[#eef0f5]'
                        : 'text-[#7a8296] hover:text-[#eef0f5]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                    <span className="hidden sm:inline">{p.label.split(' ')[1] || p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center space-y-3 max-w-md mx-auto">
              <div className="w-10 h-10 rounded-lg bg-[#1a1e28] border border-white/[0.08] text-[#a3a9b8] flex items-center justify-center mx-auto">
                <Bot className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h2 className="text-base font-medium text-[#eef0f5]">Technical mentor ready</h2>
              <p className="text-xs text-[#7a8296] leading-relaxed">
                Ask questions about{' '}
                <strong className="text-[#eef0f5] font-medium">{activeMilestone?.title}</strong>,
                request practice exercises, or verify architectural decisions.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#1a1e28] border border-white/[0.08] text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-xl rounded-xl px-4 py-3 text-xs sm:text-sm leading-relaxed relative ${
                    isUser
                      ? 'bg-[#1a1e28] border border-white/[0.12] text-[#eef0f5]'
                      : 'bg-[#0b0d14] border border-white/[0.08] text-[#eef0f5]'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-xs max-w-none space-y-2 text-[#a3a9b8]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-white/[0.06] text-[11px] text-[#7a8296] font-mono">
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="text-[#7a8296] hover:text-[#eef0f5] flex items-center gap-1 transition-colors"
                        title="Copy message text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#4cc38a]" strokeWidth={1.5} aria-hidden="true" />
                            <span className="text-[#4cc38a]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                    <span className="ml-auto tnum">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#1a1e28] border border-white/[0.08] text-[#a3a9b8] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[#1a1e28] border border-white/[0.08] text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div className="bg-[#0b0d14] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-mono text-[#7a8296]">
                <Spinner size="sm" />
                <span>Thinking…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2.5 bg-[#07080d] border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto shrink-0">
          <Terminal className="w-3.5 h-3.5 text-[#7a8296] shrink-0" strokeWidth={1.5} aria-hidden="true" />
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="text-xs text-[#a3a9b8] hover:text-[#eef0f5] bg-[#11141c] hover:bg-[#1a1e28] border border-white/[0.08] rounded-lg px-2.5 h-7 whitespace-nowrap transition-colors shrink-0 font-mono"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 bg-[#11141c] border-t border-white/[0.08] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="chat-message-input"
              name="message"
              type="text"
              autoComplete="off"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask mentor about your active milestone…"
              className="input-field text-xs sm:text-sm h-10"
              aria-label="Message to mentor"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="btn-primary h-10 px-4 shrink-0 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
