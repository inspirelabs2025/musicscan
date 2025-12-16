import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FILMMUZIEK_FEITEN } from '@/data/filmmuziekFeiten';

const DECADES = ['30s', '40s', '50s', '60s', '70s', '80s', '90s', '00s', '10s', '20s'];

export const DecenniumSliderFM = () => {
  const [selectedDecade, setSelectedDecade] = useState('80s');
  const [currentIndex, setCurrentIndex] = useState(0);

  const decadeFeiten = FILMMUZIEK_FEITEN.filter(f => f.decade === selectedDecade);
  
  const visibleFeiten = decadeFeiten.slice(currentIndex, currentIndex + 3);
  
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex + 3 < decadeFeiten.length;

  const decadeInfo: Record<string, { title: string; description: string }> = {
    '30s': { title: "De Geboorte", description: "Max Steiner legt de basis voor de Hollywood score" },
    '40s': { title: "De Gouden Eeuw", description: "Bernard Herrmann en de Hitchcock samenwerking" },
    '50s': { title: "Epische Cinema", description: "Grootse orkestrale scores voor spectaculaire films" },
    '60s': { title: "Experimentatie", description: "Morricone revolutioneert de Western, Psycho schokt" },
    '70s': { title: "De Renaissance", description: "John Williams brengt het symfonisch orkest terug" },
    '80s': { title: "Synthesizer Revolutie", description: "Vangelis en elektronische scores veroveren Hollywood" },
    '90s': { title: "Emotionele Diepte", description: "Hans Zimmer en James Horner domineren" },
    '00s': { title: "Epische Fantastie", description: "Lord of the Rings en Pirates of the Caribbean" },
    '10s': { title: "Hybrid Era", description: "BRAAAM en de moderne blockbuster sound" },
    '20s': { title: "Nieuwe Meesters", description: "Göransson, Guðnadóttir en de volgende generatie" }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-amber-950/30 to-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">Door de Decennia</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Filmmuziek Tijdlijn</h2>
          <p className="text-white/60 mt-2">Ontdek de evolutie van filmscores per decennium</p>
        </div>

        {/* Decade selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {DECADES.map((decade) => (
            <Button
              key={decade}
              variant={selectedDecade === decade ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedDecade(decade);
                setCurrentIndex(0);
              }}
              className={selectedDecade === decade 
                ? "bg-amber-600 hover:bg-amber-700 text-white" 
                : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              }
            >
              {decade === '00s' ? '2000s' : decade === '10s' ? '2010s' : decade === '20s' ? '2020s' : `19${decade.slice(0, 2)}`}
            </Button>
          ))}
        </div>

        {/* Decade info */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-amber-400">{decadeInfo[selectedDecade]?.title}</h3>
          <p className="text-white/70">{decadeInfo[selectedDecade]?.description}</p>
        </div>

        {/* Facts carousel */}
        <div className="relative">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={!canGoBack}
              className="shrink-0 text-amber-400 hover:text-amber-300 disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="flex-1 grid md:grid-cols-3 gap-4">
              {visibleFeiten.map((feit) => (
                <div
                  key={feit.slug}
                  className="bg-white/5 backdrop-blur rounded-xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                >
                  <div className="text-amber-400 font-bold text-lg mb-2">{feit.year}</div>
                  <h4 className="text-white font-semibold mb-2 line-clamp-2">{feit.title}</h4>
                  <p className="text-white/60 text-sm line-clamp-3">{feit.description}</p>
                  {feit.subgenre && (
                    <span className="inline-block mt-3 px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded">
                      {feit.subgenre}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentIndex(Math.min(decadeFeiten.length - 3, currentIndex + 1))}
              disabled={!canGoForward}
              className="shrink-0 text-amber-400 hover:text-amber-300 disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="text-center mt-4 text-white/40 text-sm">
          {decadeFeiten.length} mijlpalen in de jaren {selectedDecade === '00s' ? '2000' : selectedDecade === '10s' ? '2010' : selectedDecade === '20s' ? '2020' : `19${selectedDecade.slice(0, 2)}`}
        </div>
      </div>
    </section>
  );
};
