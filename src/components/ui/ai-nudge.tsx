import { cn } from '@/lib/utils';
import { BrainStar } from 'lucide-react';
import React from 'react';

interface AiNudgeProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  ctaText?: string;
  ctaLink?: string;
  variant?: 'ai-nudge' | 'chat-nudge';
}

export const AiNudge = React.forwardRef<HTMLDivElement, AiNudgeProps>(
  ({ message, ctaText, ctaLink, variant = 'ai-nudge', className, ...props }, ref) => {
    const defaultMessage = 'Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!';
    const defaultCtaText = 'Ontdek AI';
    const defaultCtaLink = '/app/ai'; // Assuming a route to AI features

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between p-4 rounded-lg shadow-md',
          'bg-[--ai-nudge-background] text-[--ai-nudge-foreground] border border-[--ai-nudge-border]',
          {
            'bg-[--chat-nudge-background] text-[--chat-nudge-foreground] border-[--chat-nudge-border]': variant === 'chat-nudge',
          },
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <BrainStar className="h-6 w-6 text-current" />
          <p className="text-sm font-medium leading-relaxed">
            {message || defaultMessage}
          </p>
        </div>
        <a
          href={ctaLink || defaultCtaLink}
          className={cn(
            'whitespace-nowrap inline-flex items-center justify-center rounded-md text-sm font-medium',
            'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            'h-9 px-4 py-2',
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {ctaText || defaultCtaText}
        </a>
      </div>
    );
  }
);
AiNudge.displayName = 'AiNudge';
