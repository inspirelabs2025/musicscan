import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { SitePopup } from '@/hooks/useSitePopups';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { NewsletterPopupForm } from './NewsletterPopupForm';
import { cn } from '@/lib/utils';

interface SitePopupDialogProps {
  popup: SitePopup | null;
  isOpen: boolean;
  onClose: () => void;
  onButtonClick: () => void;
}

// Popup type styling map
const getPopupStyles = (type: string) => {
  switch (type) {
    case 'quiz_prompt':
      return {
        container: 'bg-gradient-to-br from-purple-600 to-indigo-700',
        text: 'text-white',
        description: 'text-purple-100',
        button: 'bg-white text-purple-700 hover:bg-purple-50',
      };
    case 'newsletter':
      return {
        container: 'bg-gradient-to-br from-blue-600 to-cyan-600',
        text: 'text-white',
        description: 'text-blue-100',
        button: 'bg-white text-blue-700 hover:bg-blue-50',
      };
    case 'gamification':
      return {
        container: 'bg-gradient-to-br from-amber-500 to-orange-600',
        text: 'text-white',
        description: 'text-amber-100',
        button: 'bg-white text-amber-700 hover:bg-amber-50',
      };
    case 'promo':
      return {
        container: 'bg-gradient-to-br from-rose-500 to-pink-600',
        text: 'text-white',
        description: 'text-rose-100',
        button: 'bg-white text-rose-700 hover:bg-rose-50',
      };
    case 'contextual_redirect':
      return {
        container: 'bg-gradient-to-br from-emerald-500 to-teal-600',
        text: 'text-white',
        description: 'text-emerald-100',
        button: 'bg-white text-emerald-700 hover:bg-emerald-50',
      };
    default:
      return {
        container: 'bg-background',
        text: 'text-foreground',
        description: 'text-muted-foreground',
        button: '',
      };
  }
};

export function SitePopupDialog({ popup, isOpen, onClose, onButtonClick }: SitePopupDialogProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!popup) return null;

  const styles = getPopupStyles(popup.popup_type);
  const isStyled = popup.popup_type !== 'custom' && popup.popup_type !== 'announcement';

  const handleButtonClick = () => {
    onButtonClick();
    if (popup.button_url) {
      navigate(popup.button_url);
    }
    onClose();
  };

  const content = (
    <div className="space-y-4">
      {popup.image_url && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden">
          <img 
            src={popup.image_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {popup.popup_type === 'newsletter' ? (
        <NewsletterPopupForm onSuccess={onClose} />
      ) : (
        popup.button_text && (
          <Button 
            onClick={handleButtonClick}
            className={cn('w-full', isStyled && styles.button)}
            size="lg"
          >
            {popup.button_text}
          </Button>
        )
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className={cn('px-4 pb-8', isStyled && styles.container)}>
          <DrawerHeader className="text-left">
            <DrawerTitle className={cn('text-xl', isStyled && styles.text)}>
              {popup.title}
            </DrawerTitle>
            {popup.description && (
              <DrawerDescription className={cn('text-base', isStyled && styles.description)}>
                {popup.description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="px-4">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn('sm:max-w-md', isStyled && styles.container)}>
        <button
          onClick={onClose}
          className={cn(
            'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            isStyled && 'text-white/80 hover:text-white'
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Sluiten</span>
        </button>
        <DialogHeader>
          <DialogTitle className={cn('text-xl', isStyled && styles.text)}>
            {popup.title}
          </DialogTitle>
          {popup.description && (
            <DialogDescription className={cn('text-base', isStyled && styles.description)}>
              {popup.description}
            </DialogDescription>
          )}
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
