import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

// NOTE: In a real application, aiFeatureUsedCount would typically come from user data
// fetched from a backend or local storage, not hardcoded.
// This hook is a simplified example for the growth experiment.
export const useAINudgeStatus = () => {
  const [showNudge, setShowNudge] = useState(false);
  const [aiFeatureUsedCount] = useState(0); // Simulate 0 uses for initial nudge
  const nudgeVariant = import.meta.env.VITE_AI_NUDGE_VARIANT;

  useEffect(() => {
    if (nudgeVariant === 'nudge') {
      // Check if the nudge has been dismissed before
      const dismissed = localStorage.getItem('ai_nudge_dismissed');
      if (!dismissed) {
        setShowNudge(true);
        trackEvent('ai_nudge_banner_shown');
      }
    }
  }, [nudgeVariant]);

  const dismissNudge = () => {
    setShowNudge(false);
    localStorage.setItem('ai_nudge_dismissed', 'true');
    trackEvent('ai_nudge_banner_dismissed');
  };

  return {
    showNudge: showNudge && aiFeatureUsedCount === 0, // Only show if not used yet
    aiFeatureUsedCount,
    dismissNudge,
  };
};
