import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle, Share, Plus, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>MusicScan is geïnstalleerd!</CardTitle>
            <CardDescription>
              Je kunt de app nu openen vanaf je startscherm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Ga naar Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
            <img 
              src="/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" 
              alt="MusicScan" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">MusicScan Installeren</h1>
          <p className="text-muted-foreground">
            Installeer MusicScan op je telefoon voor snelle toegang
          </p>
        </div>

        {/* Install Button (Android/Desktop with prompt) */}
        {deferredPrompt && (
          <Card className="mb-6 border-primary">
            <CardContent className="p-6">
              <Button 
                onClick={handleInstallClick} 
                size="lg" 
                className="w-full gap-2"
              >
                <Download className="h-5 w-5" />
                Nu Installeren
              </Button>
            </CardContent>
          </Card>
        )}

        {/* iOS Instructions */}
        {isIOS && !deferredPrompt && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Installeren op iPhone/iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Tik op het Deel-icoon</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Share className="h-4 w-4" /> onderaan in Safari
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Scroll en tik op "Zet op beginscherm"</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Add to Home Screen
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Tik op "Voeg toe"</p>
                  <p className="text-sm text-muted-foreground">MusicScan verschijnt nu op je startscherm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Android Instructions (fallback) */}
        {isAndroid && !deferredPrompt && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Installeren op Android
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Tik op het menu-icoon</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MoreVertical className="h-4 w-4" /> rechtsboven in Chrome
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Tik op "Toevoegen aan startscherm"</p>
                  <p className="text-sm text-muted-foreground">Of "App installeren"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Bevestig de installatie</p>
                  <p className="text-sm text-muted-foreground">MusicScan verschijnt op je startscherm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Waarom installeren?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Snelle toegang vanaf je startscherm</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Werkt offline - bekijk je collectie zonder internet</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Sneller laden door caching</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Fullscreen ervaring zonder browser-balk</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Later installeren
          </Button>
        </div>
      </div>
    </div>
  );
}
