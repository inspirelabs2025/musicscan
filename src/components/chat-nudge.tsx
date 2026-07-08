import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

interface ChatNudgeProps {
  messageCount: number;
  onChatClick: () => void;
}

export const ChatNudge: React.FC<ChatNudgeProps> = ({ messageCount, onChatClick }) => {
  if (messageCount > 0) {
    return null; // Don't show nudge if there are already chat messages
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <Button
            variant="default"
            className="flex items-center space-x-2 p-4 rounded-full shadow-lg bg-chat-nudge-background text-chat-nudge-foreground hover:bg-chat-nudge-background/90 focus:ring-2 focus:ring-chat-nudge-border focus:ring-offset-2"
          >
            <MessageSquare className="h-6 w-6" />
            <span className="font-semibold">Chatfunctie</span>
          </Button>
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md bg-background text-foreground">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">💬 Heb je de chat al geprobeerd?</SheetTitle>
          <SheetDescription className="text-lg mt-2">
            Er {messageCount === 0 ? 'zijn pas 0' : `zijn ${messageCount}`} chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen van ons team!
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <p className="text-muted-foreground">
            Onze chat is de snelste manier om hulp te krijgen en vragen te stellen over je project of het platform.
            We staan voor je klaar om je te helpen bij elke stap!
          </p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" onClick={onChatClick} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Start een chat
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
