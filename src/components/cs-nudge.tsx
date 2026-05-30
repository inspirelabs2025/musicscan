import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface NudgeProps {
  title: string;
  message: string;
  onDismiss: () => void;
  ctaText?: string;
  onCtaClick?: () => void;
}

export const Nudge: React.FC<NudgeProps> = ({ title, message, onDismiss, ctaText, onCtaClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-4 right-4 z-[999] p-4 bg-cs-nudge-background text-cs-nudge-foreground border border-cs-nudge-border rounded-lg shadow-lg max-w-sm"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <button onClick={onDismiss} className="text-cs-nudge-foreground/70 hover:text-cs-nudge-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="text-sm mb-3">{message}</p>
      {ctaText && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          {ctaText}
        </button>
      )}
    </motion.div>
  );
};
