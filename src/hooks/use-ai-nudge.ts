import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AI_NUDGE_DISMISSED_KEY = 'ai_nudge_dismissed';

export const useAiNudge = (userId: string | undefined): {
  showNudge: boolean;
  dismissNudge: () => void;
  isLoading: boolean;
} => {
  const [showNudge, setShowNudge] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [aiUsageCount, setAiUsageCount] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchAiUsage = async () => {
      setIsLoading(true);
      try {
        // Placeholder: Fetch actual AI feature usage count for the user.
        // Replace with your actual table and column names.
        const { data, error } = await supabase
          .from('profiles') // Assuming usage count is in the profiles table or a dedicated usage table
          .select('ai_feature_usage_count') // Replace with your actual column name
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching AI usage:', error);
          setAiUsageCount(0); // Assume 0 if error occurs to still show nudge
        } else if (data) {
          setAiUsageCount(data.ai_feature_usage_count || 0);
        } else {
          setAiUsageCount(0);
        }
      } catch (error) {
        console.error('Unexpected error fetching AI usage:', error);
        setAiUsageCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAiUsage();
  }, [userId]);

  useEffect(() => {
    if (isLoading || aiUsageCount === null) {
      return;
    }

    const isDismissed = localStorage.getItem(AI_NUDGE_DISMISSED_KEY) === 'true';

    if (aiUsageCount === 0 && !isDismissed) {
      setShowNudge(true);
    } else {
      setShowNudge(false);
    }
  }, [aiUsageCount, isLoading]);

  const dismissNudge = () => {
    localStorage.setItem(AI_NUDGE_DISMISSED_KEY, 'true');
    setShowNudge(false);
  };

  return { showNudge, dismissNudge, isLoading };
};
