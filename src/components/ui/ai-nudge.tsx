import { Brain, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AiNudgeProps {
  isVisible: boolean;
  onClose: () => void;
  onCtaClick: () => void;
  className?: string;
}

export const AiNudge = ({ isVisible, onClose, onCtaClick, className }: AiNudgeProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-lg bg-ai-nudge-background text-ai-nudge-foreground border border-ai-nudge-border max-w-sm",
            className
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">Ontdek AI features</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 text-ai-nudge-foreground/70 hover:text-ai-nudge-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm mb-4">
            Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!
          </p>
          <Button onClick={onCtaClick} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Naar AI features
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
