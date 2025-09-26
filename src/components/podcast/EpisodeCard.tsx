import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Clock, Calendar, Star } from "lucide-react";
import { ShowEpisode } from "@/hooks/useCuratedPodcasts";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface EpisodeCardProps {
  episode: ShowEpisode;
  showName?: string;
  compact?: boolean;
}

export const EpisodeCard = ({ episode, showName, compact = false }: EpisodeCardProps) => {
  const formatDuration = (ms: number | null) => {
    if (!ms) return null;
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}u ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const releaseDate = episode.release_date ? new Date(episode.release_date) : null;

  return (
    <Card className={`h-full hover:shadow-md transition-shadow ${compact ? 'border-l-4 border-l-primary' : ''}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold leading-tight ${compact ? 'text-sm' : 'text-base'} line-clamp-2`}>
              {episode.name}
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
            
            {episode.duration_ms && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(episode.duration_ms)}
              </span>
            )}
          </div>
          
          {!compact && episode.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {episode.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            {episode.spotify_url && (
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
            
            {episode.audio_preview_url && (
              <Button
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() => {
                  const audio = new Audio(episode.audio_preview_url!);
                  audio.play();
                }}
              >
                <PlayCircle className="w-3 h-3 mr-1" />
                Preview
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};