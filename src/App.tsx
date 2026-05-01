import './App.css';
import { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { useAuth } from './hooks/useAuth';
import { Loader } from 'lucide-react';
import { LovableClient } from 'lovable-tagger';
import { Badge } from './components/ui/badge';
import { supabase } from '@/supabaseClient';

const AppRoutes = lazy(() => import('./AppRoutes'));

const queryClient = new QueryClient();

const lovable = new LovableClient();

function App() {
  const { user, loading } = useAuth();
  const [showChatNudge, setShowChatNudge] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      const checkChatMessages = async () => {
        // Fetch project_id for the current user's active project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (projectError) {
          console.error('Error fetching project:', projectError.message);
          return;
        }

        if (projectData) {
          const { count, error: chatCountError } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact' })
            .eq('project_id', projectData.id);

          if (chatCountError) {
            console.error('Error fetching chat messages count:', chatCountError.message);
            return;
          }

          if (count === 0) {
            setShowChatNudge(true);
          }
        }
      };

      checkChatMessages();
    }
  }, [user, loading]);

  // Lovable sandbox badge
  useEffect(() => {
    if (lovable.isDevelopment() && lovable.isLovableSandbox() && lovable.shouldShowBadge()) {
      const currentURL = window.location.href;
      const url = new URL(currentURL);
      const forceHideBadge = url.searchParams.get('forceHideBadge');
      if (forceHideBadge !== 'true') {
        lovable.insertBadge({
          position: 'bottom-left',
          variant: 'floating',
        });
      }
    } else {
      lovable.removeBadge();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
              </div>
            }
          >
            <AppRoutes />
            <Toaster />
            {showChatNudge && (
              <div className="fixed bottom-4 right-4 z-[9999]">
                <Badge
                  variant="outline"
                  className="transform cursor-pointer animate-fade-in border-ai-nudge-border bg-ai-nudge-background px-4 py-2 text-base text-ai-nudge-foreground shadow-lg transition-transform duration-300 ease-out hover:scale-105"
                  onClick={() => {
                    // Potentially navigate to chat or open chat widget
                    // For now, just hide it after click
                    setShowChatNudge(false);
                    console.log('Chat nudge clicked!');
                  }}
                >
                  💬 Heb je de chat al geprobeerd? Probeer de chatfunctie om sneller antwoorden te krijgen!
                </Badge>
              </div>
            )}
          </Suspense>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
