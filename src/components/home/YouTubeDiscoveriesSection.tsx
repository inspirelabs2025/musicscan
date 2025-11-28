import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ExternalLink, Calendar, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface YouTubeDiscovery {
  id: string;
  video_id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  published_at: string;
  view_count: number;
  content_type: string;
  quality_score: number;
}

export const YouTubeDiscoveriesSection = () => {
  const { data: discoveries, isLoading } = useQuery({
    queryKey: ['youtube-discoveries-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('youtube_discoveries')
        .select('*')
        .order('quality_score', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as YouTubeDiscovery[];
    },
  });

  if (isLoading || !discoveries || discoveries.length === 0) {
    return null;
  }

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      interview: '🎤 Interview',
      studio: '🎵 Studio Sessie',
      live_session: '🎸 Live Sessie',
      documentary: '🎬 Documentaire',
    };
    return labels[type] || '🎥 Video';
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <section className="py-12 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              🎥 YouTube Ontdekkingen
            </h2>
            <p className="text-muted-foreground">
              Unieke interviews, studio sessies en live optredens
            </p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link to="/youtube-discoveries">
              Bekijk Alles
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {discoveries.map((video) => (
            <Card key={video.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
              <a
                href={`https://www.youtube.com/watch?v=${video.video_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" fill="white" />
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-black/70 text-white backdrop-blur-sm">
                      {getContentTypeLabel(video.content_type)}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {video.channel_name}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatViewCount(video.view_count)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(video.published_at), { 
                        addSuffix: true,
                        locale: nl 
                      })}
                    </div>
                  </div>
                </div>
              </a>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link to="/youtube-discoveries">
              Bekijk Alle Video's
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
