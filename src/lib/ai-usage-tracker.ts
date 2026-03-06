const AI_USAGE_KEY = 'ai_feature_usage_count';

export const getAiUsageCount = (): number => {
  if (typeof localStorage === 'undefined') {
    return 0;
  }
  const count = localStorage.getItem(AI_USAGE_KEY);
  return count ? parseInt(count, 10) : 0;
};

export const incrementAiUsageCount = (): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }
  const currentCount = getAiUsageCount();
  localStorage.setItem(AI_USAGE_KEY, (currentCount + 1).toString());
};

export const hasUsedAiFeatures = (): boolean => {
  return getAiUsageCount() > 0;
};
