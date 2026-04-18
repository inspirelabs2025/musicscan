import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Router from "@/pages/Router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Analytics from "./Analytics";
import { useEffect } from "react";
import { toast } from "sonner";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Simulate fetching chat message count for the current user/project
    // In a real application, replace this with an actual API call
    const hasChatMessages = localStorage.getItem('has_sent_chat_message');
    const chatMessagesCount = hasChatMessages ? 1 : 0; // 0 for new user, >0 if they've used chat

    if (chatMessagesCount === 0) {
      const chatNudgeShown = localStorage.getItem('chat_nudge_shown');
      if (!chatNudgeShown) {
        toast("💬 Gebruik je de chat al?", {
          description: "Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!",
          action: {
            label: "Start Chat",
            onClick: () => {
              // Simulate navigating to chat or opening chat widget
              console.log("User clicked to start chat");
              localStorage.setItem('has_sent_chat_message', 'true'); // Assume they will use it now
              // Potentially redirect to chat page or open a chat widget
            },
          },
          duration: 10000,
        });
        localStorage.setItem('chat_nudge_shown', 'true');
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
      <Analytics />
    </QueryClientProvider>
  );
}

export default App;
