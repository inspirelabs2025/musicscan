import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

interface AINudgeProps {
  onClose: () => void;
}

export function AINudge({ onClose }: AINudgeProps) {
  useEffect(() => {
    // Optionally send an analytics event when the nudge is shown
    console.log('AI Nudge shown');
    // gaEvent('ai_nudge_shown', { variant: 'default' });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="bg-ai-nudge-background text-ai-nudge-foreground border-ai-nudge-border rounded-lg shadow-lg p-4 flex items-start space-x-3 max-w-sm">
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">
            🤖 AI features beschikbaar
          </p>
          <p className="text-sm text-ai-nudge-foreground/80 mb-3">
            Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!
          </p>
          <Link to="/ai-monitization">
            <Button
              variant="secondary"
              size="sm"
              className="bg-ai-nudge-foreground text-ai-nudge-background hover:bg-ai-nudge-foreground/90"
              onClick={() => {
                console.log('AI Nudge CTA clicked');
                // gaEvent('ai_nudge_cta_click', { variant: 'default' });
                onClose();
              }}
            >
              Ontdek AI tools
            </Button>
          </Link>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('AI Nudge dismissed');
            // gaEvent('ai_nudge_dismiss', { variant: 'default' });
            onClose();
          }}
          className="text-ai-nudge-foreground/70 hover:text-ai-nudge-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
