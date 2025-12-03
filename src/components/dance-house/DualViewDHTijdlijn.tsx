import React, { useState } from 'react';
import { Clock, Filter, ChevronRight } from 'lucide-react';
import { DANCE_HOUSE_FEITEN } from '@/data/danceHouseMuziekFeiten';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const DECADE_FILTERS = ['Alle', '80s', '90s', '00s', '10s', '20s'];

export const DualViewDHTijdlijn = () => {
  const [filter, setFilter] = useState('Alle');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredFeiten = DANCE_HOUSE_FEITEN
    .filter(feit => filter === 'Alle' || feit.decade === filter)
    .sort((a, b) => sortOrder === 'asc' ? a.year - b.year : b.year - a.year);

  return (
    <section className="py-16 bg-gradient-to-br from-slate-950 to-purple-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 rounded-full mb-4">
            <Clock className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 text-sm">Dance Tijdlijn</span>
          </div>
          <h2 className="text-3xl font-bold text-white">40+ Jaar Dance Geschiedenis</h2>
          <p className="text-white/60 mt-2">Van Chicago House tot moderne EDM</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <Filter className="w-4 h-4 text-white/60" />
          {DECADE_FILTERS.map((decade) => (
            <button
              key={decade}
              onClick={() => setFilter(decade)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filter === decade
                  ? 'bg-violet-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {decade === 'Alle' ? 'Alle' : `Jaren '${decade.replace('s', '')}`}
            </button>
          ))}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1.5 rounded-full text-sm bg-white/10 text-white/70 hover:bg-white/20 ml-2"
          >
            {sortOrder === 'asc' ? '↑ Oudste eerst' : '↓ Nieuwste eerst'}
          </button>
        </div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500 hidden md:block" />

          <div className="space-y-6">
            {filteredFeiten.slice(0, 20).map((feit, index) => (
              <div
                key={feit.slug}
                className={`relative flex items-center gap-4 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content card */}
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <Link
                    to={`/dh-muziekfeit/${feit.slug}`}
                    className="block group"
                  >
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:border-violet-500/50 transition-all">
                      <div className="text-violet-400 text-sm font-bold mb-1">{feit.year}</div>
                      <h3 className="text-white font-semibold group-hover:text-cyan-400 transition-colors mb-2">
                        {feit.title}
                      </h3>
                      <p className="text-white/60 text-sm line-clamp-2">{feit.description}</p>
                      {feit.subgenre && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 rounded text-xs text-white/60">
                          {feit.subgenre}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Center dot */}
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 border-2 border-background hidden md:block" />

                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>

        {filteredFeiten.length > 20 && (
          <div className="text-center mt-8">
            <Button variant="outline" className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10">
              Bekijk alle {filteredFeiten.length} feiten
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
