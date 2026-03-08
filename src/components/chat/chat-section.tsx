import React from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { useChat } from '@/hooks/useChat';
import { Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatSectionProps {
  projectId: string;
}

export const ChatSection: React.FC<ChatSectionProps> = ({ projectId }) => {
  const { messages, sendMessage, isLoading, isError } = useChat(projectId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Laden van chatberichten...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <p>Er is een fout opgetreden bij het laden van de chat.</p>
      </div>
    );
  }

  const handleSendMessage = async (text: string) => {
    await sendMessage(text, projectId);
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg shadow-sm">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Begin een gesprek!</h3>
          <p className="max-w-md">Er zijn pas <span className="font-bold">0 chatberichten</span> in dit project. Probeer de chatfunctie om sneller antwoorden te krijgen!</p>
          <p className="mt-2 text-sm">Typ hieronder je eerste bericht om te beginnen.</p>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}
      <div className="p-4 border-t">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};
