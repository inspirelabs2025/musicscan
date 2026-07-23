import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AINudgeBannerProps {
  aiUsageCount: number;
  onClose?: () => void;
  className?: string;
}

export const AINudgeBanner = ({ aiUsageCount, onClose, className }: AINudgeBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if AI features haven't been used (count is 0)
    if (aiUsageCount === 0 && import.meta.env.VITE_AI_NUDGE_VARIANT === 'nudge') {
      setIsVisible(true);
    }
  }, [aiUsageCount]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-between gap-x-6 overflow-hidden bg-ai-nudge-background px-6 py-2.5 sm:px-3.5 sm:before:flex-1',
        'text-ai-nudge-foreground border-b border-ai-nudge-border',
        className
      )}
    >
      <div
        className="absolute left-0 top-0 -z-10 h-full w-full opacity-5"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6">
          <strong className="font-semibold">🤖 AI features beschikbaar</strong>
          <svg
            viewBox="0 0 2 2"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
            aria-hidden="true"
          >
            <circle cx={1} cy={1} r={1} />
          </svg>
          Je hebt de AI features nog maar {aiUsageCount}x gebruikt. Ontdek wat AI voor je project kan doen!
        </p>
      </div>
      <div className="flex flex-1 justify-end">
        <Button
          asChild
          variant="secondary"
          className="mr-4"
          onClick={handleClose}
        >
          <Link to="/dashboard/ai">Bekijk AI features</Link>
        </Button>
        <Button variant="ghost" className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
          onClick={handleClose}
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
