import { AlertCircle, Bot } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAiNudge } from "../hooks/useAiNudge";

const AiAssistant = () => {
  const { visibleNudge, dismissNudge, variant } = useAiNudge();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visibleNudge && variant === 'nudge') {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [visibleNudge, variant]);

  const handleDismiss = () => {
    if (visibleNudge) {
      dismissNudge(visibleNudge.id);
      setIsVisible(false);
      // Call the onDismiss callback if it exists
      if (visibleNudge.onDismiss) {
        visibleNudge.onDismiss();
      }
    }
  };

  const handleAction = () => {
    if (visibleNudge && visibleNudge.action) {
      visibleNudge.action();
      handleDismiss(); // Dismiss nudge after action
    }
  };

  if (!visibleNudge || variant === 'control') return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="ai-nudge"
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-1/2 -ml-2 w-full max-w-sm px-4 md:max-w-md lg:max-w-lg z-[99999]"
        >
          <Alert
            className="flex items-start bg-ai-nudge-background text-ai-nudge-foreground border-ai-nudge-border shadow-lg space-x-3"
          >
            <Bot className="h-5 w-5 text-current mt-1 flex-shrink-0" />
            <div className="flex-grow">
              <AlertTitle>{visibleNudge.title || "AI Suggestie"}</AlertTitle>
              <AlertDescription className="mt-1 text-sm leading-relaxed">
                {visibleNudge.message}
              </AlertDescription>
              <div className="mt-4 flex gap-2">
                {visibleNudge.action && (
                  <Button
                    onClick={handleAction}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs"
                  >
                    {visibleNudge.actionLabel || "Actie"}
                  </Button>
                )}
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  className="text-ai-nudge-foreground/80 hover:bg-ai-nudge-foreground/10 h-8 px-3 text-xs"
                >
                  Begrepen
                </Button>
              </div>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiAssistant;
