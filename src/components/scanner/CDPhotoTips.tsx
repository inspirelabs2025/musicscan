import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Camera, Focus, Moon, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CDPhotoTipsProps {
  className?: string;
  compact?: boolean;
}

/**
 * Tips voor betere CD matrix foto's
 * Helpt gebruikers om reflecties te minimaliseren en OCR te verbeteren
 */
export const CDPhotoTips = React.memo(({ className, compact = false }: CDPhotoTipsProps) => {
  const tips = [
    {
      icon: Lightbulb,
      title: "Indirect licht",
      description: "Geen directe lamp op de CD - gebruik gespreid licht",
      color: "text-yellow-500"
    },
    {
      icon: RotateCcw,
      title: "Hoek van 45°",
      description: "Fotografeer schuin om regenboog-reflecties te minimaliseren",
      color: "text-blue-500"
    },
    {
      icon: Focus,
      title: "Focus op hub",
      description: "Matrix codes zitten in de binnenste ring rond het gat",
      color: "text-green-500"
    },
    {
      icon: Moon,
      title: "Donkere achtergrond",
      description: "Vermindert reflecties en verbetert contrast",
      color: "text-purple-500"
    }
  ];

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2 text-xs", className)}>
        {tips.map((tip, index) => (
          <div 
            key={index}
            className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full"
          >
            <tip.icon className={cn("h-3 w-3", tip.color)} />
            <span className="text-muted-foreground">{tip.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className={cn("bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          Tips voor betere matrix herkenning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {tips.map((tip, index) => (
            <div 
              key={index} 
              className="flex items-start gap-2 p-2 rounded-lg bg-background/50"
            >
              <tip.icon className={cn("h-4 w-4 mt-0.5 shrink-0", tip.color)} />
              <div>
                <p className="text-xs font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

CDPhotoTips.displayName = 'CDPhotoTips';
