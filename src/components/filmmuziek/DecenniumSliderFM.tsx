import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FILMMUZIEK_FEITEN } from '@/data/filmmuziekFeiten';
import { useLanguage } from '@/contexts/LanguageContext';

const DECADES = ['30s', '40s', '50s', '60s', '70s', '80s', '90s', '00s', '10s', '20s'];

export const DecenniumSliderFM = () => {
  const [selectedDecade, setSelectedDecade] = useState('80s');
  const [currentIndex, setCurrentIndex] = useState(0);
  const { tr } = useLanguage();
  const fm = tr.filmmuziekUI;

  const decadeFeiten = FILMMUZIEK_FEITEN.filter(f => f.decade === selectedDecade);
  const visibleFeiten = decadeFeiten.slice(currentIndex, currentIndex + 3);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex + 3 < decadeFeiten.length;

  const decadeInfoMap: Record<string, { title: string; description: string }> = {
    '30s': { title: fm.decade30s, description: fm.decade30sDesc },
    '40s': { title: fm.decade40s, description: fm.decade40sDesc },
    '50s': { title: fm.decade50s, description: fm.decade50sDesc },
    '60s': { title: fm.decade60s, description: fm.decade60sDesc },
    '70s': { title: fm.decade70s, description: fm.decade70sDesc },
    '80s': { title: fm.decade80s, description: fm.decade80sDesc },
    '90s': { title: fm.decade90s, description: fm.decade90sDesc },
    '00s': { title: fm.decade00s, description: fm.decade00sDesc },
    '10s': { title: fm.decade10s, description: fm.decade10sDesc },
    '20s': { title: fm.decade20s, description: fm.decade20sDesc },
  };

  return (
    <section className="py-16 bg-gradient-to-br from-amber-950/30 to-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">{fm.throughDecades}</span>
          </div>
          <h2 className="text-3xl font-bold text-white">{fm.filmMusicTimeline}</h2>
          <p className="text-white/60 mt-2">{fm.discoverEvolution}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {DECADES.map((decade) => (
            <Button
              key={decade}
              variant={selectedDecade === decade ? "default" : "outline"}
              size="sm"
              onClick={() => { setSelectedDecade(decade); setCurrentIndex(0); }}
              className={selectedDecade === decade 
                ? "bg-amber-600 hover:bg-amber-700 text-white" 
                : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              }
            >
              {decade === '00s' ? '2000s' : decade === '10s' ? '2010s' : decade === '20s' ? '2020s' : `19${decade.slice(0, 2)}`}
            </Button>
          ))}
        </div>

        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-amber-400">{decadeInfoMap[selectedDecade]?.title}</h3>
          <p className="text-white/70">{decadeInfoMap[selectedDecade]?.description}</p>
        </div>

        <div className="relative">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={!canGoBack} className="shrink-0 text-amber-400 hover:text-amber-300 disabled:opacity-30">
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="flex-1 grid md:grid-cols-3 gap-4">
              {visibleFeiten.map((feit) => (
                <div key={feit.slug} className="bg-white/5 backdrop-blur rounded-xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all">
                  <div className="text-amber-400 font-bold text-lg mb-2">{feit.year}</div>
                  <h4 className="text-white font-semibold mb-2 line-clamp-2">{feit.title}</h4>
                  <p className="text-white/60 text-sm line-clamp-3">{feit.description}</p>
                  {feit.subgenre && (
                    <span className="inline-block mt-3 px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded">{feit.subgenre}</span>
                  )}
                </div>
              ))}
            </div>

            <Button variant="ghost" size="icon" onClick={() => setCurrentIndex(Math.min(decadeFeiten.length - 3, currentIndex + 1))} disabled={!canGoForward} className="shrink-0 text-amber-400 hover:text-amber-300 disabled:opacity-30">
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="text-center mt-4 text-white/40 text-sm">
          {decadeFeiten.length} {fm.milestonesInDecade} {selectedDecade === '00s' ? '2000' : selectedDecade === '10s' ? '2010' : selectedDecade === '20s' ? '2020' : `19${selectedDecade.slice(0, 2)}`}
        </div>
      </div>
    </section>
  );
};
