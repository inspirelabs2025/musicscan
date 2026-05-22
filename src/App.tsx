import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from './components/ui/tooltip';
import { AppRoutes } from './routes';
import { useEffect } from 'react';
import { useCustomerFeedback } from '@/hooks/useCustomerFeedback';
import { useAuth } from './hooks/useAuth';

function App() {
  const customerFeedback = useCustomerFeedback();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // Example: Triggering feedback based on user activity
      // This is a placeholder for actual logic to determine when to show the nudge
      // For this task, we're assuming a condition like 'no chat messages sent'
      // The actual analytics event for chat messages would be integrated here.
      const hasChatMessages = false; // Replace with actual check for chat messages
      if (!hasChatMessages) {
        customerFeedback.triggerNudge({
          id: 'chat-nudge-0-messages',
          title: 'Heb je de chat al geprobeerd?',
          message: 'Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!',
          actionLabel: 'Naar chat', // Example action, assuming there's a chat page
          onAction: () => {
            // Navigate to the chat page or open chat widget
            console.log('User clicked to go to chat');
            // Programmatically navigate or open chat interface
            // For example: window.location.href = '/chat';
          },
          type: 'info',
        });
      }
    }
  }, [user?.id, customerFeedback]); // Dependency on user.id to trigger once per user session

  return (
    <TooltipProvider>
      <AppRoutes />
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
