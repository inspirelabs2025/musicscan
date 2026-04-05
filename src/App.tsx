import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import OverviewPage from "./pages/OverviewPage";
import SettingsPage from "./pages/SettingsPage";
import RecordingsPage from "./pages/RecordingsPage";
import ProjectSettingsPage from "./pages/ProjectSettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";
import { ChatNudge } from './components/ui/chat-nudge';
import { useState, useEffect } from 'react';

function App() {
  const { session } = useAuth();
  const [chatMessageCount, setChatMessageCount] = useState(0);

  // This would typically come from an API call or a real-time subscription
  // For demonstration, we'll simulate it.
  useEffect(() => {
    // Simulate fetching chat message count for the current project/user
    // In a real app, you'd fetch this from your backend (e.g., Supabase)
    const fetchMessageCount = async () => {
      // Replace with actual API call
      const count = localStorage.getItem('chatMessageCount') ? parseInt(localStorage.getItem('chatMessageCount') || '0') : 0;
      setChatMessageCount(count);
    };
    fetchMessageCount();

    // Simulate incrementing count when a message is sent (for example)
    // This is just a placeholder, actual chat integration would update this.
    const handleNewMessage = () => {
      setChatMessageCount(prev => prev + 1);
      localStorage.setItem('chatMessageCount', (chatMessageCount + 1).toString());
    };
    // Example: window.addEventListener('chatMessageSent', handleNewMessage);
    // return () => window.removeEventListener('chatMessageSent', handleNewMessage);

  }, []); // Empty dependency array means this runs once on mount

  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute session={session}>
              <DashboardLayout>
                <Routes>
                  <Route path="/overview" element={<OverviewPage />} />
                  <Route path="/recordings" element={<RecordingsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/project-settings" element={<ProjectSettingsPage />} />
                  <Route path="/integrations" element={<IntegrationsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<OverviewPage />} /> {/* Default route */}
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
      {session && chatMessageCount === 0 && <ChatNudge messageCount={chatMessageCount} />}
    </>
  );
}

export default App;
