import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LoadingSpinner from './components/LoadingSpinner';
import RequireAuth from './components/RequireAuth';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { useNudgeLogic } from './hooks/useNudgeLogic';
import { ChatNudge } from './components/chat-nudge';

// Lazy load routes
const AuthPage = lazy(() => import('./pages/AuthPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const IdeaPage = lazy(() => import('./pages/IdeaPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

function App() {
  const { isChatNudgeVisible, dismissChatNudge, handleTryChat, chatMessageCount } = useNudgeLogic();

  return (
    <Router>
      <AuthProvider>
        <TooltipProvider>
          <Toaster richColors />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/*"
                element={
                  <RequireAuth>
                    <ProjectProvider>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/project/:projectId/*" element={<ProjectPage />} />
                        <Route path="/project/:projectId/idea/:ideaId" element={<IdeaPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<ErrorPage />} />
                      </Routes>
                    </ProjectProvider>
                  </RequireAuth>
                }
              />
            </Routes>
            {/* Chat Nudge Component */}
            <ChatNudge
              isVisible={isChatNudgeVisible}
              onDismiss={dismissChatNudge}
              onTryChat={handleTryChat}
              messageCount={chatMessageCount}
            />
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
