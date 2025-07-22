import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Music, Search, Heart, Star, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const loadingMessages = [
  "🎵 Zoeken naar jouw perfecte match...",
  "🎸 Discogs database doorspitten...",
  "💎 Prijsinformatie verzamelen...",
  "🎤 Bijna klaar met zoeken...",
  "🎺 Laatste details ophalen...",
  "🥁 Je muziek waarderen..."
];

const icons = [Music, Search, Heart, Star, Zap];

export function SearchingLoadingCard() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Don't complete until search is done
        return prev + Math.random() * 15;
      });
    }, 800);

    // Message rotation
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    // Icon rotation
    const iconInterval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearInterval(iconInterval);
    };
  }, []);

  const CurrentIcon = icons[currentIcon];

  return (
    <Card variant="purple" className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">\
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Main loading indicator */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <CurrentIcon className="h-8 w-8 text-primary animate-bounce" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-ping" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-primary">
                Discogs aan het doorzoeken! 🎵
              </h3>
              <p className="text-sm text-muted-foreground animate-fade-in">
                {loadingMessages[messageIndex]}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Zoeken...</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Fun facts or tips while waiting */}
          <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-primary mt-0.5 animate-pulse" />
              <div>
                <p className="text-sm font-medium">Wist je dat...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Discogs heeft meer dan 15 miljoen releases in hun database! 
                  We zoeken door deze enorme collectie om de beste match voor jouw item te vinden.
                </p>
              </div>
            </div>
          </div>

          {/* Floating musical notes animation */}
          <div className="relative h-8 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center space-x-8">
              <div className="text-primary/40 animate-bounce" style={{ animationDelay: '0s' }}>♪</div>
              <div className="text-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }}>♫</div>
              <div className="text-primary/40 animate-bounce" style={{ animationDelay: '0.4s' }}>♪</div>
              <div className="text-primary/60 animate-bounce" style={{ animationDelay: '0.6s' }}>♫</div>
              <div className="text-primary/40 animate-bounce" style={{ animationDelay: '0.8s' }}>♪</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}