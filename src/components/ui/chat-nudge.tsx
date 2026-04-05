import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface ChatNudgeProps {
  messageCount: number;
}

export const ChatNudge: React.FC<ChatNudgeProps> = ({ messageCount }) => {
  if (messageCount > 0) {
    return null; // Don't show nudge if user has already sent messages
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Card className="w-[350px] bg-card-dark text-card-dark-foreground border-purple-500 shadow-lg">
        <CardHeader className="flex flex-row items-center space-x-4">
          <MessageSquare className="h-6 w-6 text-purple-400" />
          <CardTitle className="text-lg">Heb je de chat al geprobeerd?</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm text-card-dark-foreground/80 mb-4">
            Er zijn pas {messageCount} chatberichten in je project. 
            Probeer de chatfunctie om sneller antwoorden te krijgen en te communiceren met je team of klanten!
          </CardDescription>
          <Link to="/chat" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-purple-600 text-primary-foreground shadow hover:bg-purple-500 h-9 px-4 py-2">
            Open chat
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
