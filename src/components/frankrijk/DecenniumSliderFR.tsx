import { useState } from "react";
import { ChevronLeft, ChevronRight, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DECADES, DECADE_INFO, FR_MUZIEK_FEITEN } from "@/data/franseMuziekFeiten";

export const DecenniumSliderFR = () => {
  const [selectedDecade, setSelectedDecade] = useState("90s");
  
  const currentIndex = DECADES.indexOf(selectedDecade);
  const decadeInfo = DECADE_INFO[selectedDecade];
  const decadeFeiten = FR_MUZIEK_FEITEN.filter(f => f.decade === selectedDecade).slice(0, 3);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedDecade(DECADES[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < DECADES.length - 1) {
      setSelectedDecade(DECADES[currentIndex + 1]);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            🎵 Reis Door de Tijd
          </h2>
          <p className="text-muted-foreground">
            Ontdek de Franse muziekgeschiedenis per decennium
          </p>
        </div>

        {/* Decade Selector */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex gap-2 overflow-x-auto py-2 px-4">
            {DECADES.map((decade) => (
              <button
                key={decade}
                onClick={() => setSelectedDecade(decade)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  selectedDecade === decade
                    ? "bg-[#0055A4] text-white shadow-lg"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {DECADE_INFO[decade].title}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === DECADES.length - 1}
            className="shrink-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Decade Content */}
        <div className={cn(
          "rounded-2xl p-6 md:p-8 bg-gradient-to-br",
          decadeInfo.color
        )}>
          <div className="text-center text-white mb-6">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">{decadeInfo.title}</h3>
            <p className="text-white/80 max-w-xl mx-auto">{decadeInfo.description}</p>
          </div>

          {/* Featured Events */}
          <div className="grid md:grid-cols-3 gap-4">
            {decadeFeiten.map((feit, index) => (
              <div
                key={feit.slug}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-white">{feit.year}</span>
                  <Music className="h-4 w-4 text-white/60" />
                </div>
                <h4 className="font-semibold text-white mb-1">{feit.title}</h4>
                <p className="text-sm text-white/70 line-clamp-2">{feit.description}</p>
                {feit.famousTrack && (
                  <p className="text-xs text-white/50 mt-2">♪ {feit.famousTrack}</p>
                )}
              </div>
            ))}
          </div>

          {/* View All Link */}
          <div className="text-center mt-6">
            <a
              href="#tijdlijn"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm"
            >
              Bekijk alle {FR_MUZIEK_FEITEN.filter(f => f.decade === selectedDecade).length} momenten uit de {decadeInfo.title.toLowerCase()}
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
