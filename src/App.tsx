import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router } from 'react-router-dom';
import { LovableWrapper } from '@/components/lovable-wrapper';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppRoutes from '@/AppRoutes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Nudge } from './components/cs-nudge'; // Import the Nudge component
import { useEffect, useState } from 'react';

const queryClient = new QueryClient();

function App() {
  const [showChatNudge, setShowChatNudge] = useState(false);

  useEffect(() => {
    // Simulate fetching chat message count and user status
    const hasChatMessages = localStorage.getItem('hasChatMessages') === 'true';
    const hasDismissedChatNudge = localStorage.getItem('hasDismissedChatNudge') === 'true';

    if (!hasChatMessages && !hasDismissedChatNudge) {
      setShowChatNudge(true);
    }
  }, []);

  const handleDismissChatNudge = () => {
    localStorage.setItem('hasDismissedChatNudge', 'true');
    setShowChatNudge(false);
  };

  const handleChatInitiated = () => {
    localStorage.setItem('hasChatMessages', 'true');
    setShowChatNudge(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Router>
            <LovableWrapper>
              <AppRoutes />
            </LovableWrapper>
          </Router>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      {showChatNudge && (
        <Nudge
          title="Heb je de chat al geprobeerd?"
          message="Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!"
          onDismiss={handleDismissChatNudge}
          ctaText="Start een chat"
          onCtaClick={handleChatInitiated}
        />
      )}
    </QueryClientProvider>
  );
}

export default App;
