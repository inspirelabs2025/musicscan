import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';
import { getCookie, setCookie } from '@/lib/utils';

interface AiFeatureNudgeProps {
  isVisible: boolean;
  onClose: () => void;
}

const AI_NUDGE_DISMISS_COOKIE = 'ai_nudge_dismissed';

export const AiFeatureNudge: React.FC<AiFeatureNudgeProps> = ({ isVisible, onClose }) => {
  const [hasUsedAI, setHasUsedAI] = useState<boolean | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkAiUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_metrics')
          .select('has_used_ai')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching AI usage:', error);
        } else if (data) {
          setHasUsedAI(data.has_used_ai);
        } else {
          setHasUsedAI(false); // Default to false if no record
        }
      } else {
        setHasUsedAI(false); // If no user, assume no AI usage
      }
    };

    const dismissed = getCookie(AI_NUDGE_DISMISS_COOKIE);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    checkAiUsage();
  }, []);

  if (!isVisible || hasUsedAI === null || hasUsedAI || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    trackEvent('ai_nudge_dismissed');
    setCookie(AI_NUDGE_DISMISS_COOKIE, 'true', 30);
    setIsDismissed(true);
    onClose();
  };

  const handleLearnMoreClick = () => {
    trackEvent('ai_nudge_clicked_learn_more');
    handleDismiss(); // Dismiss nudge when user clicks to learn more
  };

  // Track display of the nudge
  useEffect(() => {
    if (isVisible && hasUsedAI === false && !isDismissed) {
      trackEvent('ai_nudge_shown');
    }
  }, [isVisible, hasUsedAI, isDismissed]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg max-w-sm flex items-start space-x-3">
        <Sparkles className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-grow">
          <p className="font-semibold text-lg">AI features beschikbaar!</p>
          <p className="text-sm mt-1 mb-3">Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!</p>
          <Link
            to="/ai-features" // Replace with actual AI features page route
            className="inline-flex items-center px-4 py-2 bg-primary-foreground text-primary rounded-md text-sm font-medium hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2"
            onClick={handleLearnMoreClick}
          >
            Ontdek AI features
          </Link>
        </div>
        <button
          onClick={handleDismiss}
          className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-1 -mt-1 -mr-1"
          aria-label="Sluit AI suggestie"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
