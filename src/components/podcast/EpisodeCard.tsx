import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Clock, Calendar, Star, Play } from "lucide-react";
import { ShowEpisode, RSSEpisode } from "@/hooks/useCuratedPodcasts";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { useAudio } from "@/contexts/AudioContext";

interface EpisodeCardProps {
  episode: ShowEpisode | RSSEpisode;
  showName?: string;
  compact?: boolean;
}

const isRSSEpisode = (episode: ShowEpisode | RSSEpisode): episode is RSSEpisode => {
  return 'title' in episode && 'audio_url' in episode;
};

export const EpisodeCard = ({ episode, showName, compact = false }: EpisodeCardProps) => {
  const { play, pause, currentTrack, isPlaying, setQueue } = useAudio();

  const handlePlay = () => {
    if (isRSSEpisode(episode)) {
      // RSS episode
      const audioTrack = {
        id: episode.id,
        title: episode.title,
        artist: showName || episode.show_name || 'Unknown Podcast',
        url: episode.audio_url,
        duration: episode.duration_seconds,
      };
      setQueue([audioTrack]);
    } else {
      // Spotify episode
      if (episode.audio_preview_url) {
        const audioTrack = {
          id: episode.id,
          title: episode.name,
          artist: showName || 'Unknown Podcast',
          url: episode.audio_preview_url,
          duration: episode.duration_ms ? Math.floor(episode.duration_ms / 1000) : undefined,
        };
        setQueue([audioTrack]);
      }
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return null;
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}u ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDurationSeconds = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getReleaseDate = () => {
    if (isRSSEpisode(episode)) {
      return episode.published_date ? new Date(episode.published_date) : null;
    } else {
      return episode.release_date ? new Date(episode.release_date) : null;
    }
  };

  const getTitle = () => {
    return isRSSEpisode(episode) ? episode.title : episode.name;
  };

  const getDuration = () => {
    if (isRSSEpisode(episode)) {
      return episode.duration_seconds ? formatDurationSeconds(episode.duration_seconds) : '';
    } else {
      return episode.duration_ms ? formatDuration(episode.duration_ms) : '';
    }
  };

  const getAudioUrl = () => {
    return isRSSEpisode(episode) ? episode.audio_url : episode.audio_preview_url;
  };

  const releaseDate = getReleaseDate();
  const hasAudio = !!getAudioUrl();

  return (
    <Card className={`h-full hover:shadow-md transition-shadow ${compact ? 'border-l-4 border-l-primary' : ''}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold leading-tight ${compact ? 'text-sm' : 'text-base'} line-clamp-2`}>
              {getTitle()}
            </h3>
            {episode.is_featured && (
              <Badge variant="default" className="shrink-0">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          
          {showName && (
            <p className="text-xs text-muted-foreground font-medium">
              {showName}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {releaseDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(releaseDate, { 
                  addSuffix: true, 
                  locale: nl 
                })}
              </span>
            )}
            
            {getDuration() && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getDuration()}
              </span>
            )}
          </div>
          
          {!compact && episode.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {episode.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            {!isRSSEpisode(episode) && episode.spotify_url && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => window.open(episode.spotify_url!, '_blank')}
              >
                <PlayCircle className="w-3 h-3 mr-1" />
                Beluister op Spotify
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlay}
              disabled={!hasAudio}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRSSEpisode(episode) ? 'Afspelen' : 
               (episode.audio_preview_url ? 'Preview afspelen' : 'Geen audio')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};