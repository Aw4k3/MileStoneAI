// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/common/PrivateRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import WizardPage from './pages/WizardPage';
import RoadmapPage from './pages/RoadmapPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import DocsPage from './pages/DocsPage';
import PathwayCompilerPage from './pages/PathwayCompilerPage';
import PathwayRoadmapPage from './pages/PathwayRoadmapPage';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-150">
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
            <Route
              path="/pathway/new"
              element={
                <PrivateRoute>
                  <PathwayCompilerPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/pathway/:id"
              element={
                <PrivateRoute>
                  <PathwayRoadmapPage />
                </PrivateRoute>
              }
            />
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
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
