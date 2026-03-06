import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatNudgeProps {
  chatMessageCount: number;
  onDismiss?: () => void;
}

export const ChatNudge: React.FC<ChatNudgeProps> = ({ chatMessageCount, onDismiss }) => {
  if (chatMessageCount > 0) {
    return null; // Don't show nudge if there are already chat messages
  }

  return (
    <Card className="w-full max-w-sm mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center space-x-4">
        <MessageSquareText className="h-8 w-8 text-primary" />
        <div>
          <CardTitle>Chat al geprobeerd?</CardTitle>
          <CardDescription>Sneller antwoord krijgen?</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Er zijn pas {chatMessageCount} chatberichten in je project. Het gebruik van de chatfunctie kan je helpen om sneller antwoorden te krijgen en efficiënter samen te werken.
        </p>
        <div className="mt-4 flex justify-end">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Begrepen
            </button>
          )}
          <a
            href="/chat"
            className="ml-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            Ga naar chat
          </a>
        </div>
      </CardContent>
    </Card>
  );
};
