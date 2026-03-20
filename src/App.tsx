import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AnimatePresence } from 'framer-motion';

import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner';
import GlobalErrorDisplay from './components/GlobalErrorDisplay';
import LegalPage from './pages/LegalPage';
import DocumentationPage from './pages/DocumentationPage';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import FeaturesPage from './pages/FeaturesPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import NotFoundPage from './pages/NotFoundPage';
import ReleaseNotesPage from './pages/ReleaseNotesPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import StatusPage from './pages/StatusPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import OnboardingPage from './pages/OnboardingPage';
import ProjectPage from './pages/ProjectPage';
import ProjectSettingsPage from './pages/ProjectSettingsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import InvoicePage from './pages/InvoicePage';
import SubscriptionPage from './pages/SubscriptionPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ChatNudge from './components/chat-nudge'; // Import the new component

function App() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [chatMessageCount, setChatMessageCount] = useState(0); // State for chat message count

  useEffect(() => {
    const checkAuthStatus = async () => {
      // Simulate API call or session check
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsAuthChecking(false);
    };
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!isAuthChecking && !isLoading) {
      if (!session && location.pathname.startsWith('/dashboard')) {
        navigate('/auth');
      } else if (session && (location.pathname === '/auth' || location.pathname === '/')) {
        navigate('/dashboard');
      }
      // Simulate fetching chat messages for a specific project
      // In a real app, this would be dynamic based on the current project context
      if (location.pathname.startsWith('/project/')) {
        // Simulate 0 messages for demonstration
        setChatMessageCount(0);
      } else {
        setChatMessageCount(1); // Assume >0 for other pages
      }
    }
  }, [session, isLoading, isAuthChecking, location.pathname, navigate]);

  if (isAuthChecking || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AnimatePresence mode="wait">
      <Toaster position="top-right" expand={true} richColors />
      <GlobalErrorDisplay />
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/release-notes" element={<ReleaseNotesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/onboarding" element={<ProtectedRoute element={<OnboardingPage />} />} />
        <Route path="/create-project" element={<ProtectedRoute element={<CreateProjectPage />} />} />

        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
        <Route path="/admin" element={<ProtectedRoute element={<AdminPage />} />} />
        <Route path="/project/:projectId/*" element={<ProtectedRoute element={<ProjectPage />} />} />
        <Route path="/project/:projectId/settings" element={<ProtectedRoute element={<ProjectSettingsPage />} />} />
        <Route path="/project/:projectId/integrations" element={<ProtectedRoute element={<IntegrationsPage />} />} />
        <Route path="/invoice/:invoiceId" element={<ProtectedRoute element={<InvoicePage />} />} />
        <Route path="/subscription" element={<ProtectedRoute element={<SubscriptionPage />} />} />

        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {session && <ChatNudge messageCount={chatMessageCount} />} {/* Render ChatNudge only if logged in and on certain pages */}
    </AnimatePresence>
  );
}

export default App;
