import { useState, useEffect } from 'react';
import { useLocalStorage } from 'react-use';

const AI_NUDGE_LAST_SHOWN_KEY = 'ai_nudge_last_shown';
const AI_NUDGE_DISMISSED_KEY = 'ai_nudge_dismissed';
const AI_NUDGE_COUNT_KEY = 'ai_nudge_count';

const NUDGE_DEBOUNCE_DAYS = 7; // Show nudge at most once every 7 days
const NUDGE_THRESHOLD = 0; // Show nudge if AI features used 0 times

export const useAiNudge = () => {
  const [aiUsageCount, setAiUsageCount] = useLocalStorage<number>(AI_NUDGE_COUNT_KEY, 0);
  const [lastShownTimestamp, setLastShownTimestamp] = useLocalStorage<number>(AI_NUDGE_LAST_SHOWN_KEY, 0);
  const [isDismissed, setIsDismissed] = useLocalStorage<boolean>(AI_NUDGE_DISMISSED_KEY, false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const sevenDaysInMillis = NUDGE_DEBOUNCE_DAYS * 24 * 60 * 60 * 1000;

    if (
      !isDismissed &&
      (aiUsageCount ?? 0) <= NUDGE_THRESHOLD &&
      now - (lastShownTimestamp ?? 0) > sevenDaysInMillis
    ) {
      setIsVisible(true);
      setLastShownTimestamp(now);
    } else {
      setIsVisible(false);
    }
  }, [aiUsageCount, lastShownTimestamp, isDismissed, setLastShownTimestamp]);

  const dismissNudge = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const recordAiUsage = () => {
    setAiUsageCount((prevCount = 0) => prevCount + 1);
    // If user starts using AI, dismiss the nudge to prevent re-showing
    if (isDismissed === false) { // Only set if not already dismissed
      setIsDismissed(true);
    }
  };

  return {
    isVisible,
    dismissNudge,
    recordAiUsage,
  };
};
