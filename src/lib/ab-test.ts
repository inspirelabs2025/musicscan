import { useState, useEffect } from 'react';

type ABNudgeVariant = 'control' | 'nudge';

const AB_TEST_KEY = 'ai_nudge_ab_variant';

export function useAINudgeABTest(): ABNudgeVariant {
  const [variant, setVariant] = useState<ABNudgeVariant>('control');

  useEffect(() => {
    // Check if a variant is already stored in localStorage
    let storedVariant = localStorage.getItem(AB_TEST_KEY) as ABNudgeVariant;

    if (storedVariant) {
      setVariant(storedVariant);
    } else {
      // If not, assign a random variant
      const random = Math.random();
      const newVariant: ABNudgeVariant = random < 0.5 ? 'control' : 'nudge'; // 50/50 split

      localStorage.setItem(AB_TEST_KEY, newVariant);
      setVariant(newVariant);
    }
  }, []);

  return variant;
}

// Placeholder for tracking AI usage. In a real app, this would come from a backend or analytics.
let aiFeatureUsageCount = 0;

export function getAIFeatureUsageCount(): number {
  // In a real application, this would fetch data from user settings, database, or analytics.
  // For this example, we'll use a simple in-memory counter, or ideally, localStorage.
  const storedCount = localStorage.getItem('ai_feature_usage_count');
  return storedCount ? parseInt(storedCount, 10) : 0;
}

export function incrementAIFeatureUsageCount() {
  // In a real application, this would update a backend counter.
  // For this example, we'll update localStorage.
  const currentCount = getAIFeatureUsageCount();
  localStorage.setItem('ai_feature_usage_count', (currentCount + 1).toString());
}
