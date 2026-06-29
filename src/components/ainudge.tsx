import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';
import React from 'react';

interface AINudgeProps extends React.HTMLAttributes<HTMLDivElement> {
  usedCount: number; // Number of times AI features have been used
}

export const AINudge: React.FC<AINudgeProps> = ({ usedCount, className, ...props }) => {
  // Only show the nudge if AI features haven't been used yet
  if (usedCount > 0) {
    return null;
  }

  // Check if the nudge is enabled via environment variable
  const aiNudgeVariant = import.meta.env.VITE_AI_NUDGE_VARIANT;
  if (aiNudgeVariant !== 'nudge') {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm p-4 rounded-lg shadow-xl outline outline-1 outline-ai-nudge-border bg-ai-nudge-background text-ai-nudge-foreground text-center flex items-center justify-center gap-3 z-50 animate-fade-in',
        className
      )}
      {...props}
    >
      {' '}
      <Brain className="h-6 w-6 text-ai-nudge-foreground" />
      <p className="text-sm font-medium">
        Je hebt de AI features nog maar <span className="font-bold">0x</span> gebruikt.
        <br />
        <a href="/ai-features" className="underline hover:no-underline text-ai-nudge-foreground font-bold">
          Ontdek wat AI voor je project kan doen!
        </a>
      </p>
    </div>
  );
};
