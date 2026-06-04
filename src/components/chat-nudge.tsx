import React from 'react';
import { X } from 'lucide-react';

interface ChatNudgeProps {
  isVisible: boolean;
  onClose: () => void;
  messageCount: number;
}

export const ChatNudge: React.FC<ChatNudgeProps> = ({ isVisible, onClose, messageCount }) => {
  if (!isVisible || messageCount > 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-ai-nudge-background text-ai-nudge-foreground border border-ai-nudge-border rounded-lg shadow-lg max-w-sm animate-fade-in">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium">
          💬 Heb je de chat al geprobeerd?
          <br/>
          Er zijn pas {messageCount} chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!
        </p>
        <button
          onClick={onClose}
          className="text-ai-nudge-foreground/70 hover:text-ai-nudge-foreground focus:outline-none focus:ring-2 focus:ring-ai-nudge-foreground/50 rounded-full p-1 transition-colors"
          aria-label="Sluit melding"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <a
        href="/chat"
        className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
      >
        Naar de chat
      </a>
    </div>
  );
};
