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
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Spinner from '../components/common/Spinner';
import { useRoadmapDetail } from '../hooks/useRoadmapDetail';
import { useChat } from '../hooks/useChat';
import { MENTOR_PERSONAS } from '../lib/constants';

const QUICK_PROMPTS = [
  'Give me a practical tips list for this milestone',
  'Recommend 2 mini-project ideas to practice',
  'Simplify this concept in plain English',
  'Quiz me with a scenario question',
  'How do I debug common issues?',
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

  if (roadmapLoading || chatLoading) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 font-mono">Initializing streaming mentor session...</p>
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] transition-colors"
              title="Return to Blueprint"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Domain Locked</span>
            </div>

            {/* Persona Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#0b0f17] border border-[#1e293b] text-xs">
              {MENTOR_PERSONAS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPersona(p.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    persona === p.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span className="hidden sm:inline text-[11px]">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-xl rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
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
                  <span className="block text-[10px] text-slate-500 mt-1.5 text-right font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#1a2332] border border-[#242f42] text-slate-300 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
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
          <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
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
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask mentor a technical question about your active milestone..."
              className="input-field text-xs sm:text-sm py-2.5 bg-[#0b0f17]"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="btn-primary py-2.5 px-4 shrink-0 flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
