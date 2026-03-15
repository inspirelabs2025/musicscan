import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import PrivateRoute from './components/app/PrivateRoute';
import LoadingSpinner from './components/app/LoadingSpinner';
import ErrorBoundary from './components/app/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { IntercomProvider } from 'react-use-intercom';
import { GA4 } from './lib/ga4';
import { DialogProvider } from './context/DialogContext';
import { TooltipProvider } from './components/ui/tooltip';
import { CommandKMenu } from './components/app/CommandKMenu';

// Lazy load pages
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectOverviewPage = lazy(() => import('./pages/ProjectOverviewPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ProjectSettingsPage = lazy(() => import('./pages/ProjectSettingsPage'));
const TeamSettingsPage = lazy(() => import('./pages/TeamSettingsPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const AiNudgeTestPage = lazy(() => import('./pages/AiNudgeTestPage'));
const ChatPage = lazy(() => import('./pages/ChatPage')); // Import ChatPage

if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
  GA4.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatMessageCount, setChatMessageCount] = useState(0); // State to hold chat message count

  // Example of how you might fetch chat message count (replace with actual logic)
  useEffect(() => {
    // In a real app, you would fetch this from your backend/database
    // For demonstration, let's assume 0 messages initially per project.
    // This would likely be tied to the current project context.
    setChatMessageCount(0);
  }, [location.pathname]); // Update when path changes (e.g., project change)

  const handleInitiateChat = () => {
    // Navigate to the chat page or open chat interface
    navigate('/chat');
  };

  useEffect(() => {
    GA4.sendPageView(location.pathname);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProjectProvider>
            <IntercomProvider
              appId={import.meta.env.VITE_INTERCOM_APP_ID || ''}
              apiBase={import.meta.env.VITE_INTERCOM_API_BASE}
            >
              <TooltipProvider>
                <DialogProvider>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/signin" element={<SignInPage />} />
                      <Route path="/signup" element={<SignUpPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/verify-email" element={<VerifyEmailPage />} />
                      <Route path="/onboarding" element={<PrivateRoute element={<OnboardingPage />} />} />
                      <Route
                        path="/dashboard"
                        element={<PrivateRoute element={<DashboardPage />} />}
                      />
                      <Route
                        path="/project/:projectId"
                        element={<PrivateRoute element={<ProjectOverviewPage />} />}
                      />
                      <Route
                        path="/project/:projectId/settings"
                        element={<PrivateRoute element={<ProjectSettingsPage />} />}
                      />
                      <Route
                        path="/project/:projectId/team"
                        element={<PrivateRoute element={<TeamSettingsPage />} />}
                      />
                      <Route
                        path="/project/:projectId/billing"
                        element={<PrivateRoute element={<BillingPage />} />}
                      />
                      <Route
                        path="/project/:projectId/integrations"
                        element={<PrivateRoute element={<IntegrationsPage />} />}
                      />
                      <Route
                        path="/project/:projectId/chat"
                        element={<PrivateRoute element={<ChatPage />} />} // Chat route
                      />
                      <Route path="/profile" element={<PrivateRoute element={<ProfilePage />} />} />
                      <Route path="/settings" element={<PrivateRoute element={<SettingsPage />} />} />
                      <Route path="/ab-test" element={<PrivateRoute element={<AiNudgeTestPage />} />} />
                      <Route path="/chat" element={<PrivateRoute element={<ChatPage />} />} /> {/* General Chat route */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                    {location.pathname.startsWith('/project/') && chatMessageCount === 0 && (
                      <ChatNudge
                        messageCount={chatMessageCount}
                        onInitiateChat={handleInitiateChat}
                      />
                    )}
                  </Suspense>
                  <CommandKMenu />
                </DialogProvider>
              </TooltipProvider>
            </IntercomProvider>
          </ProjectProvider>
        </AuthProvider>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
