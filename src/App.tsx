import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthPage } from './pages/auth-page';
import { DashboardPage } from './pages/dashboard-page';
import { useAuth } from './context/AuthContext';
import { LoadingSpinner } from './components/ui/loading-spinner';
import { ProjectsPage } from './pages/projects-page.tsx';
import { SettingsPage } from './pages/settings-page.tsx';
import { DashboardLayout } from './components/dashboard-layout.tsx';
import { ProjectDetailsPage } from './pages/project-details-page.tsx';
import { ArtistDetailsPage } from './pages/artist-details-page.tsx';
import { ReleaseDetailsPage } from './pages/release-details-page.tsx';
import { MusicAnalyzerPage } from './pages/music-analyzer-page.tsx';
import { LandingPage } from './pages/landing-page.tsx';
import { ProfilePage } from './pages/profile-page.tsx';
import { HelpPage } from './pages/help-page.tsx';
import { PrivateRoute } from './components/private-route.tsx';

function App() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
      if (!session && window.location.pathname.startsWith('/dashboard')) {
        navigate('/auth');
      } else if (session && window.location.pathname.startsWith('/auth')) {
        navigate('/dashboard');
      }
    }
  }, [session, loading, navigate]);

  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="artists/:artistId" element={<ArtistDetailsPage />} />
        <Route path="releases/:releaseId" element={<ReleaseDetailsPage />} />
        <Route path="analyzer" element={<MusicAnalyzerPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>
      {/* Catch-all for undefined routes */}
      <Route path="*" element={<NotFoundPage />} /> 
    </Routes>
  );
}

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg">Sorry, the page you're looking for does not exist.</p>
      <button
        className="mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => window.location.href = '/dashboard'}
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default App;
