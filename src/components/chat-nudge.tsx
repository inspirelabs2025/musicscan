import React from 'react';
import { MessageSquare } from 'lucide-react';

interface ChatNudgeProps {
  chatMessageCount: number;
}

/**
 * Renders a chat nudge component if the chatMessageCount is 0.
 * Encourages the user to try the chat feature.
 */
export const ChatNudge: React.FC<ChatNudgeProps> = ({ chatMessageCount }) => {
  if (chatMessageCount > 0) {
    return null; // Don't show nudge if user has already sent chat messages
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-chat-nudge-border bg-chat-nudge-background p-4 shadow-md mt-4">
      <MessageSquare className="h-6 w-6 text-chat-nudge-foreground" />
      <div className="flex-grow">
        <p className="text-sm font-medium text-chat-nudge-foreground">
          Heb je de chat al geprobeerd?
        </p>
        <p className="text-xs text-chat-nudge-foreground/80">
          Er zijn nog geen chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!
        </p>
      </div>
    </div>
  );
};
