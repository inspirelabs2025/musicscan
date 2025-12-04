import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Mic, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useOwnPodcasts, useOwnPodcastEpisodes } from '@/hooks/useOwnPodcasts';
import { Slider } from '@/components/ui/slider';

interface OwnPodcastEpisodePlayerProps {
  episode: {
    id: string;
    title: string;
    description: string | null;
    audio_url: string;
    audio_duration_seconds: number | null;
    episode_number: number;
    season_number: number;
    published_at: string | null;
  };
  podcastName: string;
}

function OwnPodcastEpisodePlayer({ episode, podcastName }: OwnPodcastEpisodePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={episode.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />

        <div className="flex items-start gap-4">
          <Button
            size="icon"
            variant={isPlaying ? "default" : "outline"}
            className="w-12 h-12 rounded-full flex-shrink-0"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-1">{episode.title}</h4>
            <p className="text-xs text-muted-foreground">
              S{episode.season_number}E{episode.episode_number}
            </p>
            {episode.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {episode.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
            disabled={!isLoaded}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || episode.audio_duration_seconds || 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
  const [expanded, setExpanded] = useState(false);
  const { data: episodes = [] } = useOwnPodcastEpisodes(expanded ? podcast.id : null);
  
  const publishedEpisodes = episodes.filter(ep => ep.is_published);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-4">
          {podcast.artwork_url ? (
            <img
              src={podcast.artwork_url}
              alt={podcast.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center">
              <Mic className="w-8 h-8 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{podcast.name}</CardTitle>
            {podcast.author && (
              <p className="text-sm text-muted-foreground">door {podcast.author}</p>
            )}
            <Badge variant="secondary" className="mt-1">
              MusicScan Original
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {podcast.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {podcast.description}
          </p>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Afleveringen verbergen
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              Bekijk afleveringen
            </>
          )}
        </Button>

        {expanded && (
          <div className="mt-4 space-y-3">
            {publishedEpisodes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nog geen afleveringen beschikbaar.
              </p>
            ) : (
              publishedEpisodes.map((episode) => (
                <OwnPodcastEpisodePlayer
                  key={episode.id}
                  episode={episode}
                  podcastName={podcast.name}
                />
              ))
            )}
          </div>
        )}
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
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-lg"></div>
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
      <div className="grid gap-4 md:grid-cols-2">
        {publishedPodcasts.map((podcast) => (
          <OwnPodcastCard key={podcast.id} podcast={podcast} />
        ))}
      </div>
    </div>
  );
}
