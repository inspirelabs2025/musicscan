import { Brain, Sparkles } from 'lucide-react';
import { Card, CardContent } from './card';

interface AiNudgeProps {
  /**
   * The number of times the user has used AI features.
   */
  aiUsageCount: number;
  /**
   * Callback function when the nudge is clicked.
   */
  onClick: () => void;
  /**
   * Optional CSS class for additional styling.
   */
  className?: string;
}

/**
 * A UI component to nudge users to try AI features.
 * This component encourages discovery of AI functionalities,
 * especially for users with low AI usage.
 */
export function AiNudge({
  aiUsageCount,
  onClick,
  className,
}: AiNudgeProps) {
  const message = aiUsageCount === 0
    ? "Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!"
    : `Je hebt AI ${aiUsageCount}x gebruikt. Ontdek meer AI-mogelijkheden!`;

  return (
    <Card
      className={`cursor-pointer !border-ai-nudge-border transition-all duration-300 hover:scale-[101%] active:scale-[99%] ${className || ''}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-4 text-ai-nudge-foreground bg-ai-nudge-background">
        <div className="flex-shrink-0 grid place-items-center bg-primary text-primary-foreground rounded-full h-10 w-10 relative overflow-hidden">
          <Brain className="z-10" size={20} />
          <Sparkles className="absolute top-0 right-0 text-yellow-300 transform -translate-y-1/4 translate-x-1/4 scale-75" size={12} />
        </div>
        <p className="text-sm font-medium leading-tight flex-grow">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}
