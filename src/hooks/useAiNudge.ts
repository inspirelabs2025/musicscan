import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setAiUsageCount } from '@/store/nudgeSlice';
import { supabase } from '@/supabaseClient';

export const useAiNudge = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const { aiUsageCount, isDismissed } = useSelector((state: RootState) => state.nudge);

  useEffect(() => {
    const fetchAiUsageCount = async () => {
      if (!userId) return;

      // In a real application, you'd query your database for the actual AI usage count.
      // For this example, we'll simulate the count or fetch it if available.
      const { data, error } = await supabase
        .from('ai_usage_metrics')
        .select('usage_count')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found'
        console.error('Error fetching AI usage count:', error);
      } else if (data) {
        dispatch(setAiUsageCount(data.usage_count));
      } else {
        dispatch(setAiUsageCount(0)); // No usage data found, default to 0
      }
    };

    fetchAiUsageCount();

    // Optional: Set up a real-time listener if AI usage can change frequently
    const aiUsageSubscription = supabase
    .channel('ai_usage_metrics')
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'ai_usage_metrics', 
        filter: `user_id=eq.${userId}` 
      },
      (payload) => {
        const newUsageCount = (payload.new as { usage_count: number }).usage_count;
        dispatch(setAiUsageCount(newUsageCount));
      }
    )
    .subscribe();

    return () => {
      aiUsageSubscription.unsubscribe();
    };

  }, [userId, dispatch]);

  // A/B test variant handling (for future growth features)
  // In a real scenario, this would involve fetching a variant from a remote config or A/B testing service.
  // For now, we'll use a simple client-side check if a variant is set in env.
  useEffect(() => {
    if (import.meta.env.AI_NUDGE_VARIANT) {
      // For now, we'll just log it. Future: adjust nudge behavior based on variant.
      // console.log('AI_NUDGE_VARIANT detected:', import.meta.env.AI_NUDGE_VARIANT);
    }
  }, []);

  return { aiUsageCount, isDismissed };
};
