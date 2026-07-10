import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppUpdateListener } from '@/components/app-update-listener';
import { useAuth } from './hooks/use-auth';
import { useInitializeApp } from './hooks/use-initialize-app';
import { AiNudge } from './components/ui/ai-nudge';
import { useAiNudge } from './hooks/use-ai-nudge';

function App() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { isInitialized, isLoading: isInitLoading } = useInitializeApp();
  const { isVisible: isAiNudgeVisible, dismissNudge, recordAiUsage } = useAiNudge();
  const navigate = useNavigate();
  const location = useLocation();

  // Temporary: Check if the AI nudge was just closed and prevent re-showing for now
  // This will be replaced by more sophisticated A/B testing logic.
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('aiNudgeClosed') === 'true') {
      // This is a temporary placeholder. A real A/B test would use a
      // more robust way to manage variant display and analytics.
      dismissNudge(); // Instantly dismiss if the URL indicates it was just closed
      // Clean up the URL if needed, or rely on other state management
      // to prevent re-display without needing to modify URL.
    }
  }, [location.search, dismissNudge]);

  // Example of how to integrate AI Nudge with a CTA click
  const handleAiNudgeCtaClick = () => {
    // In a real application, you would navigate to the AI features page
    // and potentially record an analytics event for the CTA click.
    console.log('AI Nudge CTA clicked');
    navigate('/ai-features'); // Assuming an AI features route exists
    dismissNudge(); // Dismiss the nudge once CTA is clicked
    // Optionally, you might want to call recordAiUsage() here if navigating
    // to the AI features page counts as a usage initiation.
  };

  // For demonstration, let's say a specific route indicates AI usage
  // In a real scenario, this would be triggered when an actual AI feature is used.
  useEffect(() => {
    if (location.pathname.startsWith('/ai-features')) {
      recordAiUsage();
    }
  }, [location.pathname, recordAiUsage]);

  if (isAuthLoading || isInitLoading) {
    // Optionally render a loading spinner or splash screen
    return <div>Loading app...</div>;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div id="app-container" className="bg-background min-h-screen">
        <Outlet />
        <Toaster />
        <AppUpdateListener />

        {/* AI Nudge Component */}
        <AiNudge
          isVisible={isAiNudgeVisible && session !== null} // Only show if logged in
          onClose={dismissNudge}
          onCtaClick={handleAiNudgeCtaClick}
          className="founderos_nudge_ai_features_available"
        />

      </div>
    </TooltipProvider>
  );
}

export default App;
