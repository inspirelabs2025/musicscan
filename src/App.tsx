import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import { Dashboard } from "./pages/Dashboard";
import { Project } from "./pages/Project";
import { Landing } from "./pages/Landing";
import { Settings } from "./pages/Settings";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Lifebuoy } from "lucide-react";

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      if (location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/") {
        navigate("/dashboard");
      }
    } else {
      if (location.pathname === "/dashboard" || location.pathname.startsWith("/project/") || location.pathname === "/settings") {
        navigate("/login");
      } else if (location.pathname !== "/" && location.pathname !== "/login" && location.pathname !== "/register") {
        // If not logged in and trying to access an invalid path, redirect to landing
        navigate("/");
      }
    }
  }, [user, navigate, location.pathname]);

  useEffect(() => {
    // Customer success nudge: Chat feature. Show only once after login.
    const hasSeenChatNudge = localStorage.getItem('hasSeenChatNudge');
    if (user && !hasSeenChatNudge) {
      // Check if the user has sent 0 chat messages
      // This would typically involve a backend API call or state management to get chat message count
      // For this example, we'll simulate it, assuming a new user has 0 messages.
      const userChatMessagesCount = 0; // Replace with actual logic to fetch user's chat message count

      if (userChatMessagesCount === 0) {
        toast.info(
          <div className="flex items-center gap-2">
            <Lifebuoy className="h-5 w-5" />
            <div>
              <p className="font-semibold">Heb je de chat al geprobeerd?</p>
              <p className="text-sm text-muted-foreground">Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!</p>
            </div>
          </div>,
          {
            id: 'chat-nudge',
            duration: 10000,
            action: {
              label: 'Naar chat',
              onClick: () => {
                // Simulate navigation to a chat feature or open chat modal
                console.log('Navigating to chat...');
                // For a real app, you might navigate to a specific project's chat or open a global chat window
                // navigate('/dashboard?openChat=true');
              },
            },
            // Prevent the toast from closing on click if an action button is present
            closeButton: true,
          }
        );
        localStorage.setItem('hasSeenChatNudge', 'true');
      }
    }
  }, [user]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/*"
          element={
            <ProtectedRoute>
              <Project />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
