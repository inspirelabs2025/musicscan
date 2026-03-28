import React from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiNudgeProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
}

const AiNudge: React.FC<AiNudgeProps> = ({ message, className, ...props }) => {
  return (
    <div
      className={cn(
        'flex items-center space-x-3 rounded-lg border border-ai-nudge-border bg-ai-nudge-background p-4 text-ai-nudge-foreground shadow-sm animate-fade-in',
        className
      )}
      {...props}
    >
      <MessageSquare className="h-5 w-5 flex-shrink-0 text-ai-nudge-foreground" />
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  );
};

export { AiNudge };
