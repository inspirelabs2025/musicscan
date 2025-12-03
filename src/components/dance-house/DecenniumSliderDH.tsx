import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DANCE_HOUSE_FEITEN, getDanceHouseFeitenByDecade } from '@/data/danceHouseMuziekFeiten';
import { Link } from 'react-router-dom';

const DECADES = [
  { id: '80s', label: "Jaren '80", color: 'from-orange-500 to-red-500', icon: '📻' },
  { id: '90s', label: "Jaren '90", color: 'from-purple-500 to-pink-500', icon: '💿' },
  { id: '00s', label: "Jaren '00", color: 'from-blue-500 to-cyan-500', icon: '🎧' },
  { id: '10s', label: "Jaren '10", color: 'from-green-500 to-emerald-500', icon: '🎤' },
  { id: '20s', label: "Jaren '20", color: 'from-violet-500 to-purple-500', icon: '🎵' },
];

export const DecenniumSliderDH = () => {
  const [activeDecade, setActiveDecade] = useState('90s');
  const feiten = getDanceHouseFeitenByDecade(activeDecade);
  const currentDecade = DECADES.find(d => d.id === activeDecade);

  const goToPrevious = () => {
    const currentIndex = DECADES.findIndex(d => d.id === activeDecade);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : DECADES.length - 1;
    setActiveDecade(DECADES[prevIndex].id);
  };

  const goToNext = () => {
    const currentIndex = DECADES.findIndex(d => d.id === activeDecade);
    const nextIndex = currentIndex < DECADES.length - 1 ? currentIndex + 1 : 0;
    setActiveDecade(DECADES[nextIndex].id);
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full mb-4">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 text-sm">Door de Decennia</span>
          </div>
          <h2 className="text-3xl font-bold">Dance Muziek Tijdlijn</h2>
        </div>

        {/* Decade selector */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {DECADES.map((decade) => (
            <button
              key={decade.id}
              onClick={() => setActiveDecade(decade.id)}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                activeDecade === decade.id
                  ? `bg-gradient-to-r ${decade.color} text-white shadow-lg`
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <span>{decade.icon}</span>
              <span>{decade.label}</span>
            </button>
          ))}
        </div>

        {/* Navigation and content */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goToPrevious} className="shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 overflow-hidden">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feiten.slice(0, 6).map((feit) => (
                <Link
                  key={feit.slug}
                  to={`/dh-muziekfeit/${feit.slug}`}
                  className="group block"
                >
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${currentDecade?.color} bg-opacity-10 border border-white/10 hover:border-white/30 transition-all h-full`}>
                    <div className="text-sm font-bold text-white/60 mb-1">{feit.year}</div>
                    <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 mb-2">
                      {feit.title}
                    </h3>
                    <p className="text-sm text-white/70 line-clamp-2">{feit.description}</p>
                    {feit.subgenre && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 rounded text-xs text-white/60">
                        {feit.subgenre}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <Button variant="outline" size="icon" onClick={goToNext} className="shrink-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* View all link */}
        <div className="text-center mt-8">
          <Link
            to={`/dance-house/jaren-${activeDecade}`}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
          >
            Bekijk alle {currentDecade?.label} feiten →
          </Link>
        </div>
      </div>
    </section>
  );
};
