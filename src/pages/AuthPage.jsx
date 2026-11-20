// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Rocket, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/common/Spinner';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { user, login, signup, loginWithGoogle, loading, wipeAllLocalData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both your email and password.');
      return;
    }

    try {
      if (isSignUp) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      setFormError('');
      await loginWithGoogle();
    } catch (err) {
      setIsGoogleLoading(false);
      setFormError(err.message || 'Google sign-in could not be completed.');
    }
  };

  const handleDemoLogin = async () => {
    try {
      setFormError('');
      await login('demo@milestoneai.dev', 'DemoPass123!');
      navigate('/dashboard');
    } catch {
      // Fallback: create or proceed
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#0b0f17] text-slate-100">
      {/* Brand Header */}
      <Link
        to="/"
        className="flex items-center gap-3 mb-8 group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
        aria-label="Milestone AI Home"
      >
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105 shadow-sm">
          <Rocket className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-xl text-white">
          <span>Milestone</span>
          <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            AI
          </span>
        </div>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-sm bg-[#121824] border border-[#242f42] rounded-2xl p-6 sm:p-7 shadow-xl">
        {/* Segmented Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-lg bg-[#0d131d] border border-[#1e293b] mb-6 text-xs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => {
              setIsSignUp(false);
              setFormError('');
            }}
            className={`py-1.5 font-medium rounded-md transition-colors ${
              !isSignUp ? 'bg-[#1a2332] text-white shadow-xs font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            onClick={() => {
              setIsSignUp(true);
              setFormError('');
            }}
            className={`py-1.5 font-medium rounded-md transition-colors ${
              isSignUp ? 'bg-[#1a2332] text-white shadow-xs font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {formError}
          </div>
        )}

        {/* 1-Click Instant Demo Login (Hackathon & Fast Evaluation) */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full py-2.5 px-4 rounded-xl border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors mb-4"
        >
          <Zap className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
          <span>Instant Demo Access (1-Click)</span>
        </button>

        {/* Google OAuth Quick Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || isGoogleLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-[#242f42] bg-[#0d131d] hover:bg-[#161f2e] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors mb-5 disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span>Redirecting to Google…</span>
            </div>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-[#1e293b] w-full" />
          <span className="bg-[#121824] px-2.5 text-[11px] text-slate-400 font-mono">
            or email
          </span>
          <div className="border-t border-[#1e293b] w-full" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <label htmlFor="fullName" className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Chen"
                    className="input-field pl-9 text-xs py-2.5"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field pl-9 text-xs py-2.5"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="text-xs font-semibold text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-9 pr-9 text-xs py-2.5"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isGoogleLoading}
            className="btn-primary w-full py-2.5 text-xs font-semibold mt-2"
          >
            {loading ? (
              <Spinner size="sm" />
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Clear Cache Tool */}
        <div className="mt-5 pt-4 border-t border-[#1e293b] text-center">
          <button
            type="button"
            onClick={wipeAllLocalData}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1 font-mono"
            title="Purge cached session tokens"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            Reset local auth storage
          </button>
        </div>
      </div>
    </div>
  );
}
