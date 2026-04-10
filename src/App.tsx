import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './AppRoutes';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/context/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProjectProvider } from './context/ProjectContext';
import { useNudge } from './hooks/useNudge';
import AIChatNudge from './components/AIChatNudge';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldShowNudge, dismissNudge } = useNudge('chat_nudge', 'AI_CHAT_NUDGE_VARIANT');

  const trackPageViews = useCallback(() => {
    // Ensure GA_MEASUREMENT_ID is defined before sending to GA
    if (import.meta.env.VITE_GA_MEASUREMENT_ID && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location]);

  useEffect(() => {
    trackPageViews();
  }, [trackPageViews]);

  const handleNudgeDismiss = () => {
    dismissNudge();
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <ProjectProvider>
            <AppRoutes />
            <Toaster />
            <Analytics />
            {shouldShowNudge && (
              <AIChatNudge
                title="💬 Heb je de chat al geprobeerd?"
                message="Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!"
                onDismiss={handleNudgeDismiss}
              />
            )}
          </ProjectProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
