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

      // Get conversations started today
      const { data: todayConversations, error: todayError } = await supabase
        .from('conversations')
        .select('id')
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      // Get messages from this week
      const { data: weeklyMessages, error: weeklyError } = await supabase
        .from('messages')
        .select('id')
        .gte('created_at', weekAgo.toISOString());

      if (weeklyError) throw weeklyError;

      return {
        todayCount: todayConversations?.length || 0,
        weeklyMessages: weeklyMessages?.length || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: 'always',
  });
};