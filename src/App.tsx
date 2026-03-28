import { Routes, Route, Outlet } from 'react-router-dom';
import { HomeLayout } from './layouts/home-layout';
import { AuthLayout } from './layouts/auth-layout';
import { DashboardLayout } from './layouts/dashboard-layout';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';
import { ForgotPasswordPage } from './pages/forgot-password';
import { ResetPasswordPage } from './pages/reset-password';
import { ConfirmEmailPage } from './pages/confirm-email';
import { NotFoundPage } from './pages/not-found';
import { DashboardOverviewPage } from './pages/dashboard/overview';
import { DashboardProjectPage } from './pages/dashboard/project';
import { DashboardSettingsPage } from './pages/dashboard/settings';
import { DashboardAIConsolePage } from './pages/dashboard/ai-console';
import { DashboardBillingPage } from './pages/dashboard/billing';
import { DashboardProfilePage } from './pages/dashboard/settings/profile';
import { DashboardAccountPage } from './pages/dashboard/settings/account';
import { DashboardAppearancePage } from './pages/dashboard/settings/appearance';
import { PublicProjectsPage } from './pages/public/projects';
import { IndexPage } from './pages/index';
import { AboutPage } from './pages/about';
import { ContactPage } from './pages/contact';
import { TermsPage } from './pages/terms';
import { PrivacyPage } from './pages/privacy';
import { FAQPage } from './pages/faq';
import { useAuth } from './hooks/useAuth';
import { PublicRoute } from './components/public-route';
import { ProtectedRoute } from './components/protected-route';
import { LoadingSpinner } from './components/loading-spinner';
import { Toaster } from './components/ui/sonner';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 h-screen w-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <>      <Toaster richColors />


      <Routes>
        {/* Public Routes */}
		<Route path="/" element={<HomeLayout />}>
			<Route index element={<IndexPage />} />
			<Route path="about" element={<AboutPage />} />
			<Route path="contact" element={<ContactPage />} />
			<Route path="terms" element={<TermsPage />} />
			<Route path="privacy" element={<PrivacyPage />} />
			<Route path="faq" element={<FAQPage />} />
			<Route path="projects" element={<PublicProjectsPage />} />

			{/* Auth Routes */}
			<Route element={<PublicRoute />}>
				<Route path="auth" element={<AuthLayout />}>
					<Route path="login" element={<LoginPage />} />
					<Route path="register" element={<RegisterPage />} />
					<Route path="forgot-password" element={<ForgotPasswordPage />} />
					<Route path="reset-password" element={<ResetPasswordPage />} />
					<Route path="confirm-email" element={<ConfirmEmailPage />} />
				</Route>
			</Route>
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverviewPage />} />
            <Route path="project/:id" element={<DashboardProjectPage />} />
            <Route path="ai" element={<DashboardAIConsolePage />} />
            <Route path="billing" element={<DashboardBillingPage />} />
            <Route path="settings" element={<Outlet />}>
              <Route index element={<DashboardSettingsPage />} />
              <Route path="profile" element={<DashboardProfilePage />} />
              <Route path="account" element={<DashboardAccountPage />} />
              <Route path="appearance" element={<DashboardAppearancePage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all for 404 */} 
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
