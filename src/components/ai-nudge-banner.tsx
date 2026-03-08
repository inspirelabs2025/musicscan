import React, { useEffect, useState } from 'react';
import { hasUsedAiFeature, getAiNudgeVariant } from '@/lib/ab-test';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from './ui/use-toast';

export const AiNudgeBanner: React.FC = () => {
  const [showNudge, setShowNudge] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const variant = getAiNudgeVariant();
    const usedAi = hasUsedAiFeature();
    const dismissedNudge = localStorage.getItem('ai_nudge_dismissed') === 'true';

    if (variant === 'nudge' && !usedAi && !dismissedNudge) {
      setShowNudge(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ai_nudge_dismissed', 'true');
    setShowNudge(false);
    toast({
      title: 'Notificatie gesloten',
      description: 'Je kunt dit bericht altijd terugvinden in de instellingen als je je bedenkt.',
      duration: 3000,
    });
  };

  if (!showNudge) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm">
      <div className="relative p-4 rounded-lg shadow-lg flex items-center justify-between gap-4 bg-gradient-to-r from-primary via-purple-500 to-indigo-500 text-primary-foreground">
        <div className="flex flex-col">
          <p className="font-semibold">🤖 AI features beschikbaar!</p>
          <p className="text-sm mt-1">Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-auto p-1 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
            onClick={handleDismiss}
            aria-label="Sluit notificatie"
          >
            <X className="h-4 w-4" />
          </Button>
          <Link to="/ai-features" onClick={handleDismiss} className="mt-auto">
            <Button size="sm" className="bg-primary-foreground text-primary hover:bg-white focus-visible:ring-offset-primary">
              Ontdek AI
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
