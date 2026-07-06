import { MessageSquareTextIcon, X } from 'lucide-react';
import { useState } from 'react';

interface ChatNudgeProps {
  chatMessagesCount: number;
}

export function ChatNudge({ chatMessagesCount }: ChatNudgeProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || chatMessagesCount > 0) {
    return null;
  }

  // TODO: Add actual link to chat functionality
  const handleChatClick = () => {
    console.log('Navigating to chat...');
    setIsVisible(false); // Hide nudge after user interacts or navigates
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div
        className="relative flex items-center gap-3 rounded-lg border border-chat-nudge-border bg-chat-nudge-background p-4 shadow-lg"
        role="alert"
      >
        <MessageSquareTextIcon className="size-6 text-chat-nudge-foreground" />
        <div className="flex-grow">
          <p className="text-sm font-medium text-chat-nudge-foreground">
            Nog geen chatberichten?
          </p>
          <p className="text-xs text-chat-nudge-foreground opacity-90">
            Probeer de chatfunctie om sneller antwoorden te krijgen!
          </p>
        </div>
        <button
          onClick={handleChatClick}
          className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Probeer chat
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 rounded-full bg-chat-nudge-background p-1 text-chat-nudge-foreground/70 hover:text-chat-nudge-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Sluit melding"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
