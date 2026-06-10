import { Brain } from 'lucide-react';
import React from 'react';

interface AINudgeProps {
  message?: string;
  count?: number;
  className?: string;
}

export const AINudge: React.FC<AINudgeProps> = ({
  message = 'Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!',
  className,
}) => {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border bg-ai-nudge-background text-ai-nudge-foreground border-ai-nudge-border transition-all duration-300 ease-in-out hover:shadow-md ${className}`}
      role="alert"
      aria-live="polite"
    >
      <Brain className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium leading-tight">{message}</p>
    </div>
  );
};
