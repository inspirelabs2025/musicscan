import React, { useState, useEffect } from 'react';
import { MessageSquareText, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ChatNudgeProps {
  messageCount: number;
}

const ChatNudge: React.FC<ChatNudgeProps> = ({ messageCount }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show the nudge if there are 0 messages
    // In a real application, this count would come from a database query
    if (messageCount === 0) {
      setIsVisible(true);
    }
  }, [messageCount]);

  if (!isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    // Optionally, persist this state (e.g., in localStorage) to prevent showing again
    // localStorage.setItem('chat-nudge-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-primary p-4 shadow-lg"
        >
          <MessageSquareText className="h-6 w-6 text-primary-foreground" />
          <p className="text-sm font-medium text-primary-foreground">
            Heb je de chat al geprobeerd? Probeer de chatfunctie om sneller antwoorden te krijgen!
          </p>
          <button
            onClick={handleClose}
            className="text-primary-foreground/80 hover:text-primary-foreground focus:outline-none"
            aria-label="Sluit melding"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatNudge;
