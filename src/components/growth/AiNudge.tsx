import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trackEvent } from '@/integrations/analytics';

interface AiNudgeProps {
  title: string;
  description: string;
  onClose?: () => void;
}

const AiNudge: React.FC<AiNudgeProps> = ({ title, description, onClose }) => {
  const handleDismiss = () => {
    trackEvent('ai_nudge_dismiss', { variant: 'nudge' });
    onClose?.();
  };

  const handleCtaClick = () => {
    trackEvent('ai_nudge_cta_click', { variant: 'nudge' });
    // TODO: Implement navigation to AI features page
    onClose?.();
  };

  return (
    <Card className='w-full max-w-sm border-ai-nudge-border bg-ai-nudge-background text-ai-nudge-foreground shadow-lg'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
        {onClose && (
          <Button variant='ghost' size='icon' onClick={handleDismiss} className='h-8 w-8 text-ai-nudge-foreground/70 hover:text-ai-nudge-foreground'>
            <X className='h-4 w-4' />
            <span className='sr-only'>Sluit</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className='pt-2'>
        <CardDescription className='mb-4 text-ai-nudge-foreground/90'>
          {description}
        </CardDescription>
        <Button onClick={handleCtaClick} className='w-full bg-primary text-primary-foreground hover:bg-primary/90'>
          Ontdek AI features
        </Button>
      </CardContent>
    </Card>
  );
};

export default AiNudge;
