import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';

import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import ProjectSettings from './pages/ProjectSettings';
import ProjectMembers from './pages/ProjectMembers';
import ProfileSettings from './pages/ProfileSettings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import ProjectPage from './pages/ProjectPage';
import DocumentationPage from './pages/DocumentationPage';
import PageNotFound from './pages/PageNotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import PublicProject from './pages/PublicProject';
import PublicProfile from './pages/PublicProfile';
import Integrations from './pages/Integrations';
import ProjectAccessDenied from './pages/ProjectAccessDenied';
import FeedbackChat from './components/FeedbackChat'; // Assuming this is your chat component
import { useSupabase } from './contexts/SupabaseContext';
import { useToast } from './components/ui/use-toast';
import { Button } from './components/ui/button';

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [session, loading, navigate, location]);

  if (loading) {
    return <div>Laden...</div>; // Or a spinner
  }

  return session ? children : null;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </Router>
  );
};

const AppContent = () => {
  const { session } = useAuth();
  const supabase = useSupabase();
  const { toast } = useToast();
  const [showChatNudge, setShowChatNudge] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkChatMessages = async () => {
      if (session?.user?.id) {
        const { count, error } = await supabase
          .from('feedback_chats')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id);

        if (!error && count === 0) {
          setTimeout(() => {
            setShowChatNudge(true);
          }, 5000); // Show nudge after 5 seconds
        }
      }
    };

    checkChatMessages();
  }, [session, supabase]);

  useEffect(() => {
    if (showChatNudge) {
      toast({
        title: 'Heb je de chat al geprobeerd? 👋',
        description: (
          <div className="flex flex-col gap-2">
            <p>Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!</p>
            <Button
              onClick={() => {
                navigate('/dashboard?openChat=true'); // Or a dedicated chat route
                setShowChatNudge(false);
              }}
              className="w-fit"
            >
              Naar de chat
            </Button>
          </div>
        ),
        duration: 10000,
      });
    }
  }, [showChatNudge, toast, navigate]);

  return (
    <>      
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Protected routes */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/project/:projectId/*"
          element={
            <PrivateRoute>
              <ProjectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/project-settings/:projectId"
          element={
            <PrivateRoute>
              <ProjectSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/project-members/:projectId"
          element={
            <PrivateRoute>
              <ProjectMembers />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile-settings"
          element={
            <PrivateRoute>
              <ProfileSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <PrivateRoute>
              <Integrations />
            </PrivateRoute>
          }
        />
        <Route
          path="/project-access-denied"
          element={
            <PrivateRoute>
              <ProjectAccessDenied />
            </PrivateRoute>
          }
        />

        {/* Public routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/docs/*" element={<DocumentationPage />} />
        <Route path="/public-project/:projectId" element={<PublicProject />} />
        <Route path="/public-profile/:profileId" element={<PublicProfile />} />

        {/* Catch-all for 404 */}1
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      {session && <FeedbackChat />} {/* Render FeedbackChat if session exists */}
    </>
  );
};

export default App;
