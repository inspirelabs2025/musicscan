import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { trackEvent } from '@/lib/analytics'; // Assuming an analytics utility

interface AiFeaturesNudgeProps {
  aiFeatureUsageCount: number; // Prop to indicate how many times AI features have been used
}

const AI_NUDGE_DISMISSED_KEY = 'ai_features_nudge_dismissed';

export function AiFeaturesNudge({ aiFeatureUsageCount }: AiFeaturesNudgeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkDismissedStatus = async () => {
      const { value } = await Preferences.get({ key: AI_NUDGE_DISMISSED_KEY });
      if (!value && aiFeatureUsageCount === 0) {
        setIsVisible(true);
        trackEvent('ai_features_nudge_shown');
      }
    };
    checkDismissedStatus();
  }, [aiFeatureUsageCount]);

  const handleDismiss = async () => {
    setIsVisible(false);
    await Preferences.set({ key: AI_NUDGE_DISMISSED_KEY, value: 'true' });
    trackEvent('ai_features_nudge_dismissed');
  };

  if (!isVisible) return null;

  return (
    <div
      className="relative flex items-center justify-between gap-4 rounded-lg border border-ai-features-nudge-border bg-ai-features-nudge-background p-4 text-ai-features-nudge-foreground shadow-sm animate-fade-in"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 flex-shrink-0 text-primary" />
        <div>
          <p className="font-semibold text-base md:text-lg mb-1">🤖 AI features beschikbaar!</p>
          <p className="text-sm opacity-90">
            Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/ai-features" onClick={() => trackEvent('ai_features_nudge_click_learn_more')}>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Ontdek AI
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="text-ai-features-nudge-foreground/70 hover:bg-ai-features-nudge-foreground/10"
          aria-label="Sluit melding"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
