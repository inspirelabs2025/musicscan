import './App.css';
import { Outlet } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { Loader } from './components/shared/loader';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthenticatedApp } from './AuthenticatedApp';
import { UnauthenticatedApp } from './UnauthenticatedApp';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from './components/theme-provider';
import { PosthogProvider } from './lib/analytics';
import { supabase } from './lib/supabase';
import { GrowthBookProvider } from '@growthbook/growthbook-react';
import { growthbook } from './lib/growthbook';
import { AINudge } from './components/ui/ai-nudge';

function App() {
  const { session, isLoading } = useAuth();
  const [aiUsageCount, setAiUsageCount] = useState(0);

  useEffect(() => {
    // In a real application, you would fetch this from a user profile or analytics backend
    // For this example, we'll simulate a fetch or use a placeholder.
    const fetchAiUsage = async () => {
      // Simulate fetching AI usage count for the current user
      // Replace with actual data fetching logic from your backend/DB
      // For now, it's always 0 for demonstration purposes.
      const count = 0; // This should come from user data or a tracking system
      setAiUsageCount(count);
    };
    fetchAiUsage();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <PosthogProvider>
      <GrowthBookProvider growthbook={growthbook}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          {session ? (
            <AuthenticatedApp>
              <Suspense fallback={<Loader />}>
                <Outlet />
                <AINudge aiUsageCount={aiUsageCount} />
              </Suspense>
            </AuthenticatedApp>
          ) : (
            <UnauthenticatedApp>
              <Suspense fallback={<Loader />}>
                <Outlet />
              </Suspense>
            </UnauthenticatedApp>
          )}
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </GrowthBookProvider>
    </PosthogProvider>
  );
}

export default App;
