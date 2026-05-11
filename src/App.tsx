import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommandKMenu } from '@/components/command-k-menu/CommandKMenu';
import { checkAndFetchProfile, getSupabase } from './supabase';
import { useUserStore } from './utils/stores/userStore';
import { useThemeStore } from './utils/stores/themeStore';
import { lov_initialise } from 'lovable-tagger';
import { AIHelpNudge } from './components/ai-nudge/AIHelpNudge';
import { MobileFab } from './components/mobile-fab/MobileFab';
import { ChatNudge } from './components/chat/ChatNudge';

const queryClient = new QueryClient();

function App() {
  const [loading, setLoading] = useState(true);
  const setUser = useUserStore((state) => state.setUser);
  const supabase = getSupabase();
  const location = useLocation();
  const { resolvedTheme, theme } = useThemeStore();

  useEffect(() => {
    // Initialize Lovable Tagger only once
    lov_initialise();
  }, []);

  useEffect(() => {
    const handleAuthChange = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const profile = await checkAndFetchProfile(data.session);
        if (profile) {
          setUser(profile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      handleAuthChange();
    });

    handleAuthChange(); // Initial check on load

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, setUser]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center bg-background ${resolvedTheme === 'dark' ? 'dark' : ''}`}
      >
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <div className={`app ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
          <Outlet />
          <Toaster />
          <CommandKMenu />
          <AIHelpNudge />
          <MobileFab />
          <ChatNudge /> { /* Add the ChatNudge component here */}
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
