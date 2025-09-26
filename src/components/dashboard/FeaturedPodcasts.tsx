import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, ArrowRight } from "lucide-react";
import { EpisodeCard } from "@/components/podcast/EpisodeCard";
import { useFeaturedEpisodes } from "@/hooks/useCuratedPodcasts";
import { useNavigate } from "react-router-dom";

export const FeaturedPodcasts = () => {
  const navigate = useNavigate();
  const { data: featuredEpisodes = [], isLoading } = useFeaturedEpisodes(3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            Featured Podcasts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (featuredEpisodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            Featured Podcasts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nog geen featured podcast afleveringen beschikbaar.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => navigate('/podcasts')}
          >
            Bekijk alle podcasts
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            Featured Podcasts
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/podcasts')}
          >
            Alle podcasts
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {featuredEpisodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              showName={(episode as any).spotify_curated_shows?.name}
              compact={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};