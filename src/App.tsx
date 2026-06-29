import * as React from 'react';
import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';

import './App.css';

import { AppLayout } from './layouts/AppLayout';

import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { DashboardPage } from './pages/DashboardPage';
// Auth
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { SignOutPage } from './pages/auth/SignOutPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { UpdatePasswordPage } from './pages/auth/UpdatePasswordPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute';
// Profile
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
// Legal
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/legal/TermsOfServicePage';
import { CookiePolicyPage } from './pages/legal/CookiePolicyPage';
// Feedback
import { FeedbackPage } from './pages/FeedbackPage';
// AI
import { AIResearchAssistantPage } from './pages/ai/AIResearchAssistantPage';
import { AIPainterPage } from './pages/ai/AIPainterPage';
import { AISongGeneratorPage } from './pages/ai/AISongGeneratorPage';
import { AINudge } from './components/ainudge'; // Import AINudge

// Root Router configuration
const router = createBrowserRouter([
  { path: '/signin', element: <PublicOnlyRoute><AppLayout><SignInPage /></AppLayout></PublicOnlyRoute> },
  { path: '/signup', element: <PublicOnlyRoute><AppLayout><SignUpPage /></AppLayout></PublicOnlyRoute> },
  { path: '/signout', element: <ProtectedRoute><AppLayout><SignOutPage /></AppLayout></ProtectedRoute> },
  { path: '/forgot-password', element: <PublicOnlyRoute><AppLayout><ForgotPasswordField /></AppLayout></PublicOnlyRoute> },
  { path: '/update-password', element: <AppLayout><UpdatePasswordPage /></AppLayout> },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <AppLayout><NotFoundPage /></AppLayout>,
    children: [
      { index: true, element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      // Protected Routes
      { path: '/dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      { path: '/profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: '/settings', element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
      { path: '/feedback', element: <ProtectedRoute><FeedbackPage /></ProtectedRoute> },
      // AI Routes
      { path: '/ai-research-assistant', element: <ProtectedRoute><AIResearchAssistantPage /></ProtectedRoute> },
      { path: '/ai-painter', element: <ProtectedRoute><AIPainterPage /></ProtectedRoute> },
      { path: '/ai-song-generator', element: <ProtectedRoute><AISongGeneratorPage /></ProtectedRoute> },
      // Central AI features page, possibly listing all AI tools
      { path: '/ai-features', element: <ProtectedRoute><AIResearchAssistantPage /></ProtectedRoute> }, // TODO: Create a dedicated AI features landing page
      // Legal pages
      { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
      { path: '/terms-of-service', element: <TermsOfServicePage /> },
      { path: '/cookie-policy', element: <CookiePolicyPage /> },
    ],
  },
]);

function App() {
  // Example state for AI usage count - replace with actual state/context from your app
  const [aiUsageCount, setAiUsageCount] = React.useState(0); 

  // This effect would typically fetch the actual AI usage count for the user
  useEffect(() => {
    // In a real app, you'd fetch this from your backend or a user context
    // For this example, it's hardcoded to 0 to always show the nudge initially.
    // Once a user uses an AI feature, update this count.
    // setAiUsageCount(fetchUserAiUsageCount()); 
  }, []);

  return (
    <React.StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
        <AINudge usedCount={aiUsageCount} /> {/* Render the AI Nudge here */}
      </AuthProvider>
    </React.StrictMode>
  );
}

export default App;
