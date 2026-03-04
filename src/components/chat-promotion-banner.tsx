import React, { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Utility to manage banner visibility state in local storage
const LOCAL_STORAGE_KEY = 'chat_promotion_banner_dismissed';

const isBannerDismissed = (): boolean => {
  if (typeof window === 'undefined') return false; // Server-side rendering safeguard
  return localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
};

const dismissBanner = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  }
};

interface ChatPromotionBannerProps {
  onDismiss?: () => void;
}

export function ChatPromotionBanner({ onDismiss }: ChatPromotionBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isBannerDismissed()) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    dismissBanner();
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="w-full bg-primary text-primary-foreground rounded-lg shadow-lg mb-6 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-primary-foreground hover:bg-primary-foreground/10"
        onClick={handleDismiss}
        aria-label="Dismiss promotion"
      >
        <XIcon className="h-5 w-5" />
      </Button>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">🚀 Ontdek Onze Nieuwe AI Chat!</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <CardDescription className="text-primary-foreground/90">
          Stel je vragen, krijg direct antwoorden en verbeter je workflow met onze slimme AI assistent.
        </CardDescription>
      </CardContent>
      <CardFooter className="mt-4 flex justify-end">
        <Button
          onClick={() => {
            // TODO: Add tracking for banner click
            window.location.href = '/chat'; // Or use react-router-dom navigate
            handleDismiss(); // Dismiss after clicking
          }}
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          Probeer het nu!
        </Button>
      </CardFooter>
    </Card>
  );
}
