import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brain, XCircle } from "lucide-react";

interface AiNudgeProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
  onClose?: () => void;
  aiFeatureCount?: number; // Added to check AI feature usage
}

export const AiNudge: React.FC<AiNudgeProps> = ({
  title = "AI features beschikbaar",
  description = "Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!",
  buttonText = "Ontdek AI features",
  onButtonClick,
  onClose,
  className,
  aiFeatureCount = 0,
  ...props
}) => {
  // Only display the nudge if AI features haven't been used (count is 0)
  if (aiFeatureCount > 0) {
    return null; // Don't render the nudge
  }

  return (
    <Card
      className={cn(
        "relative w-full max-w-sm rounded-xl overflow-hidden bg-ai-nudge-background text-ai-nudge-foreground border border-ai-nudge-border shadow-lg transform transition-transform duration-300 ease-out animate-fade-in",
        className
      )}
      {...props}
    >
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-ai-nudge-foreground/70 hover:text-ai-nudge-foreground"
          onClick={onClose}
          aria-label="Sluit AI suggestie"
        >
          <XCircle className="h-5 w-5" />
        </Button>
      )}
      <div
        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-ai-glow animate-ai-glow-pulse"
        aria-hidden="true"
      />
      <CardHeader className="flex flex-row items-center space-x-4 p-4 pr-10 md:p-6 md:pr-12">
        <div className="flex-shrink-0 p-2 rounded-full bg-ai-nudge-foreground/10 text-ai-nudge-foreground">
          <Brain className="h-6 w-6 md:h-7 md:w-7" />
        </div>
        <div>
          <CardTitle className="text-lg font-bold leading-tight md:text-xl">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
        <CardDescription className="text-sm text-ai-nudge-foreground/80 leading-relaxed md:text-base">
          {description}
        </CardDescription>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0 md:px-6 md:pb-6">
        <Button
          onClick={onButtonClick}
          className="w-full bg-ai-nudge-foreground text-ai-nudge-background hover:bg-ai-nudge-foreground/90 transition-colors duration-200"
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};
