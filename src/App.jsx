// src/App.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PWAProvider } from './contexts/PWAContext';
import PrivateRoute from './components/common/PrivateRoute';
import Spinner from './components/common/Spinner';
import InstallAppBanner from './components/common/InstallAppBanner';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WizardPage = lazy(() => import('./pages/WizardPage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function LegacyPathwayDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/roadmap/${id}`} replace />;
}

function ServiceWorkerBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleMessage = (event) => {
      if (event.data?.type === 'MILESTONE_NAVIGATE' && typeof event.data.url === 'string') {
        const target = event.data.url.startsWith('/') ? event.data.url : '/dashboard';
        navigate(target);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PWAProvider>
          <ServiceWorkerBridge />
          <div className="min-h-screen bg-[#0b0d14] text-[#eef0f5] transition-colors duration-150">
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/wizard"
                  element={
                    <PrivateRoute>
                      <WizardPage />
                    </PrivateRoute>
                  }
                />
                <Route path="/pathway/new" element={<Navigate to="/wizard" replace />} />
                <Route path="/pathway/:id" element={<LegacyPathwayDetailRedirect />} />
                <Route
                  path="/roadmap/:id"
                  element={
                    <PrivateRoute>
                      <RoadmapPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/roadmap/:id/chat"
                  element={
                    <PrivateRoute>
                      <ChatPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <SettingsPage />
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <InstallAppBanner />
          </div>
        </PWAProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
