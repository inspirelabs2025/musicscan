import React from 'react';
import { Users, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useFilmmuziekArtiesten } from '@/hooks/useFilmmuziek';

export const FilmmuziekArtiesten = () => {
  const { data: artiesten, isLoading } = useFilmmuziekArtiesten(8);

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Iconische Componisten</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Featured composers with default info if no database entries
  const featuredComposers = [
    { name: 'John Williams', description: 'Star Wars, Jaws, E.T.', image: '/placeholder.svg' },
    { name: 'Hans Zimmer', description: 'Inception, The Dark Knight', image: '/placeholder.svg' },
    { name: 'Ennio Morricone', description: 'The Good, the Bad and the Ugly', image: '/placeholder.svg' },
    { name: 'Danny Elfman', description: 'Batman, Edward Scissorhands', image: '/placeholder.svg' },
    { name: 'James Horner', description: 'Titanic, Braveheart', image: '/placeholder.svg' },
    { name: 'Howard Shore', description: 'Lord of the Rings', image: '/placeholder.svg' },
    { name: 'Alan Silvestri', description: 'Back to the Future, Avengers', image: '/placeholder.svg' },
    { name: 'Ludwig Göransson', description: 'Black Panther, Oppenheimer', image: '/placeholder.svg' }
  ];

  const displayItems = artiesten && artiesten.length > 0 ? artiesten : featuredComposers;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">Legendarische Componisten</span>
          </div>
          <h2 className="text-3xl font-bold">Iconische Film Componisten</h2>
          <p className="text-muted-foreground mt-2">De meesters achter de meest memorabele filmscores</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayItems.map((item: any, index) => (
            <Link
              key={item.id || item.name || index}
              to={item.slug ? `/artists/${item.slug}` : `/artists?search=${encodeURIComponent(item.artist_name || item.name)}`}
              className="group"
            >
              <Card className="overflow-hidden border-transparent hover:border-amber-500/30 transition-all h-full">
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-amber-900/50 to-slate-900/80">
                  {item.artwork_url || item.image ? (
                    <img
                      src={item.artwork_url || item.image}
                      alt={item.artist_name || item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-16 h-16 text-amber-400/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-lg group-hover:text-amber-300 transition-colors">
                      {item.artist_name || item.name}
                    </h3>
                    {(item.biography || item.description) && (
                      <p className="text-white/60 text-xs mt-1 line-clamp-2">
                        {item.description || (item.biography?.substring(0, 60) + '...')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/artists?genre=soundtrack"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            Bekijk alle film componisten
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
