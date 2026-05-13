import './App.css';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { useAuth } from './hooks/useAuth';
import { Toaster } from './components/ui/sonner';
import { checkSupabaseAuth } from './api/auth';
import SplashScreen from './components/SplashScreen';
import AiNudge from './components/AiNudge'; // Import AiNudge
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabaseClient';

function App() {
  const { user, loading: authLoading, setSession } = useAuth();
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsAppLoading(true);
      await checkSupabaseAuth(setSession);
      setIsAppLoading(false);
    };

    initializeAuth();
  }, [setSession]);

  // Fetch chat message count for the nudge feature
  const { data: chatMessageCount = 0, isLoading: loadingChatCount } = useQuery({
    queryKey: ['chatMessagesCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching chat messages count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!user, // Only run if user is logged in
  });

  const showChatNudge = user && chatMessageCount === 0 && !loadingChatCount;


  if (isAppLoading || authLoading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <div className="relative flex flex-col min-h-screen">
        <AppRoutes />
        <Toaster />
        {showChatNudge && (
          <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
            <AiNudge variant="chat_encouragement" />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
