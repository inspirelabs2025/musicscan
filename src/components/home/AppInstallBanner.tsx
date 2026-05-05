import { useState } from 'react';
import { X, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsNativeApp } from '@/hooks/useIsNativeApp';

export const AppInstallBanner = () => {
  const { tr } = useLanguage();
  const h = tr.homeUI;
  const isNativeApp = useIsNativeApp();

  const [dismissed, setDismissed] = useState(() => {
    const d = localStorage.getItem('app-install-banner-dismissed');
    return d ? Date.now() - parseInt(d) < 14 * 24 * 60 * 60 * 1000 : false;
  });

  // Verberg in Capacitor native app — gebruiker heeft de app al.
  if (isNativeApp) return null;
  if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) return null;
  if (dismissed) return null;

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(ua);

  if (!isIOS && !isAndroid) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('app-install-banner-dismissed', Date.now().toString());
  };

  return (
    <div className="mx-4 my-6 relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5 shadow-lg">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
        aria-label={tr.common.close}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight">
            {isAndroid ? h.appInstallAndroid : h.appInstallTitle}
          </h3>
          <p className="text-sm opacity-85 mt-1">
            {isAndroid ? h.appInstallAndroidDesc : h.appInstallIOSDesc}
          </p>
        </div>
      </div>

      <div className="mt-4">
        {isIOS ? (
          <div className="flex items-center gap-2 bg-primary-foreground/15 rounded-xl px-4 py-3 text-sm">
            <Share className="w-5 h-5 flex-shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: h.appInstallIOSSteps }} />
          </div>
        ) : (
          <a
            href="https://play.google.com/store/apps/details?id=com.musicscan.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="secondary"
              className="w-full font-semibold"
              size="lg"
            >
              {h.downloadGooglePlay}
            </Button>
          </a>
        )}
      </div>
    </div>
  );
};
