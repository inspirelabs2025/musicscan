import React from 'react';
import { Link } from 'react-router-dom';
import { aiNudgeVariants } from '@/utils/aiNudgeVariants';
import { Card, CardContent } from '@/components/ui/card';
import { AiNudgeType } from '@/types/aiNudge';

interface AiNudgeProps {
  variant?: AiNudgeType;
}

const AiNudge: React.FC<AiNudgeProps> = ({ variant = 'nudge' }) => {
  const nudgeData = aiNudgeVariants[variant];

  if (!nudgeData) {
    console.warn(`AI Nudge variant '${variant}' not found.`);
    return null;
  }

  return (
    <Card className="w-full max-w-sm bg-ai-nudge-background text-ai-nudge-foreground border-ai-nudge-border shadow-lg animate-fade-in">
      <CardContent className="p-4 flex items-center justify-between">
        <p className="text-sm flex-grow pr-2">
          {nudgeData.text}
        </p>
        <Link
          to={nudgeData.linkHref}
          className="text-xs font-semibold text-primary-foreground bg-primary px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
        >
          {nudgeData.linkText}
        </Link>
      </CardContent>
    </Card>
  );
};

export default AiNudge;
