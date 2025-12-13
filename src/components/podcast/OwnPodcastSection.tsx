import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, ChevronRight, Headphones } from 'lucide-react';
import { useOwnPodcasts, useOwnPodcastEpisodes } from '@/hooks/useOwnPodcasts';

interface OwnPodcastCardProps {
  podcast: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    artwork_url: string | null;
    author: string | null;
  };
}

function OwnPodcastCard({ podcast }: OwnPodcastCardProps) {
  const { data: episodes = [] } = useOwnPodcastEpisodes(podcast.id);
  const publishedEpisodes = episodes.filter(ep => ep.is_published);

  // Use dedicated page for "de-plaat-en-het-verhaal", otherwise generic podcast route
  const podcastUrl = podcast.slug === 'de-plaat-en-het-verhaal' 
    ? '/de-plaat-en-het-verhaal' 
    : `/podcast/${podcast.slug}`;

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all">
      <Link to={podcastUrl}>
        <div className="relative aspect-square overflow-hidden">
          {podcast.artwork_url ? (
            <img
              src={podcast.artwork_url}
              alt={podcast.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center">
              <Mic className="w-20 h-20 text-primary-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground border-0 mb-2">
              MusicScan Original
            </Badge>
            <h3 className="text-xl font-bold text-white mb-1">{podcast.name}</h3>
            {podcast.author && (
              <p className="text-sm text-white/80">door {podcast.author}</p>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        {podcast.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {podcast.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Headphones className="w-4 h-4" />
            {publishedEpisodes.length} aflevering{publishedEpisodes.length !== 1 ? 'en' : ''}
          </span>
          <Link to={podcastUrl}>
            <Button variant="ghost" size="sm" className="gap-1 group-hover:text-primary">
              Bekijk podcast
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function OwnPodcastSection() {
  const { data: podcasts = [], isLoading } = useOwnPodcasts();
  
  // Only show published podcasts
  const publishedPodcasts = podcasts.filter(p => p.is_published);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6" />
          MusicScan Originals
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="h-20 bg-muted rounded-lg mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (publishedPodcasts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Mic className="w-6 h-6 text-primary" />
        MusicScan Originals
      </h2>
      <p className="text-muted-foreground">
        Exclusieve podcasts gemaakt door MusicScan over muziek, vinyl en de verhalen erachter.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {publishedPodcasts.map((podcast) => (
          <OwnPodcastCard key={podcast.id} podcast={podcast} />
        ))}
      </div>
    </div>
  );
}
