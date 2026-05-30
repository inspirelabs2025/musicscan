import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';

export const useAIUsage = (userId?: string) => {
  return useQuery({
    queryKey: ['aiUsage', userId],
    queryFn: async () => {
      if (!userId) return { aiUsageCount: 0 };
      // This is a placeholder for actual AI usage tracking.
      // In a real application, you would query your database
      // for the user's AI feature usage count.
      // For now, we'll simulate 0 usage for the nudge.

      // Example placeholder: assume usage is 0 to trigger the nudge
      const { data, error } = await supabase
        .from('ai_usage_metrics') // Hypothetical table for AI usage
        .select('usage_count')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found (first-time user)
        console.error('Error fetching AI usage:', error);
        // Optionally, re-throw if it's a critical error
        // throw new Error(error.message);
        return { aiUsageCount: 0 }; // Default to 0 on error, or if no entry found
      }
      
      return { aiUsageCount: data?.usage_count || 0 };
    },
    enabled: !!userId, // Only run the query if userId is available
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
