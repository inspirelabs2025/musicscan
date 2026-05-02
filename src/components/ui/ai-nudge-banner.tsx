import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackEvent } from '@/lib/analytics';

interface AINudgeBannerProps {
  onDismiss: () => void;
  aiFeatureUsedCount?: number;
}

const AINudgeBanner: React.FC<AINudgeBannerProps> = ({ onDismiss, aiFeatureUsedCount = 0 }) => {
  const message = aiFeatureUsedCount === 0
    ? "Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!"
    : `Je hebt AI features ${aiFeatureUsedCount}x gebruikt. Ontdek meer wat AI voor je kan doen!`;

  const handleCtaClick = () => {
    trackEvent('ai_nudge_cta_click');
    onDismiss(); // Dismiss the banner when CTA is clicked
  };

  return (
    <div className="bg-ai-nudge-background text-ai-nudge-foreground p-3 md:p-2 sm:text-sm text-xs flex items-center justify-between border-b border-ai-nudge-border fixed top-0 left-0 w-full z-50 animate-fade-in">
      <div className="flex items-center space-x-2 container mx-auto px-4">
        <Sparkles className="h-4 w-4 flex-shrink-0 text-yellow-400" />
        <p className="flex-grow text-center md:text-left">
          {message}
        </p>
        <Link
          to="/ai-features"
          className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-ai-nudge-background bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 flex-shrink-0"
          onClick={handleCtaClick}
        >
          Ontdek AI
        </Link>
      </div>
      <button
        onClick={onDismiss}
        className="ml-4 text-ai-nudge-foreground hover:text-ai-nudge-foreground/80 transition-colors flex-shrink-0 absolute right-2 top-1/2 -translate-y-1/2 md:static md:translate-y-0"
        aria-label="Banner sluiten"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AINudgeBanner;
