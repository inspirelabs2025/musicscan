import React from 'react';
import { Users, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useDanceHouseArtiesten } from '@/hooks/useDanceHouseMuziek';
import { Skeleton } from '@/components/ui/skeleton';

// Featured artists met fallback images
const FEATURED_DANCE_ARTISTS = [
  { name: 'Tiësto', image: 'https://i.discogs.com/qDLpJHqFqMYWnTJ8ukAk3LKnJCuDT3YRIJJLm7RLYy0/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTEwMDUw/LTE2NzA5NTQ5NDYt/Njc1MS5qcGVn.jpeg', slug: 'tiesto' },
  { name: 'Daft Punk', image: 'https://i.discogs.com/4bPnKYvbZp_QO8xGl7_y9vNiMX0nBGG4U-IQN1qKCBU/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTE3ODkw/LTE2NzIzMTMwNTQt/MjI3NS5qcGVn.jpeg', slug: 'daft-punk' },
  { name: 'Martin Garrix', image: 'https://i.discogs.com/fIwNbXCNzPLF_ckHvfqMFQB8YHRV6yrfqVdK0U5c7rw/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTM0MzM2/ODEtMTU3NTkwNTkx/OS03NTcyLmpwZWc.jpeg', slug: 'martin-garrix' },
  { name: 'Armin van Buuren', image: 'https://i.discogs.com/nf5R6OI-QOF2sNEOvfJxLkLfVNJFAO-T5KvBXm1Bz1k/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTUyNDkt/MTY1NjE2MTc5MS00/MzMxLmpwZWc.jpeg', slug: 'armin-van-buuren' },
  { name: 'Carl Cox', image: 'https://i.discogs.com/UT3rnFZGBHxj-I4fxbR6FeGk3TQq_oZ_3W9Qe9Uo0JQ/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTIwOTg5/LTE2NjY3MTAxMDMt/OTYyNi5qcGVn.jpeg', slug: 'carl-cox' },
  { name: 'Deadmau5', image: 'https://i.discogs.com/TfGPqpxvwvAMqmh9_Tz8YGKf9P-RqLSrLCrJyTSqHpw/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTEyMDkx/NTMtMTYwOTYwMDUw/Ni00OTg1LmpwZWc.jpeg', slug: 'deadmau5' },
  { name: 'Calvin Harris', image: 'https://i.discogs.com/x5pZQF2lFSJrQJJIw8VfGXgKVT8l-R8rz6A6p6IaZCY/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTU3MzQz/OC0xNjMxNzkwNjY2/LTk5MjMuanBlZw.jpeg', slug: 'calvin-harris' },
  { name: 'The Prodigy', image: 'https://i.discogs.com/qIZN-7N_bHqfJLSMlEKrY3k7mJX0dPKKmVmGMQwKQTI/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9BLTQxNzQt/MTY2MTI2NjA3OS0y/MDU5LmpwZWc.jpeg', slug: 'the-prodigy' },
];

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
