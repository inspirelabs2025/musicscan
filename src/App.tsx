import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Outlet, RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode, useEffect } from "react";
import ReactDOM from "react-dom/client";
import posthog from "posthog-js";

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { useAuth } from "./hooks/useAuth";
import { useMessages } from "./hooks/useMessages";
import { ChatNudge } from "./components/chat-nudge";


const router = createRouter({
  routeTree,
  context: { auth: undefined! },
});

// Initialize PostHog
posthog.init('phc_5f18sI2u4j4X7H4kQ09W2z2', {
  api_host: "https://app.posthog.com",
});

function App() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const auth = useAuth(); // Provide authentication context to the router
  const { messageCount } = useMessages(); // Hook to get chat message count

  useEffect(() => {
    console.log(`Current chat messages count: ${messageCount}`);
  }, [messageCount]);

  return (
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <RouterProvider router={router} context={{ auth }} />
          <Toaster />
          {messageCount === 0 && <ChatNudge />}
        </TooltipProvider>
      </ThemeProvider>
    </StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
