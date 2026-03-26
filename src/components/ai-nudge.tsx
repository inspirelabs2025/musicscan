import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bird, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAIUsage } from '@/hooks/use-ai-usage';
import { useAbTestVariant } from '@/lib/ab-test';

interface AINudgeProps {
  /**
   * The path to navigate to when the nudge is clicked.
   */
  aiFeaturesPath?: string;
}

const LOCAL_STORAGE_KEY = 'ai_nudge_dismissed';

export function AINudge({ aiFeaturesPath = '/ai-features' }: AINudgeProps) {
  const { hasUsedAIFeatures } = useAIUsage();
  const { variant } = useAbTestVariant('ai-nudge-test');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(LOCAL_STORAGE_KEY);
    // Only show nudge if: 
    // 1. User is in the 'nudge' variant.
    // 2. User has not used AI features yet.
    // 3. User has not dismissed the nudge previously.
    if (variant === 'nudge' && !hasUsedAIFeatures && !dismissed) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [hasUsedAIFeatures, variant]);

  const handleDismiss = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setIsVisible(false);
    if (window.gtag) {
      window.gtag('event', 'ai_nudge_dismissed', {
        event_category: 'AI Nudge',
        event_label: 'Dismissed',
      });
    }
  };

  const handleNudgeClick = () => {
    if (window.gtag) {
      window.gtag('event', 'ai_nudge_clicked', {
        event_category: 'AI Nudge',
        event_label: 'Call to Action',
      });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div
        className="flex max-w-sm items-center space-x-4 rounded-lg border bg-current p-4 shadow-lg text-ai-nudge-foreground border-ai-nudge-border bg-ai-nudge-background"
        role="alert"
      >
        <Bird className="h-6 w-6 shrink-0" />
        <div className="flex-grow">
          <h3 className="font-semibold">Gebruik AI voor je project!</h3>
          <p className="text-sm opacity-90">
            Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!
          </p>
        </div>
        <div className="flex flex-col space-y-2">
          <Link to={aiFeaturesPath} onClick={handleNudgeClick}>
            <Button size="sm" className="w-full">
              Ontdek AI
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="self-end opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Sluiten</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
