import React from 'react';
import { Users, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useDanceHouseArtiesten } from '@/hooks/useDanceHouseMuziek';
import { Skeleton } from '@/components/ui/skeleton';

// Featured artists met Wikipedia/Wikimedia images (stabiele URLs)
const FEATURED_DANCE_ARTISTS = [
  { name: 'Tiësto', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ti%C3%ABsto_in_2023.jpg/440px-Ti%C3%ABsto_in_2023.jpg', slug: 'tiesto' },
  { name: 'Daft Punk', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Daftpunklapremiere2010.jpg/440px-Daftpunklapremiere2010.jpg', slug: 'daft-punk' },
  { name: 'Martin Garrix', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Martin_Garrix_2016.jpg/440px-Martin_Garrix_2016.jpg', slug: 'martin-garrix' },
  { name: 'Armin van Buuren', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Armin_van_Buuren_-_A_State_Of_Trance_1000_-_Festhalle_Frankfurt_-_2022-09-03_%28cropped%29.jpg/440px-Armin_van_Buuren_-_A_State_Of_Trance_1000_-_Festhalle_Frankfurt_-_2022-09-03_%28cropped%29.jpg', slug: 'armin-van-buuren' },
  { name: 'Carl Cox', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Carl_Cox_Awakenings_2018.jpg/440px-Carl_Cox_Awakenings_2018.jpg', slug: 'carl-cox' },
  { name: 'Deadmau5', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Deadmau5_2019.jpg/440px-Deadmau5_2019.jpg', slug: 'deadmau5' },
  { name: 'Calvin Harris', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Calvin_Harris_-_Rock_in_Rio_Madrid_2012_-_03.jpg/440px-Calvin_Harris_-_Rock_in_Rio_Madrid_2012_-_03.jpg', slug: 'calvin-harris' },
  { name: 'The Prodigy', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/The_Prodigy_-_Rock_am_Ring_2015-9254_%28cropped%29.jpg/440px-The_Prodigy_-_Rock_am_Ring_2015-9254_%28cropped%29.jpg', slug: 'the-prodigy' },
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=400&fit=crop';

export const DanceHouseArtiesten = () => {
  const { data: artistStories, isLoading } = useDanceHouseArtiesten(8);

  // Merge artist stories with featured artists
  const displayArtists = FEATURED_DANCE_ARTISTS.map(featured => {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 rounded-full mb-4">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm">Featured Artists</span>
          </div>
          <h2 className="text-3xl font-bold">Iconische Dance Artiesten</h2>
          <p className="text-muted-foreground mt-2">De legendes van elektronische dansmuziek</p>
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
                  <Card className="overflow-hidden bg-background/50 hover:bg-background transition-colors border-transparent hover:border-cyan-500/50">
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
                      <h3 className="font-semibold text-sm group-hover:text-cyan-400 transition-colors">
                        {artist.name}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/artists?genre=electronic"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium inline-flex items-center gap-2"
          >
            Bekijk alle dance artiesten
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
