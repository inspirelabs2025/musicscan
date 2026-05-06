import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useNProgress } from '@tanstack/react-query-nprogress';
import { Outlet } from 'react-router-dom';
import { AiNudgeBanner } from './components/ui/ai-nudge-banner';
import { useAiNudge } from './hooks/use-ai-nudge';

const queryClient = new QueryClient();

function App() {
  useNProgress(queryClient);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id);
    });

    return () => {
      authListener.unsubscribe();
    };
  }, []);

  const { showNudge, dismissNudge, isLoading: isNudgeLoading } = useAiNudge(userId);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Global AI Nudge Banner */}
      {!isNudgeLoading && showNudge && (
        <AiNudgeBanner onDismiss={dismissNudge} />
      )}

      {/* Main app content, adjusted for banner */}
      <div className={!isNudgeLoading && showNudge ? 'mt-16' : ''}> {/* Adjust margin if banner is shown */}
        <Outlet />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
