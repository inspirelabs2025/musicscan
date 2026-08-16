import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';
import { LocalStorageKeys } from '@/lib/constants';

const AI_FEATURES_NUDGE_VARIANT = import.meta.env.VITE_AI_FEATURES_NUDGE_VARIANT;

interface AiFeaturesNudgeProps {
  aiUsageCount: number; // Assuming this count comes from user data or a backend
}

export const AiFeaturesNudge: React.FC<AiFeaturesNudgeProps> = ({ aiUsageCount }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show the nudge if the variant is 'new_user_0x_used' and AI usage is 0
    if (AI_FEATURES_NUDGE_VARIANT === 'new_user_0x_used' && aiUsageCount === 0) {
      const hasBeenDismissed = localStorage.getItem(LocalStorageKeys.AI_FEATURES_NUDGE_DISMISSED);
      if (!hasBeenDismissed) {
        setIsVisible(true);
        trackEvent('ai_features_nudge_shown', { variant: AI_FEATURES_NUDGE_VARIANT });
      }
    }
  }, [aiUsageCount]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(LocalStorageKeys.AI_FEATURES_NUDGE_DISMISSED, 'true');
    trackEvent('ai_features_nudge_dismissed', { variant: AI_FEATURES_NUDGE_VARIANT });
  };

  const handleDiscoverClick = () => {
    trackEvent('ai_features_nudge_discover_clicked', { variant: AI_FEATURES_NUDGE_VARIANT });
    // Optionally dismiss the nudge after clicking discover, or let the user navigate away
    handleDismiss(); // Dismiss after click
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm
                 bg-ai-features-nudge-background text-ai-features-nudge-foreground
                 border border-ai-features-nudge-border rounded-lg shadow-lg p-4 z-50
                 flex flex-col gap-3 animate-fade-in"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium leading-relaxed">
          Je hebt de AI features nog maar <span className="font-bold">{aiUsageCount}x</span> gebruikt. Ontdek wat AI voor je project kan doen!
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="text-ai-features-nudge-foreground/70 hover:text-ai-features-nudge-foreground focus:ring-offset-ai-features-nudge-background"
          aria-label="Sluit melding"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Link to="/ai-features" onClick={handleDiscoverClick} className="w-full">
        <Button className="w-full bg-ai-features-nudge-foreground text-ai-features-nudge-background hover:bg-ai-features-nudge-foreground/90">
          Ontdek AI tools
        </Button>
      </Link>
    </div>
  );
};
