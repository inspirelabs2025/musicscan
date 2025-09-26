import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, PlayCircle, Users } from "lucide-react";
import { CuratedShow } from "@/hooks/useCuratedPodcasts";

interface PodcastCardProps {
  show: CuratedShow;
  showDescription?: boolean;
  onViewEpisodes?: (show: CuratedShow) => void;
}

export const PodcastCard = ({ 
  show, 
  showDescription = true, 
  onViewEpisodes 
}: PodcastCardProps) => {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {show.image_url && (
            <div className="flex-shrink-0">
              <img
                src={show.image_url}
                alt={show.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-tight truncate">
                {show.name}
              </h3>
              <Badge variant="secondary" className="text-xs shrink-0">
                {show.category}
              </Badge>
            </div>
            
            {show.publisher && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {show.publisher}
              </p>
            )}
            
            {showDescription && show.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {show.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              {show.spotify_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => window.open(show.spotify_url!, '_blank')}
                >
                  <PlayCircle className="w-3 h-3 mr-1" />
                  Spotify
                </Button>
              )}
              
              {onViewEpisodes && (
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs"
                  onClick={() => onViewEpisodes(show)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Afleveringen
                </Button>
              )}
              
              <span className="text-xs text-muted-foreground ml-auto">
                {show.total_episodes} afleveringen
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};