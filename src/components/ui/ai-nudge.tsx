import React, { useEffect, useState } from 'react';
import { XCircle, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import { localStorageGet, localStorageSet } from '@/lib/utils';

interface AiNudgeProps {
  aiFeatureUsedCount?: number;
  onDismiss?: () => void;
  aiFeaturePath: string;
  forceShow?: boolean;
}

const AI_NUDGE_DISMISSED_KEY = 'ai_nudge_dismissed';
const GROWTH_AI_NUDGE_VARIANT = import.meta.env.VITE_AI_NUDGE_VARIANT || process.env.AI_NUDGE_VARIANT;

export const AiNudge: React.FC<AiNudgeProps> = ({
  aiFeatureUsedCount = 0,
  onDismiss,
  aiFeaturePath,
  forceShow = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorageGet(AI_NUDGE_DISMISSED_KEY);
    const shouldShow = (GROWTH_AI_NUDGE_VARIANT === 'nudge' && aiFeatureUsedCount === 0 && !dismissed) || forceShow;
    setIsVisible(shouldShow);

    if (shouldShow) {
      trackEvent('ai_nudge_view', { variant: GROWTH_AI_NUDGE_VARIANT });
    }
  }, [aiFeatureUsedCount, forceShow]);

  const handleDismiss = () => {
    localStorageSet(AI_NUDGE_DISMISSED_KEY, 'true');
    setIsVisible(false);
    trackEvent('ai_nudge_dismiss', { variant: GROWTH_AI_NUDGE_VARIANT });
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 p-4 pr-6 rounded-lg shadow-lg flex items-center gap-4 border border-ai-nudge-border bg-ai-nudge-background text-ai-nudge-foreground z-50 max-w-sm"
        >
          <Sparkles className="h-8 w-8 text-indigo-400 flex-shrink-0" />
          <div className="flex-grow">
            <p className="font-semibold text-lg mb-1">AI functies ontdekken?</p>
            <p className="text-sm mb-2">Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!</p>
            <a
              href={aiFeaturePath}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-300 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-indigo-600 text-white shadow hover:bg-indigo-700"
              onClick={() => trackEvent('ai_nudge_click_cta', { variant: GROWTH_AI_NUDGE_VARIANT })}
            >
              Naar AI features
            </a>
          </div>
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Sluit melding"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
