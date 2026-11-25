// src/components/common/Layout.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Rocket,
  LayoutDashboard,
  PlusCircle,
  Settings,
  LogOut,
  Presentation,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Blueprint', path: user ? '/wizard' : '/auth', icon: PlusCircle },
    { label: 'Docs & Deck', path: '/docs', icon: Presentation },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17] text-slate-100">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0b0f17]/95 backdrop-blur-md border-b border-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
            aria-label="Milestone AI Home"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm transition-transform group-hover:scale-105">
              <Rocket className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-base sm:text-lg text-white">
                Milestone
              </span>
              <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.path ||
                (link.path === '/dashboard' && location.pathname.startsWith('/roadmap'));
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1a2332] text-white border border-[#2e3d54] shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121824]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
                    aria-hidden="true"
                  />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Profile / Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] border border-[#242f42] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-blue-500" aria-hidden="true" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-[#121824] border border-[#242f42] rounded-lg">
                  <div className="w-5 h-5 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center text-[11px] font-bold font-mono">
                    {user.display_name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-medium text-slate-300 hidden sm:inline max-w-[130px] truncate">
                    {user.display_name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#121824] border border-transparent hover:border-[#242f42] transition-colors"
                  title="Sign out"
                  aria-label="Sign out of account"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="btn-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f17]/95 backdrop-blur-md border-t border-[#1e293b] px-4 py-2"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.path ||
              (link.path === '/dashboard' && location.pathname.startsWith('/roadmap'));
            return (
              <Link
                key={link.label}
                to={link.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
                  isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
