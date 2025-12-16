import React from 'react';
import { Users, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useFilmmuziekArtiesten } from '@/hooks/useFilmmuziek';
import { Skeleton } from '@/components/ui/skeleton';

// Featured composers met Discogs CDN images (betrouwbaar)
const FEATURED_FILM_COMPOSERS = [
  { name: 'John Williams', image: 'https://i.discogs.com/JdUz6z3qH8wQ0RzEXM9vw-q4n08=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-253821-1616971570-5650.jpeg.jpg', slug: 'john-williams' },
  { name: 'Hans Zimmer', image: 'https://i.discogs.com/qFe8TmHZz-hBcqLLPHGGGsH0Rw8=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-354021-1445894839-1556.jpeg.jpg', slug: 'hans-zimmer' },
  { name: 'Ennio Morricone', image: 'https://i.discogs.com/kf_vFz4ZO0z6h_gOt6eDQQJVxZY=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-160257-1394548211-4561.jpeg.jpg', slug: 'ennio-morricone' },
  { name: 'Danny Elfman', image: 'https://i.discogs.com/L9mCLQQu0mZkB3l9jJxnvf4nGGw=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-89418-1322497393.jpeg.jpg', slug: 'danny-elfman' },
  { name: 'Howard Shore', image: 'https://i.discogs.com/Y0oFsAVrZn3G-Bg9r3YL4H3gIqI=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-251596-1381770437-4153.jpeg.jpg', slug: 'howard-shore' },
  { name: 'Alan Silvestri', image: 'https://i.discogs.com/CuG1IYR_qPZJgmkl6tHl8gTqj5A=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-254037-1315923594.jpeg.jpg', slug: 'alan-silvestri' },
  { name: 'James Horner', image: 'https://i.discogs.com/G_u5gGKjKdXWz3rTuqKJPG0Y6zE=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-251595-1392051679-5459.jpeg.jpg', slug: 'james-horner' },
  { name: 'Thomas Newman', image: 'https://i.discogs.com/lkz0J3bq5M3HUEBBXv4wGO_V6Ks=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/A-266889-1379508012-5587.jpeg.jpg', slug: 'thomas-newman' },
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop';

export const FilmmuziekArtiesten = () => {
  const { data: artistStories, isLoading } = useFilmmuziekArtiesten(8);

  // Merge artist stories with featured artists
  const displayArtists = FEATURED_FILM_COMPOSERS.map(featured => {
    const story = artistStories?.find(s => 
      s.artist_name.toLowerCase().includes(featured.name.toLowerCase()) ||
      featured.name.toLowerCase().includes(s.artist_name.toLowerCase())
    );
    return {
      ...featured,
      hasStory: !!story,
      storySlug: story?.slug || featured.slug
    };
  });

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full mb-4">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm">Legendes</span>
          </div>
          <h2 className="text-3xl font-bold">Iconische Filmcomponisten</h2>
          <p className="text-muted-foreground mt-2">De meesters achter de grootste soundtracks</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? [...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <CardContent className="p-3">
                    <Skeleton className="h-5 w-24" />
                  </CardContent>
                </Card>
              ))
            : displayArtists.map((artist) => (
                <Link
                  key={artist.name}
                  to={artist.hasStory ? `/artists/${artist.storySlug}` : `/artists?search=${encodeURIComponent(artist.name)}`}
                  className="group"
                >
                  <Card className="overflow-hidden bg-background/50 hover:bg-background transition-colors border-transparent hover:border-amber-500/50">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-3 text-center">
                      <h3 className="font-semibold text-sm group-hover:text-amber-400 transition-colors">
                        {artist.name}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/artists?genre=soundtrack"
            className="text-amber-400 hover:text-amber-300 text-sm font-medium inline-flex items-center gap-2"
          >
            Bekijk alle filmcomponisten
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
