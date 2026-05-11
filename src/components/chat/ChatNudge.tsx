import { useEffect, useState } from 'react';
import { useUserStore } from '@/utils/stores/userStore';
import { getSupabase } from '@/supabase';
import { AIAssistantDialog } from './AIAssistantDialog';
import { lov_sendEvent } from 'lovable-tagger';
import { useLocation } from 'react-router-dom';

export function ChatNudge() {
  const user = useUserStore((state) => state.user);
  const supabase = getSupabase();
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchChatMessages = async () => {
      if (user?.id) {
        const { count, error } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching chat messages:', error);
        } else {
          setMessageCount(count);
          if (count === 0 && !localStorage.getItem('chat_nudge_dismissed')) {
            setShowNudge(true);
            lov_sendEvent('chat_nudge_shown');
          }
        }
      }
    };

    fetchChatMessages();

    // Dismiss nudge if user navigates to chat or a project page
    if (location.pathname.includes('/chat') || location.pathname.includes('/project')) {
      setShowNudge(false);
      localStorage.setItem('chat_nudge_dismissed', 'true');
    }

  }, [user, supabase, location.pathname]);

  const handleDismiss = () => {
    setShowNudge(false);
    localStorage.setItem('chat_nudge_dismissed', 'true');
    lov_sendEvent('chat_nudge_dismissed');
  };

  if (!user || user?.onboarded_at === null || messageCount === null || messageCount > 0 || !showNudge) {
    return null;
  }

  return (
    <AIAssistantDialog
      open={showNudge}
      onOpenChange={setShowNudge}
      title="Heb je de chat al geprobeerd?"
      description="Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!"
      onDismiss={handleDismiss}
      confirmText="Start chat" 
      onConfirm={() => {
        // This will be handled by the AIAssistantDialog's internal linking or a custom action
        // For now, let's just dismiss it and assume the user will find the chat
        handleDismiss();
      }}
      type="chat_nudge"
    />
  );
}
