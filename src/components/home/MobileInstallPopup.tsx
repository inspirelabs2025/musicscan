import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
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

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function MobileInstallPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed today
    const dismissedDate = localStorage.getItem('install-popup-dismissed');
    if (dismissedDate) {
      const dismissed = new Date(dismissedDate);
      const today = new Date();
      if (
        dismissed.getDate() === today.getDate() &&
        dismissed.getMonth() === today.getMonth() &&
        dismissed.getFullYear() === today.getFullYear()
      ) {
        return;
      }
    }

    // Check if mobile
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobileDevice) return;

    // Listen for install prompt (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show popup after 2 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      navigate('/install');
    }
    setIsOpen(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('install-popup-dismissed', new Date().toISOString());
    setIsOpen(false);
  };

  if (isInstalled) return null;

  const content = (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
          <Smartphone className="h-10 w-10 text-primary-foreground" />
        </div>
      </div>
      
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground">
          Installeer MusicScan op je startscherm voor snelle toegang, offline functionaliteit en een app-achtige ervaring.
        </p>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={handleInstallClick}
          className="w-full gap-2 h-12 text-base font-semibold"
          size="lg"
        >
          <Download className="h-5 w-5" />
          Nu Installeren
        </Button>
        <Button 
          variant="ghost" 
          onClick={handleDismiss}
          className="w-full text-muted-foreground"
        >
          Later
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
        <DrawerContent className="px-6 pb-8">
          <DrawerHeader className="text-center pt-6">
            <DrawerTitle className="text-2xl font-bold">
              🎵 MusicScan App
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Installeer de MusicScan app
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Sluiten</span>
        </button>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">
            🎵 MusicScan App
          </DialogTitle>
          <DialogDescription className="sr-only">
            Installeer de MusicScan app
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
