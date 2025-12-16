import React, { useState } from 'react';
import { Clock, SortAsc, SortDesc, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FILMMUZIEK_FEITEN } from '@/data/filmmuziekFeiten';

export const DualViewFMTijdlijn = () => {
  const [filter, setFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const decades = ['all', '30s', '40s', '50s', '60s', '70s', '80s', '90s', '00s', '10s', '20s'];

  const filteredFeiten = FILMMUZIEK_FEITEN
    .filter(f => filter === 'all' || f.decade === filter)
    .sort((a, b) => sortOrder === 'asc' ? a.year - b.year : b.year - a.year);

  const displayFeiten = filteredFeiten.slice(0, 12);

  return (
    <section className="py-16 bg-gradient-to-br from-slate-900/80 to-amber-950/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">Complete Tijdlijn</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Filmmuziek Geschiedenis</h2>
          <p className="text-white/60 mt-2">95 jaar aan iconische filmscores en soundtracks</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {decades.map((decade) => (
            <Button
              key={decade}
              variant={filter === decade ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(decade)}
              className={filter === decade 
                ? "bg-amber-600 hover:bg-amber-700 text-white" 
                : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              }
            >
              {decade === 'all' ? 'Alles' : decade === '00s' ? '2000s' : decade === '10s' ? '2010s' : decade === '20s' ? '2020s' : `19${decade.slice(0, 2)}`}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 ml-2"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 mr-1" /> : <SortDesc className="w-4 h-4 mr-1" />}
            {sortOrder === 'asc' ? 'Oudste eerst' : 'Nieuwste eerst'}
          </Button>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-amber-500/30 hidden lg:block" />

          <div className="space-y-6">
            {displayFeiten.map((feit, index) => (
              <div
                key={feit.slug}
                className={`relative flex items-center gap-8 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                  <Link to={`/filmmuziek/feit/${feit.slug}`} className="group block">
                    <div className="bg-white/5 backdrop-blur rounded-xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all inline-block max-w-lg">
                      <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold">
                        <span className="text-2xl">{feit.year}</span>
                        {feit.subgenre && (
                          <span className="text-xs px-2 py-1 bg-amber-500/10 rounded">{feit.subgenre}</span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold mb-2 group-hover:text-amber-400 transition-colors">
                        {feit.title}
                      </h3>
                      <p className="text-white/60 text-sm line-clamp-2">{feit.description}</p>
                      <div className="mt-3 flex items-center gap-1 text-amber-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        Lees meer <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Center dot */}
                <div className="hidden lg:flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 border-4 border-slate-900 z-10" />

                {/* Spacer for opposite side */}
                <div className="flex-1 hidden lg:block" />
              </div>
            ))}
          </div>
        </div>

        {filteredFeiten.length > 12 && (
          <div className="text-center mt-8">
            <Link to="/filmmuziek/tijdlijn">
              <Button variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                Bekijk alle {filteredFeiten.length} mijlpalen
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
