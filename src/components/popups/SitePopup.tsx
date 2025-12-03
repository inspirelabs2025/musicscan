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

interface SitePopupDialogProps {
  popup: SitePopup | null;
  isOpen: boolean;
  onClose: () => void;
  onButtonClick: () => void;
}

export function SitePopupDialog({ popup, isOpen, onClose, onButtonClick }: SitePopupDialogProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!popup) return null;

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
            className="w-full"
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
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl">{popup.title}</DrawerTitle>
            {popup.description && (
              <DrawerDescription className="text-base">
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
      <DialogContent className="sm:max-w-md">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Sluiten</span>
        </button>
        <DialogHeader>
          <DialogTitle className="text-xl">{popup.title}</DialogTitle>
          {popup.description && (
            <DialogDescription className="text-base">
              {popup.description}
            </DialogDescription>
          )}
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
