import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";
import UserProvider from "@/context/UserContext";
import ProtectedLayout from "@/lib/ProtectedLayout";
import SignUp from "@/pages/Auth/SignUp";
import SignIn from "@/pages/Auth/SignIn";
import { Project } from "@/pages/Project";
import Analytics from "@/lib/Analytics";
import SEO from "@/lib/SEO";
import { ChatNudge } from "@/components/chat-nudge"; // Import ChatNudge
import { useState } from "react"; // Import useState

const queryClient = new QueryClient();

function App() {
  // For demonstration, let's assume `hasChatMessages` comes from context or a hook.
  // In a real application, you'd fetch this count for the current project.
  const [hasChatMessages] = useState(false); // Simulate no chat messages initially

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
          <Analytics /> {/* Google Analytics Initialization */}
          <SEO /> {/* SEO Initialization */}
          <Routes>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/project/:projectId/*" element={<Project />} />
              {/* Add other protected routes here */}
            </Route>
          </Routes>
          <Toaster />
          {/* Conditionally render ChatNudge */} 
          <ChatNudge hasChatMessages={hasChatMessages}/>
        </BrowserRouter>
      </UserProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
