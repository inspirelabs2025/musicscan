import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';

export const ChatNudge: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    // Optionally, store this preference in local storage to prevent showing again
    localStorage.setItem('chatNudgeDismissed', 'true');
  };

  // Check local storage on mount to see if it was previously dismissed
  React.useEffect(() => {
    if (localStorage.getItem('chatNudgeDismissed')) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Card className="w-80 border-chat-nudge-border bg-chat-nudge-background text-chat-nudge-foreground shadow-lg dark:text-chat-nudge-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">💬 Heb je de chat al geprobeerd?</CardTitle>
          <button onClick={handleClose} className="text-chat-nudge-foreground hover:text-gray-600 focus:outline-none">
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs text-chat-nudge-foreground/80 dark:text-chat-nudge-foreground/80">
            Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!
          </CardDescription>
          <div className="mt-4">
            {/* Optionally add a button to navigate to chat or open chat widget */}
            <a
              href="/chat" // Replace with your actual chat route
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Naar chat
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
