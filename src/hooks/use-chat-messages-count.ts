import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useChatMessagesCount = (projectId?: string) => {
  return useQuery({
    queryKey: ['chatMessagesCount', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching chat messages count:', error);
        throw error;
      }

      return count;
    },
    enabled: !!projectId, // Only run the query if projectId is available
  });
};
