import React from 'react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { BrainIcon } from 'lucide-react';

interface AIFeatureNudgeProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const AIFeatureNudge: React.FC<AIFeatureNudgeProps> = ({ isVisible, onDismiss }) => {
  if (!isVisible) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-auto w-full justify-start rounded-none px-4 py-3 text-left font-normal transition-colors hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
            onClick={() => {
              // Log impression before navigating
              // track('ai_nudge_clicked'); // Example tracking
              onDismiss(); // Dismiss nudge on click
            }}
            asChild
          >
            <Link to="/ai-features" className="flex items-center space-x-2 w-full">
              <BrainIcon className="h-5 w-5 text-echo-violet" />
              <div className="flex flex-col">
                <p className="text-sm font-medium">🤖 AI features beschikbaar</p>
                <p className="text-xs text-muted-foreground">Ontdek wat AI voor je project kan doen!</p>
              </div>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="animate-fade-in" side="right">
          <p>Je hebt de AI features nog maar 0x gebruikt. Klik om ze te ontdekken!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
