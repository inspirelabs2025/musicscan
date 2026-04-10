import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface AIChatNudgeProps {
  title?: string;
  message: string;
  onDismiss: () => void;
}

const AIChatNudge: React.FC<AIChatNudgeProps> = ({ title = "AI Nudge", message, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-4 right-4 z-[9999] p-4 rounded-lg shadow-lg bg-ai-chat-nudge-background text-ai-chat-nudge-foreground border border-ai-chat-nudge-border max-w-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-ai-chat-nudge-foreground">{title}</h3>
        <Button variant="ghost" size="icon" onClick={onDismiss} className="text-ai-chat-nudge-foreground/70 hover:text-ai-chat-nudge-foreground">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm mb-4 text-ai-chat-nudge-foreground/90">{message}</p>
      <div className="flex justify-end">
        <Button size="sm" onClick={onDismiss}>Dismiss</Button>
      </div>
    </motion.div>
  );
};

export default AIChatNudge;
