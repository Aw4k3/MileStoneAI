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
  Sparkles,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Spinner from '../components/common/Spinner';
import { useRoadmapDetail } from '../hooks/useRoadmapDetail';
import { useChat } from '../hooks/useChat';
import { MENTOR_PERSONAS } from '../lib/constants';

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
          <p className="text-xs text-slate-400 font-mono">Initializing streaming mentor session…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto rounded-2xl bg-[#121824] border border-[#242f42] overflow-hidden shadow-2xl">
        {/* Studio Header */}
        <div className="p-3.5 sm:p-4 bg-[#0e141f] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              to={`/roadmap/${roadmap?.id || id}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Return to Blueprint"
              aria-label="Return to Blueprint"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                  {roadmap?.title || 'AI Mentor'}
                </h1>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs sm:max-w-md">
                Active context: {activeMilestone?.title || 'General Curriculum'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
              <Sparkles className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              <span>Domain Locked</span>
            </div>

            {/* Persona Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#0b0f17] border border-[#1e293b] text-xs" role="radiogroup" aria-label="Mentor Persona">
              {MENTOR_PERSONAS.map((p) => (
                <button
                  key={p.value}
                  role="radio"
                  aria-checked={persona === p.value}
                  onClick={() => setPersona(p.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    persona === p.value
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span aria-hidden="true">{p.emoji}</span>
                  <span className="hidden sm:inline text-[11px]">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center space-y-3 max-w-md mx-auto">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Bot className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="text-base font-bold text-white">Your Technical Mentor is Ready</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask specific questions about <strong className="text-slate-200">{activeMilestone?.title}</strong>, request practice problems, or get code architecture guidance.
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
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-xl rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed relative group ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-[#0e141f] border border-[#1e293b] text-slate-200 rounded-bl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-xs max-w-none space-y-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-[#1e293b]/60 text-[10px] text-slate-500 font-mono">
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                        title="Copy message text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                    <span className="ml-auto">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#1a2332] border border-[#242f42] text-slate-300 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="bg-[#0e141f] border border-[#1e293b] rounded-2xl px-4 py-3 rounded-bl-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-[#0b0f17] border-t border-[#1e293b] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="text-xs text-slate-300 hover:text-white bg-[#121824] hover:bg-[#1a2332] border border-[#242f42] rounded-full px-3 py-1 whitespace-nowrap transition-colors shrink-0 font-mono text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 bg-[#0e141f] border-t border-[#1e293b] shrink-0">
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
              placeholder="Ask mentor a technical question about your active milestone…"
              className="input-field text-xs sm:text-sm py-2.5 bg-[#0b0f17]"
              aria-label="Message to mentor"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="btn-primary py-2.5 px-4 shrink-0 flex items-center justify-center disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
