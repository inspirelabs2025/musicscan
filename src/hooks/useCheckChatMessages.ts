import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/lib/supabase'; // Assuming you have a supabase client initialized here

const fetchChatMessagesCount = async (projectId: string) => {
  const { count, error } = await supabase
    .from('chat_messages') // Replace with your actual chat messages table name
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) {
    throw error;
  }
  return count;
};

const useCheckChatMessages = () => {
  const { currentProject } = useProject();
  const projectId = currentProject?.id;

  const { data: messagesCount, isFetched } = useQuery(
    ['chatMessagesCount', projectId],
    () => fetchChatMessagesCount(projectId!), // assert projectId is not null
    {
      enabled: !!projectId, // Only run the query if projectId is available
      staleTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false, // Do not refetch on window focus
    }
  );

  useEffect(() => {
    if (isFetched && messagesCount === 0) {
      toast.info('💬 Heb je de chat al geprobeerd?', {
        description: 'Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!',
        action: {
          label: 'Probeer nu',
          onClick: () => {
            // TODO: Add logic to navigate to the chat feature or open the chat widget
            // For example, if you have a specific route for chat:
            // navigate(`/dashboard/${projectId}/chat`);
            console.log('User clicked to try chat!');
          },
        },
        duration: 10000, // Show for 10 seconds
      });
    }
  }, [isFetched, messagesCount]);
};

export default useCheckChatMessages;
