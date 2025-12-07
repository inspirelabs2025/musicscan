import { Card, CardContent } from "@/components/ui/card";
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

const tips = [
  "Discogs heeft meer dan 15 miljoen releases in hun database!",
  "We zoeken door deze enorme collectie om de beste match te vinden.",
  "Ons systeem vergelijkt je foto's met duizenden afbeeldingen.",
  "De prijsanalyse wordt live uit de markt gehaald.",
  "Elke scan wordt geoptimaliseerd voor maximale nauwkeurigheid."
];

const icons = [Music, Search, Heart, Star, Zap];

export function VinylLoadingCard() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
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

    // Tip rotation
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);

    // Icon rotation
    const iconInterval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearInterval(tipInterval);
      clearInterval(iconInterval);
    };
  }, []);

  const CurrentIcon = icons[currentIcon];
  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
      <CardContent className="pt-8 pb-6">
        <div className="space-y-8">
          {/* Vinyl Record with Progress Ring */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Progress Ring */}
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="hsl(var(--muted))"
                  strokeWidth="2"
                  fill="none"
                  className="opacity-20"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 ease-out drop-shadow-sm"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Vinyl Record */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl animate-spin" style={{ animationDuration: '3s' }}>
                {/* Vinyl grooves */}
                <div className="absolute inset-1 rounded-full border border-slate-600/30"></div>
                <div className="absolute inset-3 rounded-full border border-slate-600/20"></div>
                <div className="absolute inset-5 rounded-full border border-slate-600/10"></div>
                <div className="absolute inset-7 rounded-full border border-slate-600/10"></div>
                
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                  </div>
                </div>
                
                {/* Glowing effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-transparent animate-pulse"></div>
              </div>
              
              {/* Progress percentage in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-primary bg-background/80 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center border border-primary/20">
                  {Math.round(progress)}
                </span>
              </div>
            </div>

            {/* Loading text */}
            <div className="text-center mt-6 space-y-2">
              <div className="flex items-center justify-center gap-3">
                <CurrentIcon className="h-6 w-6 text-primary animate-bounce" />
                <h3 className="font-semibold text-xl text-primary">
                  Discogs aan het doorzoeken!
                </h3>
                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
              </div>
              <p className="text-muted-foreground animate-fade-in font-medium">
                {loadingMessages[messageIndex]}
              </p>
            </div>
          </div>

          {/* Floating musical notes */}
          <div className="relative h-12 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center space-x-12">
              {['♪', '♫', '♪', '♫', '♪'].map((note, index) => (
                <div
                  key={index}
                  className="text-2xl text-primary/40 animate-bounce"
                  style={{ 
                    animationDelay: `${index * 0.2}s`,
                    animationDuration: '2s'
                  }}
                >
                  {note}
                </div>
              ))}
            </div>
            
            {/* Additional floating notes */}
            <div className="absolute top-0 left-1/4 w-4 h-4 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-2 right-1/3 w-3 h-3 bg-secondary/30 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-0 left-1/3 w-2 h-2 bg-accent/40 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
          </div>

          {/* Enhanced tip section */}
          <div className="bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 rounded-xl p-6 border border-primary/10 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative flex items-start gap-4">
              <Star className="h-6 w-6 text-primary mt-1 animate-pulse flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Wist je dat...</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tips[tipIndex]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}