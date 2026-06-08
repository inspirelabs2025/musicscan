import React from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface ChatNudgeProps {
  onDismiss: () => void;
}

const ChatNudge: React.FC<ChatNudgeProps> = ({ onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-chat-nudge-background text-chat-nudge-foreground border border-chat-nudge-border rounded-lg shadow-lg max-w-sm flex items-start space-x-2 animate-fade-in">
      <div className="flex-1">
        <p className="font-semibold text-sm mb-1">💬 Heb je de chat al geprobeerd?</p>
        <p className="text-xs">Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="text-chat-nudge-foreground/70 opacity-80 hover:opacity-100 p-1 rounded-full"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatNudge;
