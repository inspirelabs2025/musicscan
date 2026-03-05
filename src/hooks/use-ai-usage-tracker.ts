import { useEffect, useState, useCallback } from 'react';

interface AIUsageData {
  usageCount: number;
  lastUsed: string | null;
}

const AI_USAGE_KEY = 'ai_feature_usage';

export const useAIUsageTracker = () => {
  const [usageData, setUsageData] = useState<AIUsageData>(() => {
    if (typeof window === 'undefined') return { usageCount: 0, lastUsed: null };
    try {
      const stored = localStorage.getItem(AI_USAGE_KEY);
      return stored ? JSON.parse(stored) : { usageCount: 0, lastUsed: null };
    } catch (e) {
      console.error('Failed to parse AI usage from localStorage', e);
      return { usageCount: 0, lastUsed: null };
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usageData));
    }
  }, [usageData]);

  const recordAIUsage = useCallback(() => {
    setUsageData(prev => ({
      usageCount: prev.usageCount + 1,
      lastUsed: new Date().toISOString(),
    }));
    // Optionally send this update to a backend for persistent storage/analytics
    // fetch('/api/track-ai-feature-usage', { method: 'POST', body: JSON.stringify({ event: 'ai_feature_used' }) });
  }, []);

  const resetAIUsage = useCallback(() => {
    setUsageData({ usageCount: 0, lastUsed: null });
  }, []);

  return { usageData, recordAIUsage, resetAIUsage };
};
