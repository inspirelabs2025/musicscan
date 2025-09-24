import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Search, Database, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface OptimizedSearchingCardProps {
  stage?: 'searching' | 'found' | 'pricing' | 'complete';
  resultsFound?: number;
}

export function SearchingLoadingCard({ stage = 'searching', resultsFound = 0 }: OptimizedSearchingCardProps) {
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    "💡 Wist je dat: We zoeken nu parallel in meerdere strategieën voor snellere resultaten?",
    "💡 Wist je dat: Resultaten verschijnen direct zonder te wachten op prijzen?",
    "💡 Wist je dat: First pressings zijn meestal meer waard?",
    "💡 Wist je dat: Een goede hoes kan de waarde verdubbelen?",
    "💡 Wist je dat: Zeldzame labels kunnen veel opbrengen?",
    "💡 Wist je dat: Matrix nummers helpen bij identificatie?",
    "💡 Wist je dat: Picture discs zijn vaak collectors items?",
    "💡 Wist je dat: De staat van het vinyl is cruciaal voor de prijs?"
  ];

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 2500);

    return () => clearInterval(tipTimer);
  }, [tips.length]);

  return (
    <Card className="w-full max-w-md mx-auto border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <CardContent className="p-6 text-center space-y-4">
        {/* Status Icons */}
        <div className="flex justify-center items-center space-x-3">
          {stage === 'searching' && (
            <>
              <Search className="h-8 w-8 animate-pulse text-primary" />
              <Database className="h-6 w-6 animate-bounce text-primary/70" />
            </>
          )}
          {stage === 'found' && (
            <>
              <CheckCircle className="h-8 w-8 text-green-500" />
              <Badge variant="secondary" className="ml-2">
                {resultsFound} gevonden
              </Badge>
            </>
          )}
          {stage === 'pricing' && (
            <>
              <Clock className="h-8 w-8 animate-spin text-orange-500" />
              <span className="text-sm text-muted-foreground">Prijzen laden...</span>
            </>
          )}
          {stage === 'complete' && (
            <>
              <Music className="h-8 w-8 text-green-500" />
              <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                Voltooid
              </Badge>
            </>
          )}
        </div>
        
        {/* Status Text */}
        <div className="space-y-2">
          {stage === 'searching' && (
            <>
              <h3 className="text-lg font-semibold">Snelle zoektocht gestart...</h3>
              <p className="text-sm text-muted-foreground">
                Parallel zoeken in Discogs database voor directe resultaten
              </p>
            </>
          )}
          {stage === 'found' && (
            <>
              <h3 className="text-lg font-semibold text-green-600">Album gevonden!</h3>
              <p className="text-sm text-muted-foreground">
                Prijsinformatie wordt nu geladen...
              </p>
            </>
          )}
          {stage === 'pricing' && (
            <>
              <h3 className="text-lg font-semibold">Bijna klaar...</h3>
              <p className="text-sm text-muted-foreground">
                Marktprijzen ophalen voor waardering
              </p>
            </>
          )}
          {stage === 'complete' && (
            <>
              <h3 className="text-lg font-semibold text-green-600">Zoeken voltooid!</h3>
              <p className="text-sm text-muted-foreground">
                Alle informatie succesvol opgehaald
              </p>
            </>
          )}
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${stage !== 'searching' ? 'bg-green-500' : 'bg-primary animate-pulse'}`} />
          <div className={`w-3 h-3 rounded-full ${stage === 'found' || stage === 'pricing' || stage === 'complete' ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
          <div className={`w-3 h-3 rounded-full ${stage === 'complete' ? 'bg-green-500' : stage === 'pricing' ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
        </div>

        {/* Tips Section */}
        <div className="mt-6 p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
          <p className="text-sm text-muted-foreground transition-all duration-500">
            {tips[currentTip]}
          </p>
        </div>

        {/* Floating musical notes animation */}
        <div className="relative h-6 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center space-x-4">
            <div className="text-primary/40 animate-bounce" style={{ animationDelay: '0s' }}>♪</div>
            <div className="text-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }}>♫</div>
            <div className="text-primary/40 animate-bounce" style={{ animationDelay: '0.4s' }}>♪</div>
            <div className="text-primary/60 animate-bounce" style={{ animationDelay: '0.6s' }}>♫</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}