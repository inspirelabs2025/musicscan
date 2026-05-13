import { useEffect } from 'react';
import { toast } from 'sonner';

interface AiNudgeProps {
  variant?: 'nudge';
}

export function AiNudge({ variant }: AiNudgeProps) {
  useEffect(() => {
    if (variant === 'nudge') {
      toast.message(
        <div className="ai-nudge-message">
          <p className="font-semibold text-lg mb-2">🤖 AI features beschikbaar!</p>
          <p className="text-sm mb-3">Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!</p>
          <a href="/ai-features" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-ai-nudge-background text-ai-nudge-foreground shadow hover:bg-ai-nudge-background/90 h-9 px-4 py-2 border border-solid border-ai-nudge-border">
            Ontdek AI
          </a>
        </div>,
        {
          duration: 10000, // Show for 10 seconds
          position: 'bottom-right',
          className: 'ai-nudge-container',
          action: {
            label: 'Verberg',
            onClick: () => toast.dismiss(),
          },
          closeButton: true,
        }
      );
    }
  }, [variant]);

  return null;
}
