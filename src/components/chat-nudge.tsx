import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CHAT_NUDGE_LOCAL_STORAGE_KEY } from '@/lib/constants';

interface ChatNudgeProps {
  hasChatMessages: boolean;
}

export function ChatNudge({ hasChatMessages }: ChatNudgeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(CHAT_NUDGE_LOCAL_STORAGE_KEY);
    if (!hasChatMessages && !dismissed) {
      setIsVisible(true);
    }
  }, [hasChatMessages]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(CHAT_NUDGE_LOCAL_STORAGE_KEY, 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-lg bg-primary p-4 shadow-lg md:bottom-8 md:right-8"
      >
        <p className="text-sm text-primary-foreground">
          💬 Heb je de chat al geprobeerd? Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!
        </p>
        <button
          onClick={handleDismiss}
          className="text-primary-foreground/70 hover:text-primary-foreground focus:outline-none"
          aria-label="Dismiss chat nudge"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
