import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';

interface ChatNudgeProps {
  onTryChat: () => void;
  messageCount: number;
}

export const ChatNudge: React.FC<ChatNudgeProps> = ({ onTryChat, messageCount }) => {
  if (messageCount > 0) {
    return null; // Don't show the nudge if there are already chat messages
  }

  return (
    <Card className="bg-ai-nudge-background border-ai-nudge-border text-ai-nudge-foreground mt-4">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <MessageSquare className="h-8 w-8 text-echo-violet" />
        <CardTitle className="text-lg">Heb je de chat al geprobeerd?</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-ai-nudge-foreground/80 mb-4">
          Er zijn pas {messageCount} chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!
        </CardDescription>
        <Button onClick={onTryChat} className="bg-echo-violet hover:bg-echo-violet/90 text-white">
          Probeer de chat
        </Button>
      </CardContent>
    </Card>
  );
};
