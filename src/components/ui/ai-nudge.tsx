import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';

interface AiNudgeProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  link?: { href: string; text: string };
  variant?: 'nudge' | 'chat-nudge'; // Add 'chat-nudge' variant
  storageKey: string; // Unique key for local storage
  isVisible: boolean; // Controlled visibility
}

const AiNudge: React.FC<AiNudgeProps> = ({
  title,
  message,
  icon,
  link,
  variant = 'nudge',
  storageKey,
  isVisible: initialIsVisible,
}) => {
  const [isDismissed, setIsDismissed] = useLocalStorage(storageKey, false);
  const [isVisible, setIsVisible] = React.useState(initialIsVisible && !isDismissed);

  React.useEffect(() => {
    setIsVisible(initialIsVisible && !isDismissed);
  }, [initialIsVisible, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const nudgeClasses = cn(
    'fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-start space-x-3 transition-all duration-300',
    {
      'bg-ai-nudge-background text-ai-nudge-foreground border border-ai-nudge-border':
        variant === 'nudge',
      'bg-blue-500 text-white border border-blue-600': variant === 'chat-nudge',
    }
  );

  const iconClasses = cn('flex-shrink-0 mt-0.5',
    {
      'text-blue-200': variant === 'chat-nudge',
      'text-ai-nudge-foreground': variant === 'nudge',
    });

  const titleClasses = cn('font-semibold',
    {
      'text-white': variant === 'chat-nudge',
      'text-ai-nudge-foreground': variant === 'nudge',
    }
  )

  const messageClasses = cn('text-sm',
    {
      'text-blue-100': variant === 'chat-nudge',
      'text-ai-nudge-foreground': variant === 'nudge',
    }
  )

  const linkClasses = cn('text-sm font-medium hover:underline',
    {
      'text-blue-100 hover:text-white': variant === 'chat-nudge',
      'text-primary hover:text-primary-foreground': variant === 'nudge',
    }
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={nudgeClasses}
          role="alert"
          aria-live="polite"
        >
          <div className={iconClasses}>
            {icon || <MessageSquare size={20} />}
          </div>
          <div className="flex-grow">
            {title && <h3 className={titleClasses}>{title}</h3>}
            <p className={messageClasses}>{message}</p>
            {link && (
              <a href={link.href} className={linkClasses} target="_blank" rel="noopener noreferrer">
                {link.text}
              </a>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className={cn(
              'p-1 rounded-full absolute top-2 right-2',
              {
                'text-white hover:bg-blue-600': variant === 'chat-nudge',
                'text-gray-400 hover:bg-gray-200': variant === 'nudge', // Changed to gray for general nudge
              }
            )}
            aria-label="Bericht sluiten"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiNudge;
