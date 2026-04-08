import { useToast } from '@/components/ui/use-toast';
import { getSupabaseClient } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ChatNudgeProviderProps {
  children: React.ReactNode;
}

const ChatNudgeProvider: React.FC<ChatNudgeProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const supabase = getSupabaseClient();

  const { data: chatMessageCount } = useQuery({
    queryKey: ['chatMessagesCount'],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching chat messages count:', error.message);
        return 0;
      }
      return count || 0;
    },
    // Refetch every 5 minutes to check if the user has started chatting
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (chatMessageCount === 0) {
      toast({
        title: '💬 Heb je de chat al geprobeerd?',
        description: (
          <p>
            Er zijn pas 0 chatberichten in je project. Probeer de{' '}
            <Link to="/app/chat" className="underline hover:no-underline font-medium">
              chatfunctie
            </Link>{' '}
            om sneller antwoorden te krijgen!
          </p>
        ),
        duration: 30000, // Show for 30 seconds unless dismissed
      });
    }
  }, [chatMessageCount, toast]);

  return <>{children}</>;
};

export default ChatNudgeProvider;
