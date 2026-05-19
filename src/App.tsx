import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { Toaster } from 'sonner';

import './index.css';
import { ThemeProvider } from './components/ThemeProvider';
import AppRoutes from './AppRoutes';
import { CommandK } from './components/CommandK';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient();

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AnalyticsWrapper />
        <AppRoutes />
        <CommandK />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// TODO: This wrapper is temporary; eventually, user data/chat messages should be globally accessible or fetched more efficiently.
const AnalyticsWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile?.chat_messages_count === 0) {
      // Display a nudge to encourage chat usage
      // This is a simple example; a more sophisticated solution might involve a dedicated notification system.
      console.log('Nudge: Try the chat feature!');
      // You might want to display a toast, a modal, or a small banner here.
      // For now, let's just log it and potentially navigate or show a temporary message.
      // Example with sonner toast (if sonner is used for toasts in the app):
      // toast.info("Heb je de chat al geprobeerd? Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!", {
      //   duration: 10000,
      //   action: {
      //     label: "Naar chat",
      //     onClick: () => navigate('/chat'),
      //   },
      // });
    }
  }, [user, profile, navigate]);

  return null;
};


export default App;
