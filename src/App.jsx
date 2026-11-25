// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/common/PrivateRoute';
import Spinner from './components/common/Spinner';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WizardPage = lazy(() => import('./pages/WizardPage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function LegacyPathwayDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/roadmap/${id}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-150">
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
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
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
