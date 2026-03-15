import { useEffect, useState } from 'react';
import { getAbTestVariant, trackAiFeatureUsage, incrementAiUsageCount } from '@/lib/ab-test';

const AI_NUDGE_DISMISSED_KEY = 'ai_nudge_dismissed';
const AI_USAGE_COUNT_KEY = 'ai_usage_count';
const AI_NUDGE_VARIANT_KEY = 'ai_nudge_variant'; // Key for storing the assigned A/B test variant locally

export const useAiNudge = () => {
  const [showNudge, setShowNudge] = useState(false);
  const [aiUsageCount, setAiUsageCount] = useState<number>(0);
  const [abTestVariant, setAbTestVariant] = useState<'control' | 'nudge'>('control');

  useEffect(() => {
    // Initialize A/B test variant
    let variant = localStorage.getItem(AI_NUDGE_VARIANT_KEY) as 'control' | 'nudge';
    if (!variant) {
      variant = getAbTestVariant();
      localStorage.setItem(AI_NUDGE_VARIANT_KEY, variant);
    }
    setAbTestVariant(variant);
    trackAiFeatureUsage('variant_assigned', { variant });

    const dismissed = localStorage.getItem(AI_NUDGE_DISMISSED_KEY);
    const usageCount = parseInt(localStorage.getItem(AI_USAGE_COUNT_KEY) || '0', 10);
    setAiUsageCount(usageCount);

    if (variant === 'nudge' && !dismissed && usageCount === 0) {
      setShowNudge(true);
      trackAiFeatureUsage('nudge_shown');
    }
  }, []);

  const dismissNudge = () => {
    setShowNudge(false);
    localStorage.setItem(AI_NUDGE_DISMISSED_KEY, 'true');
    trackAiFeatureUsage('nudge_dismissed');
  };

  const exploreAiFeatures = () => {
    setShowNudge(false);
    // Implement actual navigation or action to AI features
    console.log('Navigating to AI features...');
    trackAiFeatureUsage('nudge_explore_clicked');
    // Optionally, mark as dismissed to prevent immediate re-showing
    localStorage.setItem(AI_NUDGE_DISMISSED_KEY, 'true');
  };

  const simulateAiUsage = () => {
    const newCount = incrementAiUsageCount();
    setAiUsageCount(newCount);
    trackAiFeatureUsage('ai_feature_used', { count: newCount });

    // If the user used AI features, hide the nudge if it's currently shown
    if (newCount > 0 && showNudge) {
      setShowNudge(false);
      localStorage.setItem(AI_NUDGE_DISMISSED_KEY, 'true'); // Also dismiss it permanently
    }
  };

  return { showNudge, dismissNudge, exploreAiFeatures, simulateAiUsage, aiUsageCount, abTestVariant };
};
