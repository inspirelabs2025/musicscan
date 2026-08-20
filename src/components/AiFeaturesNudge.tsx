import * as React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getEnv } from '@/lib/env';

interface AiFeaturesNudgeProps extends React.HTMLAttributes<HTMLDivElement> {
  aiUsageCount: number; // Prop for AI feature usage count
  variant?: 'growth' | 'basic'; // Different variants for styling or content
  onDismiss?: () => void; // Callback for when the nudge is dismissed
}

export const AiFeaturesNudge = React.forwardRef<HTMLDivElement, AiFeaturesNudgeProps>(
  ({ className, aiUsageCount, variant = 'growth', onDismiss, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const nudgeVariant = getEnv('AI_FEATURES_NUDGE_VARIANT');

    // Only show if the variant is 'growth' and AI usage is 0
    if (nudgeVariant !== 'growth' || aiUsageCount > 0 || !isVisible) {
      return null;
    }

    const handleDismiss = () => {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss();
      }
      // TODO: Implement actual dismissal logic (e.g., set a cookie/local storage item)
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative p-4 rounded-lg shadow-lg flex items-center justify-between gap-4',
          'bg-ai-features-nudge-background text-ai-features-nudge-foreground border border-ai-features-nudge-border',
          className
        )}
        {...props}
      >
        <div className="flex-grow text-sm md:text-base">
          <p>
            Je hebt de AI features nog maar <strong className="text-primary">{aiUsageCount}x</strong> gebruikt.
            Ontdek wat AI voor je project kan doen!
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/ai-features">Ontdek AI</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-ai-features-nudge-foreground hover:bg-ai-features-nudge-background/80"
            onClick={handleDismiss}
            aria-label="Sluiten"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);
AiFeaturesNudge.displayName = 'AiFeaturesNudge';

export default AiFeaturesNudge;
