import React from 'react';
import { Layers, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FILMMUZIEK_SUBGENRES } from '@/hooks/useFilmmuziek';
import { Link } from 'react-router-dom';

export const FilmmuziekSubgenres = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">Ontdek Stijlen</span>
          </div>
          <h2 className="text-3xl font-bold">Filmmuziek Genres</h2>
          <p className="text-muted-foreground mt-2">Van symfonisch orkest tot elektronische soundscapes</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FILMMUZIEK_SUBGENRES.map((subgenre) => (
            <Link
              key={subgenre.name}
              to={`/artists?genre=${encodeURIComponent(subgenre.name.toLowerCase())}`}
              className="group"
            >
              <Card className={`h-full overflow-hidden border-transparent hover:border-white/20 transition-all bg-gradient-to-br ${subgenre.color} bg-opacity-10`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                    {subgenre.name}
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 text-sm mb-4">{subgenre.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {subgenre.artists.map((artist) => (
                      <span
                        key={artist}
                        className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80"
                      >
                        {artist}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
