import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabaseClient';

export const useChatMessages = () => {
  return useQuery({
    queryKey: ['chatMessages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id') // Only fetch id to check count
        .limit(1);

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    // Refetch the data after a short interval to detect new messages
    // or when the user is active, but not too frequently.
    // A short stale time can help if the user quickly sends a message.
    staleTime: 5 * 1 * 1000, // 5 seconds
    refetchInterval: 10 * 1 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
  });
};
