import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Calendar, Star, StarOff } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';

interface RSSEpisode {
  id: string;
  title: string;
  description?: string;
  audio_url: string;
  duration_seconds?: number;
  published_date?: string;
  episode_number?: number;
  season_number?: number;
  is_featured: boolean;
  show_name?: string;
  show_id: string;
}

interface RSSEpisodeCardProps {
  episode: RSSEpisode;
  showName?: string;
  compact?: boolean;
  showActions?: boolean;
  onToggleFeatured?: (episodeId: string) => void;
}

export const RSSEpisodeCard: React.FC<RSSEpisodeCardProps> = ({
  episode,
  showName,
  compact = false,
  showActions = false,
  onToggleFeatured
}) => {
  const { setQueue, currentTrack, isPlaying } = useAudio();

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePlay = () => {
    const audioTrack = {
      id: episode.id,
      title: episode.title,
      artist: showName || episode.show_name || 'Unknown Podcast',
      url: episode.audio_url,
      duration: episode.duration_seconds,
    };

    setQueue([audioTrack]);
  };

  const isCurrentTrack = currentTrack?.id === episode.id;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                {episode.title}
              </h3>
              {episode.is_featured && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  Uitgelicht
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {showName && (
                <span className="font-medium">{showName}</span>
              )}
              {episode.published_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(episode.published_date)}</span>
                </div>
              )}
              {episode.duration_seconds && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(episode.duration_seconds)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={isCurrentTrack && isPlaying ? "default" : "outline"}
              onClick={handlePlay}
              className="w-8 h-8 p-0"
            >
              <Play className="w-3 h-3" />
            </Button>

            {showActions && onToggleFeatured && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleFeatured(episode.id)}
                className="w-8 h-8 p-0"
              >
                {episode.is_featured ? (
                  <Star className="w-3 h-3 fill-current" />
                ) : (
                  <StarOff className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!compact && episode.description && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {episode.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};