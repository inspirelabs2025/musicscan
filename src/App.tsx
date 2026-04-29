import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Home from "./pages/Home";
import AuthCallback from "./pages/AuthCallback";
import Layout from "./components/Layout";
import Projects from "./pages/Projects";
import ProjectView from "./pages/ProjectView";
import ProjectSettings from "./pages/ProjectSettings";
import Onboarding from "./pages/Onboarding";
import { Toaster } from "./components/ui/sonner";
import Chat from "./pages/Chat";
import ChatProvider from "./context/ChatContext";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectView />} />
            <Route
              path="/projects/:projectId/settings"
              element={<ProjectSettings />}
            />
             <Route path="/projects/:projectId/chat" element={<Chat />} />
          </Route>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </ChatProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
