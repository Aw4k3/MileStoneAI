// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Rocket, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
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

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please fill in both email and password.');
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
      setFormError(err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      setFormError('');
      // Supabase signInWithOAuth will initiate the browser redirect to Google
      await loginWithGoogle();
      // DO NOT call navigate('/dashboard') here, as that would prematurely mount
      // the dashboard before the Google OAuth redirect finishes.
    } catch (err) {
      setIsGoogleLoading(false);
      setFormError(err.message || 'Google Sign-In failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Brand Header */}
      <Link
        to="/"
        className="flex items-center gap-2.5 mb-8 group transition-transform active:scale-95"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <span className="font-extrabold tracking-tight text-xl">
          Milestone <span className="text-gradient">AI</span>
        </span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 mb-6 relative">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setFormError('');
            }}
            className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors ${
              !isSignUp ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setFormError('');
            }}
            className={`flex-1 pb-3 text-sm font-semibold text-center transition-colors ${
              isSignUp ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>

          {/* Animated Active Indicator */}
          <motion.div
            className="absolute bottom-0 h-0.5 bg-indigo-500 rounded-full"
            initial={false}
            animate={{
              left: !isSignUp ? '0%' : '50%',
              width: '50%',
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            {formError}
          </div>
        )}

        {/* Google OAuth Quick Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || isGoogleLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-slate-200 text-sm font-medium flex items-center justify-center gap-2.5 transition-all mb-5 hover:border-slate-700 active:scale-[0.99] disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span>Redirecting to Google...</span>
            </div>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            or with email
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field pl-10 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => alert('Please reset your password or sign in using Google.')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isGoogleLoading}
            className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Spinner size="sm" />
            ) : isSignUp ? (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest fallback & Clear Cache */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Want to test first without an account?{' '}
            <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
              Browse as Guest →
            </Link>
          </p>

          <button
            type="button"
            onClick={wipeAllLocalData}
            className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
            title="Purge all cached local browser data and cookies"
          >
            <RefreshCw className="w-3 h-3" />
            Clear local browser cache & reset
          </button>
        </div>
      </div>
    </div>
  );
}
