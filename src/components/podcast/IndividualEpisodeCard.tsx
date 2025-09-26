import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play, Star, StarOff } from "lucide-react";
import { IndividualEpisode } from "@/hooks/useIndividualEpisodes";
import { useAudio } from "@/contexts/AudioContext";

interface IndividualEpisodeCardProps {
  episode: IndividualEpisode;
  onToggleFeatured?: (episodeId: string) => void;
  onRemove?: (episodeId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const IndividualEpisodeCard = ({ 
  episode, 
  onToggleFeatured, 
  onRemove, 
  showActions = false,
  compact = false 
}: IndividualEpisodeCardProps) => {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className={compact ? "p-3" : ""}>
      <CardContent className={compact ? "p-0" : "pt-6"}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold leading-tight ${compact ? 'text-sm' : 'text-base'}`}>
                {episode.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {episode.show_name}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {episode.is_featured && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {episode.category}
              </Badge>
            </div>
          </div>

          {/* Episode details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {episode.release_date && (
              <span>{formatDate(episode.release_date)}</span>
            )}
            {episode.duration_ms && (
              <span>{formatDuration(episode.duration_ms)}</span>
            )}
          </div>

          {/* Description */}
          {!compact && episode.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {episode.description}
            </p>
          )}

          {/* Curator notes */}
          {!compact && episode.curator_notes && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium mb-1">Curator notities:</p>
              <p className="text-sm text-muted-foreground">{episode.curator_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(episode.spotify_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Beluister op Spotify
            </Button>
            
            {episode.audio_preview_url && (
              <Button
                size="sm"
                variant={currentTrack?.id === episode.id && isPlaying ? "default" : "outline"}
                onClick={() => {
                  playTrack({
                    id: episode.id,
                    title: episode.name,
                    artist: episode.show_name,
                    url: episode.audio_preview_url!,
                    duration: episode.duration_ms ? episode.duration_ms / 1000 : undefined,
                  });
                }}
              >
                <Play className="w-4 h-4 mr-1" />
                {currentTrack?.id === episode.id && isPlaying ? 'Playing' : 'Play'}
              </Button>
            )}

            {showActions && onToggleFeatured && (
              <Button
                size="sm"
                variant={episode.is_featured ? "default" : "outline"}
                onClick={() => onToggleFeatured(episode.id)}
              >
                {episode.is_featured ? (
                  <StarOff className="w-4 h-4 mr-1" />
                ) : (
                  <Star className="w-4 h-4 mr-1" />
                )}
                {episode.is_featured ? 'Unfeatured' : 'Featured'}
              </Button>
            )}

            {showActions && onRemove && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemove(episode.id)}
              >
                Verwijder
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};