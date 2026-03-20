import { useState, useEffect, useCallback } from 'react';

const AI_USAGE_KEY = 'ai_feature_usage_count';

export const useAICounters = () => {
  const [aiUsageCount, setAiUsageCountState] = useState<number>(0);

  useEffect(() => {
    const storedCount = localStorage.getItem(AI_USAGE_KEY);
    if (storedCount) {
      setAiUsageCountState(parseInt(storedCount, 10));
    }
  }, []);

  const getAICount = useCallback(() => {
    const storedCount = localStorage.getItem(AI_USAGE_KEY);
    return storedCount ? parseInt(storedCount, 10) : 0;
  }, []);

  const setAICount = useCallback((count: number) => {
    localStorage.setItem(AI_USAGE_KEY, count.toString());
    setAiUsageCountState(count);
  }, []);

  const incrementAICount = useCallback(() => {
    const currentCount = getAICount();
    setAICount(currentCount + 1);
  }, [getAICount, setAICount]);

  return { aiUsageCount, getAICount, setAICount, incrementAICount };
};
