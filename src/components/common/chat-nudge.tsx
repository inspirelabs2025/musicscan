import React, { useEffect, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ChatNudgeProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ChatNudge: React.FC<ChatNudgeProps> = ({ isVisible, onClose }) => {
  const [showTooltip, setShowTooltip] = useState(isVisible);

  useEffect(() => {
    setShowTooltip(isVisible);
  }, [isVisible]);

  if (!showTooltip) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <div
            className="relative z-10 p-2 cursor-pointer rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            onClick={onClose}
          >
            <MessageSquareText className="h-5 w-5" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-center text-sm font-semibold bg-ai-nudge-background text-ai-nudge-foreground border-ai-nudge-border shadow-md rounded-lg p-3">
          <p>💬 Heb je de chat al geprobeerd?</p>
          <p className="mt-1">Probeer de chatfunctie om sneller antwoorden te krijgen!</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-ai-nudge-background rotate-45 border-b border-r border-ai-nudge-border"></div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
