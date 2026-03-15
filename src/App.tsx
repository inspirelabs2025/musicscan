import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/pages/application/header";
import { Sidebar } from "@/pages/application/sidebar";
import { useTheme } from "./hooks/use-theme";
import { cn } from "./lib/utils";
import { useInitializeApp } from "./hooks/use-initialize-app";
import { FullScreenLoading } from "./components/full-screen-loading";
import { useAiNudge } from './hooks/use-ai-nudge';
import { AiNudgeBanner } from './components/ui/ai-nudge-banner';
import { useEffect } from 'react';

function App() {
  const { theme, systemThemeLoaded } = useTheme();
  const { isLoading: appLoading } = useInitializeApp();
  const { showNudge, dismissNudge, exploreAiFeatures, simulateAiUsage, abTestVariant } = useAiNudge();

  useEffect(() => {
    // This is a temporary way to simulate AI usage for testing the nudge.
    // In a real application, `simulateAiUsage()` should be called when
    // an actual AI feature is successfully used by the user.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && event.altKey) {
        simulateAiUsage();
        console.log('Simulated AI usage. Nudge might disappear if count > 0 for nudge variant.');
        alert('AI usage simulated!');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [simulateAiUsage]);

  if (!systemThemeLoaded || appLoading) {
    return <FullScreenLoading />;
  }

  return (
    <div className={cn("min-h-screen grid-rows-app grid-cols-app grid transition-colors duration-200 ease-in-out", theme === 'dark' ? 'dark' : theme)}>
      <TooltipProvider delayDuration={0}>
        <Header />
        <Sidebar />
        <main className="fade-in col-start-2 row-start-2 p-8 overflow-y-auto lg:p-4">
          <Outlet />
        </main>
        <Toaster />
      </TooltipProvider>
      {showNudge && (
        <AiNudgeBanner
          onDismiss={dismissNudge}
          onExplore={exploreAiFeatures}
        />
      )}
    </div>
  );
}

export default App;
