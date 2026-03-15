import { MessageSquare, X } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ChatNudgeProps {
  messageCount: number;
  onClose?: () => void;
  onInitiateChat?: () => void;
  className?: string;
}

export function ChatNudge({
  messageCount,
  onClose,
  onInitiateChat,
  className
}: ChatNudgeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (messageCount === 0) {
      // Check if the nudge has been dismissed before in this session
      const dismissed = sessionStorage.getItem('chatNudgeDismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, [messageCount]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('chatNudgeDismissed', 'true');
    onClose?.();
  };

  const handleInitiateChat = () => {
    setIsVisible(false);
    sessionStorage.setItem('chatNudgeDismissed', 'true'); // Dismiss after interaction as well
    onInitiateChat?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 animate-fade-in",
      className
    )}>
      <Card className="w-[350px] shadow-lg">
        <CardHeader className="relative pb-3">
          <MessageSquare className="absolute top-4 left-4 h-6 w-6 text-primary" />
          <CardTitle className="ml-10 text-lg">Heb je de chat al geprobeerd?</CardTitle>
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            aria-label="Sluit melding"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="pt-2">
          <CardDescription>
            Er zijn nog geen chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen op al je vragen en sneller te communiceren met je team!
          </CardDescription>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleDismiss} size="sm">
            Nee, bedankt
          </Button>
          <Button onClick={handleInitiateChat} size="sm">
            Start Chat
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
