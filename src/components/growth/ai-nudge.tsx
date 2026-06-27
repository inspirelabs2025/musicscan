import React from 'react';
import { BrainIcon, SparklesIcon, XIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AiNudgeProps {
  title?: string;
  description?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  onClose?: () => void;
  isVisible?: boolean;
  variant?: 'nudge' | 'alert';
}

const AiNudge: React.FC<AiNudgeProps> = ({
  title = 'Ontdek de kracht van AI!',
  description = 'Je hebt de AI features nog maar 0x gebruikt. Ontdek wat AI voor je project kan doen!',
  ctaText = 'Meer weten', // Updated default CTA text
  onCtaClick,
  onClose,
  isVisible = false,
  variant = 'nudge',
}) => {
  if (!isVisible) return null;

  // Tailwind classes based on variant
  const cardClasses = variant === 'nudge'
    ? 'border border-ai-nudge-border bg-ai-nudge-background text-ai-nudge-foreground'
    : 'border border-primary bg-primary text-primary-foreground';

  const buttonClasses = variant === 'nudge'
    ? 'bg-ai-nudge-foreground text-ai-nudge-background hover:bg-ai-nudge-foreground/90'
    : 'bg-primary-foreground text-primary hover:bg-primary-foreground/90';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <Card className={`relative shadow-lg ${cardClasses}`}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            {variant === 'nudge' ? (
              <BrainIcon className="text-ai-nudge-foreground h-5 w-5" />
            ) : (
              <SparklesIcon className="text-primary-foreground h-5 w-5" />
            )}
            <CardTitle className="text-lg leading-none tracking-tight">{title}</CardTitle>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={`w-6 h-6 ${variant === 'nudge' ? 'text-ai-nudge-foreground' : 'text-primary-foreground'} hover:bg-transparent`}
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          <CardDescription className={variant === 'nudge' ? 'text-ai-nudge-foreground' : 'text-primary-foreground'}>
            {description}
          </CardDescription>
        </CardContent>
        {ctaText && (
          <CardFooter className="flex justify-end p-4 pt-0">
            <Button
              onClick={onCtaClick}
              className={buttonClasses}
            >
              {ctaText}
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default AiNudge;
