import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAiUsage } from '@/hooks/use_ai_usage';
import React from 'react';
import { BrainIcon } from 'lucide-react';

interface AiNudgeProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export const AiNudge = ({ message, className, ...props }: AiNudgeProps) => {
  const { aiUsageCount, dismissAiNudge } = useAiUsage();

  // Only show the nudge if AI features have not been used and the nudge hasn't been dismissed.
  if (aiUsageCount === null || aiUsageCount > 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-ai-nudge-background p-4 text-ai-nudge-foreground shadow-lg lg:max-w-md w-full sm:w-auto',
        className
      )}
      {...props}
    >
      <BrainIcon className="h-6 w-6 flex-shrink-0 text-ai-nudge-foreground" />
      <div>
        <p className="font-semibold text-lg">🤖 AI features beschikbaar!</p>
        <p className="text-sm mt-1 mb-2">
          {message || 'Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!'}
        </p>
        <Button
          variant="default"
          size="sm"
          onClick={dismissAiNudge}
          className="bg-ai-nudge-foreground text-ai-nudge-background hover:bg-ai-nudge-foreground/90"
        >
          Ontdek AI
        </Button>
      </div>
    </div>
  );
};
