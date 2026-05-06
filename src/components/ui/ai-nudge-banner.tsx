import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface AiNudgeBannerProps {
  onDismiss: () => void;
}

export const AiNudgeBanner: React.FC<AiNudgeBannerProps> = ({ onDismiss }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-ai-nudge-background text-ai-nudge-foreground p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <p className="font-medium text-ai-nudge-foreground">
            Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/ai">
            <Button variant="outline" className="bg-ai-nudge-border text-ai-nudge-foreground border-ai-nudge-border hover:bg-ai-nudge-border/80">
              Ontdek
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="text-ai-nudge-foreground hover:bg-ai-nudge-border/50"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Sluit melding</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
