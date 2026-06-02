import './App.css';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import * as amplitude from '@amplitude/analytics-browser';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NotFound from './components/shared/NotFound';
import Protected from './components/shared/Protected';
import AuthGuard from './components/shared/AuthGuard';
import PrivacyPolicy from './components/marketing/PrivacyPolicy';
import CookiesPolicy from './components/marketing/CookiesPolicy';
import TermsOfService from './components/marketing/TermsOfService';
import Home from './components/app/Home';
import Profile from './components/app/Profile';
import Project from './components/app/Project';
import ProjectSettings from './components/app/ProjectSettings';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { useAuth } from './hooks/useAuth';
import { NudgeAI } from './components/growth/NudgeAI';

const amplitudeApiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (amplitudeApiKey) {
      amplitude.init(amplitudeApiKey, user?.id, {
        defaultTracking: {
          sessions: true,
          pageViews: true,
          formInteractions: true,
        },
      });
    }
  }, [user]);

  return (
    <TooltipProvider>
      <Router>
        <Toaster richColors />
        {import.meta.env.VITE_AI_NUDGE_VARIANT === 'nudge' && (
          <NudgeAI
            message="Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!"
            linkText="Ontdek AI"
            linkHref="/dashboard/ai"
            onClose={() => console.log('AI Nudge closed')}
          />
        )}
        <Routes>
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiesPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          {/* Protected routes */}          
          <Route element={<Protected redirectPath="/login" />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/project/:projectId" element={<Project />} />
            <Route
              path="/project/:projectId/settings"
              element={<ProjectSettings />}
            />
            {/* Add more protected routes here */}
          </Route>
          {/* Auth-related routes, e.g., login, signup. Assumes AuthGuard handles redirection for authenticated users wanting to access auth pages */}
          <Route element={<AuthGuard redirectPath="/home" />}>
            {/* <Route path="/login" element={<Login />} /> */}
            {/* <Route path="/signup" element={<SignUp />} /> */}
            {/* Add other auth routes that should redirect if user is logged in */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Analytics />
    </TooltipProvider>
  );
}

export default App;
