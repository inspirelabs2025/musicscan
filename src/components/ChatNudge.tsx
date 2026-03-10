import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatNudgeProps {
  onClose?: () => void;
}

export const ChatNudge: React.FC<ChatNudgeProps> = ({ onClose }) => {
  return (
    <Card className="w-full max-w-sm bg-blue-100 border-blue-200 text-blue-900 shadow-lg">
      <CardHeader className="flex flex-row items-center space-x-4 p-4">
        <MessageSquareText className="h-6 w-6 text-blue-600" />
        <div className="grid gap-1">
          <CardTitle className="text-lg font-semibold">Chatfunctie Ontdekken</CardTitle>
          <CardDescription className="text-sm text-blue-800">
            Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!
          </CardDescription>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto -mr-1 -mt-1 p-1 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Optionally add a button to navigate to chat or open chat modal */}
        <button className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2">
          Start een chat
        </button>
      </CardContent>
    </Card>
  );
};
