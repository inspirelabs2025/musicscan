import React, { useEffect, useState } from 'react';
import { BellIcon, LightbulbIcon, XIcon } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { useTrackEvent } from '@/lib/analytics';

interface AINudgeProps {
  aiUsageCount: number;
}

export const AINudge: React.FC<AINudgeProps> = ({ aiUsageCount }) => {
  const [isVisible, setIsVisible] = useState(false);
  const trackEvent = useTrackEvent();

  useEffect(() => {
    const hasDismissed = localStorage.getItem('ai_nudge_dismissed');
    if (aiUsageCount === 0 && !hasDismissed) {
      setIsVisible(true);
      trackEvent('ai_nudge_shown');
    }
  }, [aiUsageCount, trackEvent]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('ai_nudge_dismissed', 'true');
    trackEvent('ai_nudge_dismissed');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Card className="w-80 shadow-lg">
        <CardHeader className="relative pr-8">
          <CardTitle className="flex items-center text-lg">
            <LightbulbIcon className="h-5 w-5 mr-2 text-indigo-500" />
            AI Features Beschikbaar!
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!
          </CardDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleDismiss}
            aria-label="Dismiss AI Nudge"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => { /* TODO: Link to AI features overview */ }}>
            Ontdek AI Tools
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
