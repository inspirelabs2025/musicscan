import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import { AiNudge } from './components/ui/ai-nudge';
import { trackPageView } from './lib/analytics';

const Layout = lazy(() => import('./components/Layout'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ArtistDetailsPage = lazy(() => import('./pages/ArtistDetailsPage'));
const AlbumDetailsPage = lazy(() => import('./pages/AlbumDetailsPage'));
const TrackDetailsPage = lazy(() => import('./pages/TrackDetailsPage'));
const ScanPage = lazy(() => import('./pages/ScanPage'));
const ReleasesPage = lazy(() => import('./pages/ReleasesPage'));
const ReleaseDetailsPage = lazy(() => import('./pages/ReleaseDetailsPage'));
const NewReleasePage = lazy(() => import('./pages/NewReleasePage'));
const AIAnalyzePage = lazy(() => import('./pages/AIAnalyzePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<div>Loading...</div>}>
          <Layout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/profile/:userId?', element: <ProfilePage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/artist/:artistId', element: <ArtistDetailsPage /> },
      { path: '/album/:albumId', element: <AlbumDetailsPage /> },
      { path: '/track/:trackId', element: <TrackDetailsPage /> },
      { path: '/scan', element: <ScanPage /> },
      { path: '/releases', element: <ReleasesPage /> },
      { path: '/release/new', element: <NewReleasePage /> },
      { path: '/release/:releaseId', element: <ReleaseDetailsPage /> },
      { path: '/ai-analyze', element: <AIAnalyzePage /> },

      // Catch-all route for 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

function App() {

  useEffect(() => {
    // Initialize Google Analytics page view tracking
    const handleRouteChange = () => {
      trackPageView(window.location.pathname + window.location.search);
    };

    // Initial page view
    handleRouteChange();

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    // For react-router-dom, you might need to tap into its navigation events
    // or use a custom hook if you need to track hash changes or specific internal navigations accurately.

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
        <AiNudge aiFeaturePath="/ai-analyze" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
