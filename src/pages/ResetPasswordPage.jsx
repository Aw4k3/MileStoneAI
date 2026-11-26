// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  LockKeyhole,
  AlertTriangle,
  CheckCircle2,
  Check,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from '../components/common/Spinner';
import BrandMark from '../components/common/BrandMark';
import DotGridWaveBackground from '../components/common/DotGridWaveBackground';

const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'letter', label: 'Contains a letter', test: (pw) => /[a-zA-Z]/.test(pw) },
  { id: 'number', label: 'Contains a number', test: (pw) => /\d/.test(pw) },
];

function formatTokenError(errorCode, errorDesc) {
  const normalized = (errorDesc || '').toLowerCase();
  if (errorCode === 'otp_expired' || normalized.includes('expired')) {
    return 'This password reset link has expired or has already been used. Please request a new reset link.';
  }
  if (normalized.includes('invalid')) {
    return 'This password reset link is invalid. Please request a fresh password reset email.';
  }
  return errorDesc
    ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
    : 'We could not validate your password reset link. Please request a new one.';
}

export default function ResetPasswordPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, session, isRecoverySession, updatePassword, clearRecoverySession } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [linkStatus, setLinkStatus] = useState('verifying'); // 'verifying' | 'ready' | 'invalid' | 'success'
  const [linkError, setLinkError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verify recovery token (PKCE code, token_hash OTP, or implicit hash session)
  useEffect(() => {
    let active = true;
    let fallbackTimer = null;

    async function verifyRecoveryContext() {
      const hash = window.location.hash || '';
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
      const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
      const errorParam = searchParams.get('error') || hashParams.get('error');

      if (errorParam || errorDesc || errorCode) {
        if (!active) return;
        setLinkError(formatTokenError(errorCode, errorDesc));
        setLinkStatus('invalid');
        return;
      }

      const tokenHash = searchParams.get('token_hash');
      const linkType = searchParams.get('type') || hashParams.get('type');
      const code = searchParams.get('code');

      // 1. Token hash verification flow (custom email template links)
      if (tokenHash && linkType === 'recovery') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (!active) return;
          if (error) {
            setLinkError(formatTokenError(error.code, error.message));
            setLinkStatus('invalid');
            return;
          }
          setLinkStatus('ready');
          return;
        } catch (err) {
          if (!active) return;
          setLinkError(formatTokenError('', err.message));
          setLinkStatus('invalid');
          return;
        }
      }

      // 2. PKCE code flow (?code=...)
      if (code) {
        try {
          const { data: existing } = await supabase.auth.getSession();
          if (existing?.session) {
            if (active) setLinkStatus('ready');
            return;
          }
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!active) return;
          if (error) {
            setLinkError(formatTokenError(error.code, error.message));
            setLinkStatus('invalid');
            return;
          }
          setLinkStatus('ready');
          return;
        } catch (err) {
          if (!active) return;
          setLinkError(formatTokenError('', err.message));
          setLinkStatus('invalid');
          return;
        }
      }

      // 3. Implicit fragment or active recovery session
      if (isRecoverySession || hash.includes('access_token')) {
        const { data: current } = await supabase.auth.getSession();
        if (current?.session && active) {
          setLinkStatus('ready');
          return;
        }
      }

      // Give Supabase auth state listener a short window for fragment exchange
      fallbackTimer = window.setTimeout(async () => {
        if (!active) return;
        const { data: current } = await supabase.auth.getSession();
        if (current?.session && (isRecoverySession || hash.includes('type=recovery'))) {
          setLinkStatus('ready');
        } else {
          setLinkError('Missing or expired reset token. Please request a new password reset link.');
          setLinkStatus('invalid');
        }
      }, 1500);
    }

    verifyRecoveryContext();

    return () => {
      active = false;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [searchParams, isRecoverySession]);

  // If AuthContext receives PASSWORD_RECOVERY event while verifying, mark ready immediately
  useEffect(() => {
    if (linkStatus === 'verifying' && isRecoverySession && session) {
      setLinkStatus('ready');
    }
  }, [linkStatus, isRecoverySession, session]);

  const allRulesPassed = PASSWORD_RULES.every((rule) => rule.test(password));
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!allRulesPassed) {
      setFormError('Please ensure your new password meets all strength requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      window.history.replaceState({}, '', '/reset-password');
      setLinkStatus('success');
    } catch (err) {
      const msg = err?.message || 'Unable to update password.';
      if (/expired|invalid|session missing/i.test(msg)) {
        setLinkError('Your recovery session expired before saving. Please request a new reset link.');
        setLinkStatus('invalid');
      } else {
        setFormError(msg);
      }
    } finally {
      setIsSubmitting(false);
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

      <Link
        to="/"
        className="mb-8 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
        aria-label="Milestone AI home"
      >
        <BrandMark />
      </Link>

      <div className="w-full max-w-sm bg-[#11141c] border border-white/[0.1] rounded-2xl p-6">
        {linkStatus === 'verifying' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
            <Spinner size="lg" />
            <p className="text-xs font-mono text-[#a3a9b8]">Verifying recovery link…</p>
          </div>
        )}

        {linkStatus === 'invalid' && (
          <div className="space-y-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-[#e5484d] mx-auto">
              <AlertTriangle className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-base font-medium text-[#eef0f5]">Reset link unavailable</h1>
              <p className="text-xs text-[#a3a9b8] leading-relaxed">{linkError}</p>
            </div>
            <div className="pt-1 space-y-2">
              <Link
                to="/auth?view=forgot"
                onClick={clearRecoverySession}
                className="btn-primary w-full h-10 text-xs"
              >
                Request a new reset link
              </Link>
              <Link
                to="/auth"
                onClick={clearRecoverySession}
                className="btn-secondary w-full h-9 text-xs"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        )}

        {linkStatus === 'ready' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-lg bg-[#1a1e28] border border-white/[0.08] flex items-center justify-center text-blue-400 mb-3">
                <LockKeyhole className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h1 className="text-base font-medium text-[#eef0f5]">Set a new password</h1>
              <p className="text-xs text-[#7a8296] leading-relaxed">
                {user?.email
                  ? `Create a strong replacement password for ${user.email}.`
                  : 'Choose a strong password that you have not used on other sites.'}
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

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    spellCheck={false}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="input-field pr-10 text-xs h-10"
                    autoFocus
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

              <ul className="space-y-1.5 text-xs" aria-label="Password requirements">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <li
                      key={rule.id}
                      className={`flex items-center gap-2 transition-colors ${
                        passed ? 'text-[#4cc38a]' : 'text-[#7a8296]'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 shrink-0 ${passed ? 'opacity-100' : 'opacity-30'}`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span>{rule.label}</span>
                    </li>
                  );
                })}
              </ul>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    spellCheck={false}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="input-field pr-10 text-xs h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7a8296] hover:text-[#eef0f5] transition-colors p-1"
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-[11px] text-rose-400 mt-1.5">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !allRulesPassed || !passwordsMatch}
                className="btn-primary w-full h-10 text-xs disabled:opacity-50"
              >
                {isSubmitting ? <Spinner size="sm" /> : 'Update password'}
              </button>
            </form>
          </div>
        )}

        {linkStatus === 'success' && (
          <div className="space-y-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#4cc38a] mx-auto">
              <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-base font-medium text-[#eef0f5]">Password updated</h1>
              <p className="text-xs text-[#a3a9b8] leading-relaxed">
                Your password has been changed cleanly and other active sessions have been signed out.
              </p>
            </div>
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={() => navigate(user ? '/dashboard' : '/auth?reset=success', { replace: true })}
                className="btn-primary w-full h-10 text-xs"
              >
                <span>{user ? 'Continue to dashboard' : 'Sign in'}</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}