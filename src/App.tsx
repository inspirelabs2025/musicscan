import { useContext, useEffect, useState } from "react";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { ThemeProvider } from "./components/theme-provider";
import router from "./router";

import { LovableProvider } from "lovable-tagger";
import { lovConfig } from "./lovable.config";
import { AudioProvider } from "./components/audio-provider";
import { ModalsProvider } from "./components/modals-provider";
import { SettingsProvider } from "./components/settings-provider";
import { CurrentProjectContext } from "./contexts/current-project-context";
import { ChatNudge } from "./components/common/chat-nudge.tsx";

const queryClient = new QueryClient();

function App() {
  const { currentProject } = useContext(CurrentProjectContext);
  const [showChatNudge, setShowChatNudge] = useState(false);

  useEffect(() => {
    if (currentProject?.id && currentProject.chatMessagesCount === 0) {
      const hasDismissedNudge = localStorage.getItem(`chatNudgeDismissed-${currentProject.id}`);
      if (!hasDismissedNudge) {
        setShowChatNudge(true);
      }
    } else {
      setShowChatNudge(false);
    }
  }, [currentProject]);

  const handleDismissChatNudge = () => {
    if (currentProject?.id) {
      localStorage.setItem(`chatNudgeDismissed-${currentProject.id}`, 'true');
    }
    setShowChatNudge(false);
  };

  return (
    <LovableProvider config={lovConfig}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <AudioProvider>
              <ModalsProvider>
                <RouterProvider router={router} />
                <Toaster richColors />

                {showChatNudge && (
                  <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
                    <ChatNudge isVisible={showChatNudge} onClose={handleDismissChatNudge} />
                  </div>
                )}

              </ModalsProvider>
            </AudioProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </LovableProvider>
  );
}

export default App;
