import React from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { dismissNudge } from '@/store/nudgeSlice';
import { trackAiNudgeDismiss } from '@/lib/aiNudgeTracking';

export const AiNudgeBanner: React.FC = () => {
  const dispatch = useDispatch();
  const { isDismissed, aiUsageCount } = useSelector((state: RootState) => state.nudge);
  const showNudge = !isDismissed && aiUsageCount === 0;

  if (!showNudge) {
    return null;
  }

  const handleDismiss = () => {
    dispatch(dismissNudge());
    trackAiNudgeDismiss();
  };

  return (
    <div className="flex items-center justify-between gap-x-6 bg-ai-nudge-background px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <p className="text-sm leading-6 text-ai-nudge-foreground flex items-center">
        <Sparkles className="h-5 w-5 mr-2 text-ai-nudge-foreground" aria-hidden="true" />
        <Link to="/ai-features" className="font-semibold text-ai-nudge-foreground">
          <span className="absolute inset-0" aria-hidden="true" />
          Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </p>
      <div className="flex flex-1 justify-end">
        <Button
          type="button"
          variant="ghost"
          className="-m-3 p-3 focus-visible:outline-offset-[-4px] text-ai-nudge-foreground hover:bg-ai-nudge-background"
          onClick={handleDismiss}
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
