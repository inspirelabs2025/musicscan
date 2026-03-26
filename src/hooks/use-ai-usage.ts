import { aiUsageTracker } from '@/lib/ai-usage-tracking';
import { useEffect, useState } from 'react';

export const useAIUsage = () => {
  const [hasUsedAIFeatures, setHasUsedAIFeatures] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    setHasUsedAIFeatures(aiUsageTracker.hasUsedAIFeatures());
    setUsageCount(aiUsageTracker.getAIUsageCount());

    // You might want to add a listener if the usage count can change outside of this hook
    // For simplicity, we just check on mount. For real-time updates, a PubSub pattern or Context API would be better.
  }, []);

  const recordAIUsage = (featureName: string) => {
    aiUsageTracker.recordAIUsage(featureName);
    setHasUsedAIFeatures(true);
    setUsageCount(aiUsageTracker.getAIUsageCount());
  };

  return { hasUsedAIFeatures, usageCount, recordAIUsage };
};
