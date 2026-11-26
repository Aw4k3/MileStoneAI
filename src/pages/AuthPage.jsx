// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Sun, Moon, Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from '../components/common/Spinner';
import BrandMark from '../components/common/BrandMark';
import DotGridWaveBackground from '../components/common/DotGridWaveBackground';

export default function AuthPage() {
  const { theme, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState(() =>
    searchParams.get('view') === 'forgot' ? 'forgot' : searchParams.get('view') === 'signup' ? 'signup' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formNotice, setFormNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    user,
    login,
    signup,
    resendVerificationEmail,
    requestPasswordReset,
    loginWithGoogle,
    loading,
    isRecoverySession,
  } = useAuth();
  const navigate = useNavigate();

  const isSignUp = mode === 'signup';

  // Surface verification/reset feedback or auth link errors returned in query/hash params
  useEffect(() => {
    const verified = searchParams.get('verified');
    const reset = searchParams.get('reset');
    const view = searchParams.get('view');

    if (view === 'forgot') {
      setMode('forgot');
    }

    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
    const errorCode = searchParams.get('error_code') || hashParams.get('error_code');

    if (errorDesc) {
      if (errorCode === 'otp_expired' || /expired/i.test(errorDesc)) {
        setFormError('Your email link has expired or was already used. Request a fresh link below.');
      } else {
        setFormError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      }
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    } else if (verified === '1') {
      setFormNotice('Your email is verified. Sign in to access your workspace.');
    } else if (reset === 'success') {
      setFormNotice('Your password was updated. Sign in with your new credentials.');
    }
  }, [searchParams]);

  // Countdown cooldown to prevent repeated resend clicks
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (user && !loading && !isRecoverySession) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, isRecoverySession, navigate]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFormError('');
    setFormNotice('');
    if (searchParams.has('view') || searchParams.has('verified') || searchParams.has('reset')) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormNotice('');

    if (!email.trim() || !password) {
      setFormError('Please enter your email and password.');
      return;
    }

    if (isSignUp && password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const result = await signup(email, password, displayName);
        if (result?.requiresVerification) {
          setMode('verify_sent');
          setResendCooldown(60);
          return;
        }
        navigate('/dashboard');
      } else {
        await login(email.trim(), password);
        navigate('/dashboard');
      }
    } catch (err) {
      setFormError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormNotice('');

    if (!email.trim()) {
      setFormError('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setMode('forgot_sent');
      setResendCooldown(60);
    } catch (err) {
      setFormError(err.message || 'Unable to send reset email right now. Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendAction = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      if (mode === 'verify_sent') {
        await resendVerificationEmail(email);
        setFormNotice('A fresh verification link has been sent to your inbox.');
      } else if (mode === 'forgot_sent') {
        await requestPasswordReset(email);
        setFormNotice('Another password reset email has been dispatched.');
      }
      setResendCooldown(60);
    } catch (err) {
      setFormError(err.message || 'Please wait a moment before requesting another email.');
    } finally {
      setIsSubmitting(false);
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
      <DotGridWaveBackground
        spacing={0.23}
        dotSize={0.18}
        waveScale={0.42}
        angle={45}
        mouse={1}
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
        {(mode === 'signin' || mode === 'signup') && (
          <>
            <div className="grid grid-cols-2 seg-track mb-6 text-xs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => switchMode('signin')}
                className={`h-8 font-medium seg-tab ${mode === 'signin' ? 'seg-tab-active' : ''}`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => switchMode('signup')}
                className={`h-8 font-medium seg-tab ${mode === 'signup' ? 'seg-tab-active' : ''}`}
              >
                Create account
              </button>
            </div>

            {formNotice && (
              <div
                className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-start gap-2"
                role="status"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#4cc38a]" strokeWidth={1.5} aria-hidden="true" />
                <span>{formNotice}</span>
              </div>
            )}

            {formError && (
              <div
                className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs"
                role="alert"
              >
                {formError}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading || isSubmitting || isGoogleLoading}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-[#a3a9b8]">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -mr-1"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
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
                    placeholder={isSignUp ? 'Minimum 8 characters' : '••••••••'}
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
                disabled={loading || isSubmitting || isGoogleLoading}
                className="btn-primary w-full h-10 text-xs mt-2"
              >
                {loading || isSubmitting ? (
                  <Spinner size="sm" />
                ) : isSignUp ? (
                  'Create account'
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </>
        )}

        {mode === 'forgot' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-lg bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center text-blue-400 mb-3">
                <KeyRound className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h1 className="text-base font-medium text-[#eef0f5]">Reset your password</h1>
              <p className="text-xs text-[#7a8296] leading-relaxed">
                Enter the email address associated with your account and we’ll send a time-limited password reset link.
              </p>
            </div>

            {formError && (
              <div
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs"
                role="alert"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label htmlFor="resetEmail" className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
                  Email address
                </label>
                <input
                  id="resetEmail"
                  name="resetEmail"
                  type="email"
                  required
                  autoComplete="email"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field text-xs h-10"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full h-10 text-xs"
              >
                {isSubmitting ? <Spinner size="sm" /> : 'Send reset link'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full h-9 rounded-lg text-xs text-[#a3a9b8] hover:text-[#eef0f5] hover:bg-[#1a1e28] transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
              Back to sign in
            </button>
          </div>
        )}

        {(mode === 'forgot_sent' || mode === 'verify_sent') && (
          <div className="space-y-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 mx-auto">
              <Mail className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-base font-medium text-[#eef0f5]">
                {mode === 'verify_sent' ? 'Verify your email address' : 'Check your inbox'}
              </h1>
              <p className="text-xs text-[#a3a9b8] leading-relaxed">
                {mode === 'verify_sent' ? (
                  <>
                    We sent a verification link to{' '}
                    <span className="text-[#eef0f5] font-medium break-all">{email}</span>. Open the
                    link to activate your account.
                  </>
                ) : (
                  <>
                    If an account exists for{' '}
                    <span className="text-[#eef0f5] font-medium break-all">{email}</span>, you’ll
                    receive a password reset link shortly.
                  </>
                )}
              </p>
            </div>

            {formNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
                {formNotice}
              </div>
            )}

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={handleResendAction}
                disabled={resendCooldown > 0 || isSubmitting}
                className="btn-secondary w-full h-9 text-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Spinner size="sm" />
                ) : resendCooldown > 0 ? (
                  `Resend available in ${resendCooldown}s`
                ) : mode === 'verify_sent' ? (
                  'Resend verification email'
                ) : (
                  'Send reset link again'
                )}
              </button>

              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full h-9 rounded-lg text-xs text-[#a3a9b8] hover:text-[#eef0f5] hover:bg-[#1a1e28] transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                Back to sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
