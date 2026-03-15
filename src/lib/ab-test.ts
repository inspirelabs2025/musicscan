import { v4 as uuidv4 } from 'uuid';

// Use a more robust analytics solution in production (e.g., Google Analytics, Segment)
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  } else {
    console.log(`Analytics event: ${eventName}`, properties);
  }
};

const AB_TEST_KEY = 'ab_test_ai_nudge_variant';
const AI_USAGE_COUNT_KEY = 'ai_usage_count';

export const getAbTestVariant = (): 'control' | 'nudge' => {
  let variant = localStorage.getItem(AB_TEST_KEY) as 'control' | 'nudge';

  if (!variant) {
    // Simple 50/50 split for A/B test
    variant = Math.random() < 0.5 ? 'control' : 'nudge';
    localStorage.setItem(AB_TEST_KEY, variant);
  }
  return variant;
};

export const trackAiFeatureUsage = (action: string, properties?: Record<string, any>) => {
  const currentVariant = localStorage.getItem(AB_TEST_KEY) || 'unknown';
  trackEvent('ai_nudge_ab_test', {
    variant: currentVariant,
    action: action,
    ...properties,
  });
};

export const incrementAiUsageCount = (): number => {
  const currentCount = parseInt(localStorage.getItem(AI_USAGE_COUNT_KEY) || '0', 10);
  const newCount = currentCount + 1;
  localStorage.setItem(AI_USAGE_COUNT_KEY, newCount.toString());
  return newCount;
};

// This function can be called when an actual AI feature is used
export const recordAiUsage = () => {
  incrementAiUsageCount();
  trackAiFeatureUsage('ai_feature_used_actual');
};