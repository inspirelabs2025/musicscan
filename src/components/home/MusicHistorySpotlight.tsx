import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Calendar, Music } from "lucide-react";
import { Link } from "react-router-dom";

interface MusicHistoryEvent {
  year: number;
  title: string;
  description: string;
  category: string;
  source?: 'discogs' | 'perplexity' | 'ai';
  image_url?: string;
  artist?: string;
}

interface MusicHistoryData {
  id: string;
  event_date: string;
  events: MusicHistoryEvent[];
}

export const MusicHistorySpotlight = () => {
  const { data: historyData, isLoading, error } = useQuery({
    queryKey: ['music-history-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      console.log('🎵 Fetching music history for date:', today);
      
      const { data, error } = await supabase
        .from('music_history_events')
        .select('*')
        .eq('event_date', today)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching music history:', error);
        throw error;
      }
      
      console.log('✅ Music history data:', data);
      return data as MusicHistoryData | null;
    }
  });

  console.log('MusicHistorySpotlight render:', { isLoading, hasData: !!historyData, error });

  if (isLoading || !historyData || !historyData.events || historyData.events.length === 0) {
    return null;
  }

  // Get the first 2 events for the homepage preview
  const previewEvents = historyData.events.slice(0, 2);
  const totalEvents = historyData.events.length;

  const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                      'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const date = new Date(historyData.event_date);
  const formattedDate = `${date.getDate()} ${monthNames[date.getMonth()]}`;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      release: 'text-primary',
      concert: 'text-accent',
      milestone: 'text-secondary',
      birth: 'text-green-600',
      death: 'text-muted-foreground',
      event: 'text-blue-600'
    };
    return colors[category] || 'text-foreground';
  };

  return (
    <section className="py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <Link to="/vandaag-in-de-muziekgeschiedenis" className="block group">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold">
              Vandaag in de Muziekgeschiedenis
            </h2>
          </div>
          
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <Music className="h-4 w-4" />
              <span className="font-medium">{formattedDate}</span>
              <span className="text-xs">• {totalEvents} gebeurtenissen</span>
            </div>

            <div className="space-y-4">
              {previewEvents.map((event, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-background/50">
                  {event.image_url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-16 h-16 rounded-md object-cover shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex-shrink-0">
                    <div className={`text-2xl font-bold ${getCategoryColor(event.category)}`}>
                      {event.year}
                    </div>
                    {event.source === 'discogs' && (
                      <div className="text-xs text-primary mt-1">🎵</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                      {event.title}
                    </h4>
                    {event.artist && (
                      <p className="text-xs text-primary font-medium mb-1">
                        {event.artist}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {totalEvents > 2 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-primary font-medium group-hover:underline">
                  Bekijk alle {totalEvents} gebeurtenissen →
                </p>
              </div>
            )}
          </Card>
        </Link>
      </div>
    </section>
  );
};
