// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, RefreshCw, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from '../components/common/Spinner';
import BrandMark from '../components/common/BrandMark';

export default function AuthPage() {
  const { theme, toggleTheme } = useTheme();
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
      setFormError('Please enter your email and password.');
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
      setFormError(err.message || 'Authentication failed. Please verify your credentials.');
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

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative isolate bg-[#0b0d14] text-[#eef0f5]">
      <div
        data-aifx="dot-grid-wave"
        data-aifx-bg="#000000"
        data-aifx-bg-alpha="0"
        data-aifx-colors={theme === 'light' ? '#2563eb,#64748b' : '#3b82f6,#475569'}
        data-aifx-dot-size="0.28"
        data-aifx-spacing="0.55"
        className={`fixed inset-0 -z-10 pointer-events-none transition-opacity duration-300 ${
          theme === 'light' ? 'opacity-35' : 'opacity-55'
        }`}
        aria-hidden="true"
      />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a8296] hover:text-[#eef0f5] bg-[#11141c] border border-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500" strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Brand */}
      <Link
        to="/"
        className="mb-8 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
        aria-label="Milestone AI home"
      >
        <BrandMark />
      </Link>

      {/* Auth Panel (16px radius, 24px padding -> 8px nested control radius) */}
      <div className="w-full max-w-sm bg-[#11141c] border border-white/[0.1] rounded-2xl p-6">
        <div
          className="grid grid-cols-2 seg-track mb-6 text-xs"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => {
              setIsSignUp(false);
              setFormError('');
            }}
            className={`h-8 font-medium seg-tab ${!isSignUp ? 'seg-tab-active' : ''}`}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            onClick={() => {
              setIsSignUp(true);
              setFormError('');
            }}
            className={`h-8 font-medium seg-tab ${isSignUp ? 'seg-tab-active' : ''}`}
          >
            Create account
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {formError}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || isGoogleLoading}
          className="w-full h-10 px-4 rounded-lg border border-white/[0.1] bg-[#0b0d14] hover:bg-[#1a1e28] text-[#eef0f5] text-xs font-medium flex items-center justify-center gap-2.5 transition-colors mb-4 disabled:opacity-50"
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

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative bg-[#11141c] px-3 text-xs font-mono text-[#7a8296]">
            or email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Chen"
                className="input-field text-xs h-10"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
              Email address
            </label>
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
              className="input-field text-xs h-10"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
              Password
            </label>
            <div className="relative">
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
                className="input-field pr-10 text-xs h-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7a8296] hover:text-[#eef0f5] transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isGoogleLoading}
            className="btn-primary w-full h-10 text-xs mt-2"
          >
            {loading ? (
              <Spinner size="sm" />
            ) : isSignUp ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
          <button
            type="button"
            onClick={wipeAllLocalData}
            className="text-xs text-[#7a8296] hover:text-[#a3a9b8] transition-colors inline-flex items-center gap-1.5 font-mono"
            title="Purge cached session tokens"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            Reset local auth storage
          </button>
        </div>
      </div>
    </div>
  );
}
