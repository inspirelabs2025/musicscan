import React, { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@/lib/supabase/supabase-context';
import { useNavigate } from 'react-router-dom';
import { XIcon, MessageCircleIcon } from 'lucide-react';
import { Button } from './ui/button';

const CHAT_NUDGE_DISMISSED_KEY = 'chat_nudge_dismissed';

const ChatNudge: React.FC = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const navigate = useNavigate();
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkDismissed = localStorage.getItem(CHAT_NUDGE_DISMISSED_KEY);
    if (checkDismissed === 'true') {
      setDismissed(true);
      setLoading(false);
      return;
    }

    const fetchMessageCount = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch the count of messages sent by the current user
        const { count, error } = await supabase
          .from('messages') // Assuming 'messages' is your chat messages table
          .select('id', { count: 'exact', head: true })
          .eq('sender_id', user.id);

        if (error) {
          console.error('Error fetching message count:', error);
        } else {
          setMessageCount(count);
        }
      } catch (e) {
        console.error('Exception fetching message count:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMessageCount();
  }, [user?.id, supabase]);

  const handleDismiss = () => {
    localStorage.setItem(CHAT_NUDGE_DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  const handleTryNow = () => {
    handleDismiss();
    navigate('/chat'); // Assuming '/chat' is the route to your chat interface
  };

  if (loading || dismissed || messageCount === null || messageCount > 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="relative p-4 rounded-lg shadow-lg max-w-sm
                      bg-chat-nudge-background text-chat-nudge-foreground border border-chat-nudge-border">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-chat-nudge-foreground/70 hover:text-chat-nudge-foreground"
          aria-label="Close chat nudge"
        >
          <XIcon className="h-4 w-4" />
        </button>
        <div className="flex items-start space-x-3">
          <MessageCircleIcon className="h-6 w-6 flex-shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-lg">Heb je de chat al geprobeerd?</p>
            <p className="text-sm mt-1">
              Er zijn pas {messageCount} chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!
            </p>
            <Button
              onClick={handleTryNow}
              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Probeer nu!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatNudge;
