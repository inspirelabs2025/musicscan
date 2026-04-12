import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import { Toaster } from "./components/ui/sonner";
import Auth from "./pages/Auth";
import Project from "./pages/Project";
import ProjectSettings from "./pages/ProjectSettings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Analytics from "./components/Analytics";
import { useAuth } from "./hooks/useAuth";
import { UserStatusProvider, useUserStatus } from "./hooks/useUserStatus";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import AiAssistant from "./components/AiAssistant";
import { AI_NUDGE_VARIANTS, AiNudgeProvider, useAiNudge } from "./hooks/useAiNudge";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();
  const { userStatus } = useUserStatus();
  const { setVariant, setForceVisible, addNudge } = useAiNudge();

  // Set the AI Nudge variant based on environment variable or assign randomly
  useEffect(() => {
    const envVariant = import.meta.env.AI_NUDGE_VARIANT;
    if (envVariant && Object.values(AI_NUDGE_VARIANTS).includes(envVariant)) {
      setVariant(envVariant);
    } else {
      // Randomly assign control or nudge for client-side A/B testing
      setVariant(Math.random() < 0.5 ? AI_NUDGE_VARIANTS.CONTROL : AI_NUDGE_VARIANTS.NUDGE);
    }
  }, [setVariant]);

  // Example: AI Nudge for chat usage
  useEffect(() => {
    if (userStatus?.total_chat_messages === 0) {
      addNudge({
        id: 'chat-nudge',
        message: '💬 Heb je de chat al geprobeerd? Probeer de chatfunctie om sneller antwoorden te krijgen!',
        actionLabel: 'Ga naar chat',
        action: () => {
          window.location.href = '/chat'; // Or use navigate from react-router-dom
        },
        onDismiss: () => {
          // Mark nudge as dismissed in backend or local storage
          console.log('Chat nudge dismissed');
        },
        priority: 1
      });
    }
  }, [userStatus?.total_chat_messages, addNudge]);


  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute user={user} />}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/project/:projectId" element={<Project />} />
        <Route path="/project/:projectId/settings" element={<ProjectSettings />} />
        <Route path="/project/:projectId/chat" element={<Chat />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserStatusProvider>
        <AiNudgeProvider>
          <AppRoutes />
          <Toaster />
          <AiAssistant />
          <Analytics />
        </AiNudgeProvider>
      </UserStatusProvider>
    </QueryClientProvider>
  );
}

export default App;
