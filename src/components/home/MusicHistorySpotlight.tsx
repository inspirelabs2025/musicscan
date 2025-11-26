import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TimeMachineEvent {
  id: string;
  event_title: string;
  event_subtitle: string | null;
  slug: string;
  artist_name: string;
  venue_name: string | null;
  venue_city: string | null;
  venue_country: string | null;
  concert_date: string;
  historical_context: string | null;
  cultural_significance: string | null;
  poster_image_url: string | null;
}

export const MusicHistorySpotlight = () => {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['music-history-today'],
    queryFn: async () => {
      const today = new Date();
      const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log('🎵 Fetching music history for month-day:', monthDay);
      
      const { data, error } = await supabase
        .from('time_machine_events')
        .select('*')
        .eq('is_published', true)
        .like('concert_date', `%-${monthDay}`)
        .order('concert_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching music history:', error);
        throw error;
      }
      
      console.log('✅ Music history events:', data?.length || 0, 'events found');
      return data as TimeMachineEvent[] || [];
    }
  });

  console.log('MusicHistorySpotlight render:', { isLoading, hasData: !!events && events.length > 0, error });

  if (isLoading || !events || events.length === 0) {
    return null;
  }

  // Get the first 2 events for the homepage preview
  const previewEvents = events.slice(0, 2);
  const totalEvents = events.length;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Vandaag in de Muziekgeschiedenis</h2>
        <p className="text-muted-foreground">
          Ontdek iconische concerten die op deze dag plaatsvonden
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {previewEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative bg-gradient-to-br from-purple-500 to-pink-500">
              {event.poster_image_url && (
                <img 
                  src={event.poster_image_url} 
                  alt={event.event_title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{event.event_title}</h3>
                  {event.artist_name && (
                    <p className="text-sm text-muted-foreground mb-2">{event.artist_name}</p>
                  )}
                </div>
                <Badge variant="secondary">
                  {new Date(event.concert_date).getFullYear()}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {event.event_subtitle || event.historical_context}
              </p>

              {event.venue_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue_name}, {event.venue_city}</span>
                </div>
              )}

              {event.cultural_significance && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span className="line-clamp-1">{event.cultural_significance}</span>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = `/vandaag-in-de-muziekgeschiedenis/${event.slug}`}
              >
                Lees Meer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalEvents > 2 && (
        <div className="text-center">
          <Button 
            variant="default" 
            size="lg"
            onClick={() => window.location.href = '/vandaag-in-de-muziekgeschiedenis'}
          >
            Bekijk Alle {totalEvents} Evenementen van Vandaag
          </Button>
        </div>
      )}
    </section>
  );
};
