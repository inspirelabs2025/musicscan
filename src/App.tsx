import { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Modal from 'react-modal';

import './index.css';

import { SettingsProvider } from '@/context/SettingsContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import PrivateRoutes from './components/PrivateRoutes';
import PublicOnlyRoutes from './components/PublicOnlyRoutes';
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import CustomersPage from './pages/customers';
import ProjectsPage from './pages/projects';
import ProjectDetailPage from './pages/project-detail';
import ChatPage from './pages/chat';
import SettingsPage from './pages/settings';
import PricingPage from './pages/pricing';
import RegisterPage from './pages/register';
import ForgotPasswordPage from './pages/forgot-password';
import ResetPasswordPage from './pages/reset-password';
import { AccountSetupPage } from './pages/account-setup';
import OnboardingPage from './pages/onboarding';
import { ThemeProvider } from './context/ThemeContext';
import SupportPage from './pages/support';

Modal.setAppElement('#root');

alert(import.meta.env.VITE_SUPABASE_URL)


const queryClient = new QueryClient();

function AppRoutes() {
  const { session } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (session && !session.user.user_metadata?.full_onboarding_completed) {
      navigate('/onboarding');
    }
  }, [session, navigate]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicOnlyRoutes />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Route>

      {/* Private Routes */}
      <Route element={<PrivateRoutes />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/project/:id" element={<ProjectDetailPage />} />
        <Route path="/chat/:projectId?" element={<ChatPage />} />
        <Route path="/settings/:tab?" element={<SettingsPage />} />
        <Route path="/account-setup" element={<AccountSetupPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <BrowserRouter>
          <AuthProvider>
            <SettingsProvider>
              <AppRoutes />
              <Toaster position="top-right" />
            </SettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
