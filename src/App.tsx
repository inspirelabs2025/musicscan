import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

import './App.css';
import { Login } from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ProjectView from './pages/ProjectView';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import Onboarding from './pages/Onboarding';
import AnalyticsPage from './pages/AnalyticsPage';
import IndexNow from './pages/IndexNow';
import KeywordPage from './pages/KeywordPage';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import ScanResultDetails from './pages/ScanResultDetails';
import ScanResultSEO from './pages/ScanResultSEO';
import { queryClient } from './main';
import AuditPage from './pages/AuditPage';
import { RecordUsage } from './components/RecordUsage';
import AIMonitization from './pages/AIMonitization';
import { useAIUsage } from './hooks/useAIUsage';
import { AINudge } from './components/AINudge';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNudge, setShowNudge] = useState(false);
  const { hasUsedAI } = useAIUsage();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (session) {
        // Check if the current path is /login and redirect to /dashboard
        if (location.pathname === '/login') {
          navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    });
  }, [navigate, location.pathname]);

  useEffect(() => {
    // Only show nudge if AI features haven't been used AND the variant is active
    if (!hasUsedAI && import.meta.env.VITE_AI_NUDGE_VARIANT === 'nudge') {
      const timer = setTimeout(() => {
        setShowNudge(true);
      }, 5000); // Show nudge after 5 seconds
      return () => clearTimeout(timer);
    } else {
      setShowNudge(false);
    }
  }, [hasUsedAI]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RecordUsage />
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/project/:id" element={<ProjectView />} />
                  <Route
                    path="/project/:id/scan/:scanId"
                    element={<ScanResultDetails />}
                  />
                  <Route
                    path="/project/:id/scan/:scanId/seo"
                    element={<ScanResultSEO />}
                  />
                  <Route
                    path="/project/:id/audit/:auditId"
                    element={<AuditPage />}
                  />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/indexnow" element={<IndexNow />} />
                  <Route path="/keywords" element={<KeywordPage />} />
                  <Route path="/ai-monitization" element={<AIMonitization />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      {showNudge && <AINudge onClose={() => setShowNudge(false)} />}
    </ThemeProvider>
  );
}

export default App;
