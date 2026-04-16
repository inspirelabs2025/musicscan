import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AccountPage from './pages/AccountPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { ChatNudge } from './components/ui/chat-nudge'; // Assuming this is where it's created for now

const AppContent: React.FC = () => {
  const [messageCount, setMessageCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate fetching message count from an API or context
    // In a real application, this would come from a global state or database
    const simulateMessageCountFetch = setTimeout(() => {
      setMessageCount(0); // For testing the nudge, set to 0
      // setMessageCount(Math.random() > 0.5 ? 0 : 5); // Random for testing
    }, 1000);

    return () => clearTimeout(simulateMessageCountFetch);
  }, []);

  const handleTryChat = () => {
    // For now, navigate to a placeholder chat route or open a chat widget
    console.log('User clicked to try chat!');
    navigate('/dashboard/chat'); // Example: navigate to a chat specific route
    // In a real app, this might open a chat modal or focus on a chat component
  };

  return (
    <TooltipProvider>
      <Toaster />
      {/* Example of where to potentially place the nudge, e.g., on a dashboard page or a specific view */}
      {/* This would ideally be integrated more contextually within a page */}
      {/* For demonstration purposes, placing it here to show its functionality */}
      {/* <div className="fixed bottom-4 right-4 z-50"> */}
      {/*   <ChatNudge messageCount={messageCount} onTryChat={handleTryChat} /> */}
      {/* </div> */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard/*" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </TooltipProvider>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <SidebarProvider>
            <AppContent />
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
