// src/components/common/Layout.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  LogOut,
  FileCode2,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import BrandMark from './BrandMark';

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
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New blueprint', path: user ? '/wizard' : '/auth', icon: PlusCircle },
    { label: 'Docs', path: '/docs', icon: FileCode2 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d14] text-[#eef0f5]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Header (56px compact navigation rail) */}
      <header className="sticky top-0 z-40 bg-[#0b0d14]/95 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 transition-opacity hover:opacity-90"
            aria-label="Milestone AI home"
          >
            <BrandMark />
          </Link>

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
                  className={`flex items-center gap-2 h-8 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1a1e28] text-[#eef0f5] border border-white/[0.12]'
                      : 'text-[#7a8296] hover:text-[#eef0f5] hover:bg-[#11141c]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-[#7a8296]'}`}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a8296] hover:text-[#eef0f5] hover:bg-[#1a1e28] border border-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-blue-500" strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 h-8 pl-2 pr-3 bg-[#11141c] border border-white/[0.08] rounded-lg">
                  <div className="w-5 h-5 rounded bg-[#1a1e28] text-[#eef0f5] border border-white/[0.08] flex items-center justify-center text-[11px] font-medium font-mono">
                    {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-medium text-[#a3a9b8] hidden sm:inline max-w-[130px] truncate">
                    {user.display_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a8296] hover:text-[#e5484d] hover:bg-[#11141c] border border-transparent hover:border-white/[0.08] transition-colors"
                  title="Sign out"
                  aria-label="Sign out of account"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="btn-primary text-xs h-8 px-3.5"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0d14]/95 backdrop-blur-md border-t border-white/[0.08] px-4 py-2"
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
                  isActive ? 'text-blue-400' : 'text-[#7a8296] hover:text-[#eef0f5]'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-[11px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
