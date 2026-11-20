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
  Zap,
  Key,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import Layout from '../components/common/Layout';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { useRoadmapDetail } from '../hooks/useRoadmapDetail';
import { useChat } from '../hooks/useChat';
import { getGeminiApiKey, setGeminiApiKey } from '../lib/gemini';
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

  // Active milestone context
  const activeMilestone = milestones.find((m) => !m.is_completed) || milestones[0];

  const { messages, isTyping, loading: chatLoading, sendMessage } = useChat(
    id,
    roadmap?.title,
    roadmap?.goal_summary,
    activeMilestone?.title
  );

  const [inputText, setInputText] = useState('');
  const [persona, setPersona] = useState('tutor');
  const [geminiModel, setGeminiModel] = useState('flash');

  // API Key Modal State
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(getGeminiApiKey()));
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySavedToast, setKeySavedToast] = useState(false);

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
    sendMessage(query, persona, geminiModel);
    setInputText('');
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setGeminiApiKey(apiKeyInput.trim());
    setHasApiKey(true);
    setKeySavedToast(true);
    setShowKeyModal(false);
    setTimeout(() => setKeySavedToast(false), 3000);
  };

  if (roadmapLoading || chatLoading) {
    return (
      <Layout>
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400">Loading AI mentor conversation...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto card overflow-hidden border-slate-800">
        {/* Chat Header */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              to={`/roadmap/${roadmap?.id || id}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Return to Blueprint"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <h1 className="text-sm sm:text-base font-bold text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                  {roadmap?.title || 'AI Mentor'}
                </h1>
              </div>
              <p className="text-[11px] text-slate-400">
                {hasApiKey ? 'Live Gemini AI Mentor Connected' : 'Pedagogical Socratic Mentor'} · Active: {activeMilestone?.title?.slice(0, 32)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* API Key Status Pill */}
            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                hasApiKey
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 animate-pulse'
              }`}
              title="Configure free Google Gemini API Key"
            >
              <Key className="w-3 h-3" />
              <span className="text-[10px] hidden sm:inline">{hasApiKey ? 'Gemini Live' : 'Add Gemini Key'}</span>
            </button>

            {/* Model Switcher inline chip */}
            <button
              type="button"
              onClick={() => setGeminiModel((m) => (m === 'flash' ? 'pro' : 'flash'))}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Toggle Gemini Flash / Pro engine"
            >
              <Zap className={`w-3 h-3 ${geminiModel === 'flash' ? 'text-amber-400' : 'text-indigo-400'}`} />
              <span className="uppercase text-[10px]">Gemini {geminiModel}</span>
            </button>

            {/* Persona Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {MENTOR_PERSONAS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPersona(p.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                    persona === p.value
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Missing API Key Helper Banner */}
        {!hasApiKey && (
          <div className="p-2.5 sm:p-3 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-slate-900 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Enable Unconstrained Live Gemini:</strong> Add your free Google AI Studio key for live custom AI reasoning!
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
              >
                Paste Key (100% Free)
              </button>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-400 hover:text-white underline inline-flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Key Saved Toast */}
        {keySavedToast && (
          <div className="p-2 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs text-center font-medium flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Gemini API key saved! Live AI Mentor is active.
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-xl rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs shadow-md'
                      : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-bl-xs'
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
                  <span className="block text-[10px] text-slate-500 mt-1.5 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 rounded-bl-xs flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-full px-3 py-1 whitespace-nowrap transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 shrink-0">
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
              placeholder="Ask mentor a curriculum question (strict domain lock)..."
              className="input-field text-xs sm:text-sm py-2.5"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="btn-primary py-2.5 px-4 shrink-0 flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Gemini API Key Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title="Connect Google Gemini API Key"
      >
        <form onSubmit={handleSaveApiKey} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              100% Free Live AI Mentor & Roadmap Generation
            </p>
            <p className="text-slate-300">
              Get a free API key in 10 seconds from Google AI Studio. No credit card required.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-indigo-400 hover:text-white inline-flex items-center gap-1 mt-1"
            >
              Get Free Key from Google AI Studio <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Paste Gemini API Key
            </label>
            <input
              type="password"
              required
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="input-field text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Save & Activate
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
