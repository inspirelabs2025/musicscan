import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface AIGeneratedNarrativeProps {
  title: string;
  narrative?: string;
  icon?: string;
}

export const AIGeneratedNarrative: React.FC<AIGeneratedNarrativeProps> = ({ 
  title, 
  narrative,
  icon = '🌍'
}) => {
  if (!narrative) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>{icon}</span>
          {title}
          <Sparkles className="h-4 w-4 text-primary/50" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          {narrative}
        </p>
      </CardContent>
    </Card>
  );
};
