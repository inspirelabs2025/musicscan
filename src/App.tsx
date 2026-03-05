import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import { ChatPrompt } from "@/components/ui/chat-prompt";
import { checkAndTriggerChatPrompt } from "@/lib/retention-prompts";

const queryClient = new QueryClient();

function App() {
  // This effect would typically run after user authentication/project selection
  // For demonstration, let's assume a projectId exists after login
  useEffect(() => {
    const projectId = "demo-project-123"; // Replace with actual project ID from context/store
    checkAndTriggerChatPrompt(projectId);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<ProtectedRoute element={<Home />} />} />
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/projects" element={<ProtectedRoute element={<Projects />} />} />
              <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
              <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* Chat Prompt component rendered globally */}
            <ChatPrompt />
          </AuthProvider>
        </Router>
      </TooltipProvider>
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
