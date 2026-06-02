import { XIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface NudgeAIProps {
  message: string;
  linkText: string;
  linkHref: string;
  onClose: () => void;
}

export function NudgeAI({ message, linkText, linkHref, onClose }: NudgeAIProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 shadow-lg bg-ai-nudge-background text-ai-nudge-foreground border-ai-nudge-border animate-fade-in md:bottom-8 md:right-8">
      <div className="flex items-center space-x-3">
        <SparklesIcon className="h-6 w-6 text-primary" />
        <p className="text-sm font-medium flex-grow">
          {message}
        </p>
        <Button variant="link" asChild className="text-ai-nudge-foreground p-0 h-auto">
          <Link to={linkHref} onClick={handleClose}>
            {linkText}
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-ai-nudge-foreground hover:bg-ai-nudge-border/50"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
