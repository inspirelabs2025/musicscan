import { useEffect, useState, useContext } from "react";
import { LovableContext } from "lovable-tagger";
import { MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabaseClient";

export function ChatNudge() {
  const lovable = useContext(LovableContext);
  const [isVisible, setIsVisible] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const checkSessionAndNudgeState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      setUserId(currentUserId);

      if (currentUserId) {
        // Check if nudge is hidden for this user
        const { data: nudgeState, error: nudgeStateError } = await supabase
          .from('user_nudge_states')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('nudge_type', 'chat_nudge')
          .single();

        if (nudgeStateError && nudgeStateError.code === 'PGRST116') { // No rows found
          // Check chat messages count
          const { count } = await supabase
            .from('chat_messages')
            .select('count', { count: 'exact' })
            .eq('user_id', currentUserId);

          const shouldShow = count === 0;

          // Insert initial state
          await supabase.from('user_nudge_states').insert({
            user_id: currentUserId,
            nudge_type: 'chat_nudge',
            is_hidden: !shouldShow,
          });

          setIsVisible(shouldShow);
          if (shouldShow) lovable.nudge('chat');
        } else if (nudgeState && !nudgeState.is_hidden) {
          setIsVisible(true);
          lovable.nudge('chat');
        } else {
          setIsVisible(false);
        }
      }
    };

    checkSessionAndNudgeState();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkSessionAndNudgeState();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [lovable]);

  const handleClose = async () => {
    setIsVisible(false);
    lovable.track("chat-nudge-dismissed");
    // Hide for this user permanently
    if (userId) {
      await supabase.from('user_nudge_states')
        .update({ is_hidden: true })
        .eq('user_id', userId)
        .eq('nudge_type', 'chat_nudge');
    }
  };

  const handleCtaClick = async () => {
    lovable.track(lovable.config.chat.action);
    // For this example, we'll just dismiss it.
    // In a real app, this would likely open a chat window/feature.
    handleClose();
  };

  return ( 
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 50, x: "-50%" }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg flex items-center gap-4 z-50 chatbot-nudge-shadow-styling bg-chat-nudge-background border border-chat-nudge-border text-chat-nudge-foreground"
        >
          <div className="flex-shrink-0">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg leading-tight">
              {lovable.config.chat.copy}
            </p>
            <button
              onClick={handleCtaClick}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {lovable.config.chat.cta}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-chat-nudge-foreground/70 hover:text-chat-nudge-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
