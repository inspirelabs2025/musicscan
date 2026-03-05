import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Settings } from "@/pages/Settings";
import ProjectPage from "@/pages/ProjectPage";
import { ScrollArea } from "@/components/ui/scroll-area";
import Onboarding from "./pages/Onboarding";
import { Auth as AuthPage } from "./pages/Auth";
import Callback from "./pages/Callback";
import { useAuth } from "./hooks/use-auth";
import { useEffect } from "react";
import ProjectOverview from "./pages/ProjectOverview";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "./components/ui/use-toast";
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from "./components/theme-provider";
import { AIFeaturesPage } from "./pages/AIFeaturesPage"; // Assuming this page exists or will be created
import { AIFeatureNudge } from './components/ui/ai-feature-nudge';
import { useAIUsageTracker } from './hooks/use-ai-usage-tracker';
import { getVariant, trackABTestEvent } from './lib/ab-test';

function App() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { usageData } = useAIUsageTracker();

  // A/B test for the AI Nudge
  const aiNudgeVariant = getVariant('aiNudgeVariant');
  const showAINudge = aiNudgeVariant === 'nudge' && usageData.usageCount === 0;

  useEffect(() => {
    if (!isLoading && !user && !['/auth', '/callback', '/onboarding'].includes(location.pathname)) {
      navigate('/auth');
    }
    if (!isLoading && user && ['/auth', '/callback'].includes(location.pathname)) {
      navigate('/projects');
    }
  }, [user, isLoading, navigate, location.pathname]);

  useEffect(() => {
    if (showAINudge) {
      trackABTestEvent('aiNudgeVariant', 'ai_nudge_impression');
    }
  }, [showAINudge]);

  const handleDismissAINudge = () => {
    // Implement actual dismissal logic, e.g., set a flag in local storage or user preferences
    // For now, we'll just log it.
    console.log('AI Nudge dismissed or clicked');
    trackABTestEvent('aiNudgeVariant', 'ai_nudge_dismissed');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex h-screen bg-background text-foreground">
        {user && location.pathname !== '/auth' && location.pathname !== '/callback' && location.pathname !== '/onboarding' && (
          <Sidebar>
            {showAINudge && (
              <AIFeatureNudge isVisible={true} onDismiss={handleDismissAINudge} />
            )}
          </Sidebar>
        )}
        <ScrollArea className="flex-1">
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/callback" element={<Callback />} />
            {user && (
              <>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/projects" element={<ProjectOverview />} />
                <Route path="/project/:projectId/*" element={<ProjectPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/ai-features" element={<AIFeaturesPage />} />
                {/* Add more authenticated routes here */}
              </>
            )}
          </Routes>
        </ScrollArea>
        <Toaster />
      </div>
      <Analytics />
    </ThemeProvider>
  );
}

export default App;
