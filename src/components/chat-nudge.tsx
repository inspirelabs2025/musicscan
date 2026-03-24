import React from 'react';
import { XIcon, MessageCircleIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface ChatNudgeProps {
  isVisible: boolean;
  onDismiss: () => void;
  onTryChat: () => void;
  messageCount: number; // Prop to hold the number of messages
}

export const ChatNudge: React.FC<ChatNudgeProps> = ({
  isVisible,
  onDismiss,
  onTryChat,
  messageCount
}) => {
  if (!isVisible || messageCount > 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Card className="w-[350px] shadow-lg border-2 border-primary">
        <MessageCircleIcon className="h-10 w-10 text-primary absolute top-4 left-4" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-muted-foreground hover:bg-transparent"
          onClick={onDismiss}
          aria-label="Sluiten"
        >
          <XIcon className="h-5 w-5" />
        </Button>
        <CardHeader className="pt-4 pl-16">
          <CardTitle className="text-lg">Heb je de chat al geprobeerd?</CardTitle>
          <CardDescription>
            Er zijn pas {messageCount} chatberichten in je project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Probeer de chatfunctie om sneller antwoorden te krijgen en direct feedback te ontvangen op je ideeën!
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={onTryChat} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Begin met chatten
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
