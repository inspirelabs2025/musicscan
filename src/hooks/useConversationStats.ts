import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationStats {
  todayCount: number;
  weeklyMessages: number;
}

export const useConversationStats = () => {
  return useQuery<ConversationStats>({
    queryKey: ['conversation-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      try {
        // Get conversations started today - use basic query to avoid recursion
        const { count: todayCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());

        // Get messages from this week
        const { count: weeklyMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString());

        return {
          todayCount: todayCount || 0,
          weeklyMessages: weeklyMessages || 0,
        };
      } catch (error) {
        console.error('Error fetching conversation stats:', error);
        return {
          todayCount: 0,
          weeklyMessages: 0,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: 'always',
  });
};