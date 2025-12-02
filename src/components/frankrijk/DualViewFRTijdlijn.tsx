import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Calendar, ChevronDown, ChevronUp, Play, ExternalLink } from "lucide-react";
import { FR_MUZIEK_FEITEN, DECADES, DECADE_INFO } from "@/data/franseMuziekFeiten";
import { cn } from "@/lib/utils";

export const DualViewFRTijdlijn = () => {
  const [selectedDecade, setSelectedDecade] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredFeiten = selectedDecade
    ? FR_MUZIEK_FEITEN.filter(f => f.decade === selectedDecade)
    : FR_MUZIEK_FEITEN;

  const sortedFeiten = [...filteredFeiten].sort((a, b) => 
    sortOrder === 'asc' ? a.year - b.year : b.year - a.year
  );

  return (
    <section id="tijdlijn" className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            📜 Franse Muziekgeschiedenis
          </h2>
          <p className="text-muted-foreground">
            {FR_MUZIEK_FEITEN.length} belangrijke momenten in de Franse muziek
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          {/* Decade Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedDecade(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all",
                selectedDecade === null
                  ? "bg-[#0055A4] text-white"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              Alle
            </button>
            {DECADES.map((decade) => (
              <button
                key={decade}
                onClick={() => setSelectedDecade(decade)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-all",
                  selectedDecade === decade
                    ? "bg-[#0055A4] text-white"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {DECADE_INFO[decade].title}
              </button>
            ))}
          </div>

          {/* Sort Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            {sortOrder === 'desc' ? 'Nieuwste eerst' : 'Oudste eerst'}
          </Button>
        </div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Center Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-[#0055A4]/30 transform md:-translate-x-1/2" />

            {/* Items */}
            <div className="space-y-6">
              {sortedFeiten.map((feit, index) => {
                const isExpanded = expandedItem === feit.slug;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={feit.slug}
                    className={cn(
                      "relative flex items-start gap-4",
                      "md:flex-row",
                      isEven ? "md:flex-row" : "md:flex-row-reverse"
                    )}
                  >
                    {/* Year Badge */}
                    <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 z-10">
                      <div className="w-8 h-8 rounded-full bg-[#0055A4] text-white flex items-center justify-center text-xs font-bold shadow-lg">
                        {feit.year.toString().slice(-2)}
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className={cn(
                      "ml-12 md:ml-0 md:w-[calc(50%-2rem)]",
                      isEven ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"
                    )}>
                      <Card
                        className={cn(
                          "cursor-pointer transition-all hover:border-[#0055A4]/50",
                          isExpanded && "border-[#0055A4]"
                        )}
                        onClick={() => setExpandedItem(isExpanded ? null : feit.slug)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-[#0055A4]">{feit.year}</span>
                              <h3 className="font-semibold text-foreground">{feit.title}</h3>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                          </div>

                          <p className={cn(
                            "text-sm text-muted-foreground mt-2",
                            !isExpanded && "line-clamp-2"
                          )}>
                            {feit.description}
                          </p>

                          {isExpanded && (
                            <div className="mt-4 space-y-3">
                              {feit.historicalContext && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-sm text-muted-foreground">
                                    {feit.historicalContext}
                                  </p>
                                </div>
                              )}

                              {feit.famousTrack && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Music className="h-4 w-4 text-[#0055A4]" />
                                  <span className="text-muted-foreground">
                                    Bekendste nummer: <strong>{feit.famousTrack}</strong>
                                  </span>
                                </div>
                              )}

                              {feit.relatedArtists && feit.relatedArtists.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {feit.relatedArtists.map((artist) => (
                                    <span
                                      key={artist}
                                      className="px-2 py-1 bg-[#0055A4]/10 text-[#0055A4] text-xs rounded-full"
                                    >
                                      {artist}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {feit.youtubeId && (
                                <a
                                  href={`https://www.youtube.com/watch?v=${feit.youtubeId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-[#EF4135] hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Play className="h-4 w-4" />
                                  Bekijk op YouTube
                                </a>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            {sortedFeiten.length} momenten weergegeven
            {selectedDecade && ` uit de ${DECADE_INFO[selectedDecade].title.toLowerCase()}`}
          </p>
        </div>
      </div>
    </section>
  );
};
