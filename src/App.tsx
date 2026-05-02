import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import HomePage from '@/pages/HomePage';
import ProfilePage from '@/pages/ProfilePage';
import StudioPage from '@/pages/StudioPage';
import ProjectPage from '@/pages/ProjectPage';
import ScanPage from '@/pages/ScanPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ConfirmEmailPage from '@/pages/ConfirmEmailPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AuthWatcher from '@/components/AuthWatcher';
// Ensure analytics is initialized very early.
import { initializeAnalytics, trackPageView } from '@/lib/analytics';

// Initialize GA as early as possible
initializeAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID);

const AppRoutes: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Dynamically set page title (can be enhanced with route-specific titles)
    const defaultTitle = "MusicScan";
    document.title = defaultTitle;

    // Track page view on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return (
    <Routes>
      <Route element={<AuthWatcher />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/ai-features" element={<div>AI Features Page Placeholder</div>} /> {/* Placeholder for AI Features Page */}

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="/scan" element={<ScanPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
