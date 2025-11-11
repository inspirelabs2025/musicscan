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
}

interface MusicHistoryData {
  id: string;
  event_date: string;
  events: MusicHistoryEvent[];
}

export const MusicHistorySpotlight = () => {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['music-history-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('music_history_events')
        .select('*')
        .eq('event_date', today)
        .maybeSingle();

      if (error) throw error;
      return data as MusicHistoryData | null;
    }
  });

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
                <div key={index} className="border-l-2 border-primary/30 pl-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-sm font-bold ${getCategoryColor(event.category)}`}>
                      {event.year}
                    </span>
                    <h3 className="font-semibold text-foreground">{event.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
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
