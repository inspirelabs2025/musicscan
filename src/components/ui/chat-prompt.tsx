import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRetentionPromptStore } from '@/lib/retention-prompts';

export function ChatPrompt() {
  const { showChatPrompt, setChatPromptVisibility } = useRetentionPromptStore();

  if (!showChatPrompt) return null;

  return (
    <AnimatePresence>
      {showChatPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-50 p-4 bg-primary text-primary-foreground rounded-lg shadow-lg max-w-sm"
        >
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium pr-2">
              💬 Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!
            </p>
            <button
              onClick={() => setChatPromptVisibility(false)}
              className="ml-4 p-1 rounded-full hover:bg-primary/80 transition-colors"
              aria-label="Sluit melding"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
