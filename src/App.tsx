import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import SearchPage from './pages/SearchPage';
AlbumDetailsPage from './pages/albums/AlbumDetailsPage';
import ArtistDetailsPage from './pages/artists/ArtistDetailsPage';
import RecordLabelDetailsPage from './pages/record-labels/RecordLabelDetailsPage';
import ProfilePage from './pages/profile/ProfilePage';
import AuthPage from './pages/AuthPage';
import CreateProfilePage from './pages/profile/CreateProfilePage';
import { SupabaseProvider } from './integrations/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/app/ProtectedRoute';
import SettingsPage from './pages/settings/SettingsPage';
import { ThemeProvider } from './integrations/theme-provider';
import { AI_NUDGE_VARIANT } from './lib/constants';
import AiNudge from './components/growth/AiNudge';
import { useAuth } from './hooks/useAuth';
import { useAIUsage } from './hooks/useAIUsage';
import { trackEvent } from './integrations/analytics';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: '/', element: <IndexPage /> },
  { path: '/search', element: <SearchPage /> },
  {
    path: '/albums/:albumId',
    element: <AlbumDetailsPage />,
  },
  {
    path: '/artists/:artistId',
    element: <ArtistDetailsPage />,
  },
  {
    path: '/record-labels/:recordLabelId',
    element: <RecordLabelDetailsPage />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/profile/create',
    element: (
      <ProtectedRoute>
        <CreateProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/:profileId',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  const [showAiNudge, setShowAiNudge] = useState(false);
  const { session } = useAuth();
  const { aiUsageCount } = useAIUsage(session?.user?.id);

  useEffect(() => {
    // Check if AI Nudge is enabled and user hasn't used AI features
    if (AI_NUDGE_VARIANT === 'nudge' && aiUsageCount === 0 && session?.user?.id) {
      setShowAiNudge(true);
      trackEvent('ai_nudge_impression', { variant: 'nudge', user_id: session.user.id });
    } else {
      setShowAiNudge(false);
    }
  }, [aiUsageCount, session?.user?.id]);

  return (
    <div className='relative min-h-screen'>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
            <RouterProvider router={router} />
            {showAiNudge && (
              <div className='fixed bottom-4 right-4 z-50 animate-fade-in'>
                <AiNudge
                  title='🤖 AI features beschikbaar!'
                  description='Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!'
                  onClose={() => setShowAiNudge(false)}
                />
              </div>
            )}
            <Toaster />
          </ThemeProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
