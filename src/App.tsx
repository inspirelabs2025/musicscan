import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Auth from './pages/Auth';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import RequireAuth from './components/AuthWatcher';
import { Toaster } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';
import ChatNudge from './components/ChatNudge'; // Assuming you create this component

const queryClient = new QueryClient();

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function App() {
  const [showChatNudge, setShowChatNudge] = useState(false);

  useEffect(() => {
    const checkChatMessages = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching message count:', error);
      } else if (count === 0) {
        // Only show the nudge if there are no messages and it hasn't been dismissed before
        const dismissed = localStorage.getItem('chat_nudge_dismissed');
        if (!dismissed) {
          setShowChatNudge(true);
        }
      }
    };

    checkChatMessages();
  }, []);

  const handleDismissNudge = () => {
    setShowChatNudge(false);
    localStorage.setItem('chat_nudge_dismissed', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <RequireAuth supabase={supabase}>
                <Home />
                {showChatNudge && <ChatNudge onDismiss={handleDismissNudge} />}
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
