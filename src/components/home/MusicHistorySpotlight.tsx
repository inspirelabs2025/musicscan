import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

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
  const isMobile = useIsMobile();
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['music-history-today'],
    queryFn: async () => {
      const today = new Date();
      const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log('🎵 Fetching music history for month-day:', monthDay);
      
      // First try to get events for today's date
      const { data: todayData, error: todayError } = await supabase
        .from('time_machine_events')
        .select('*')
        .eq('is_published', true)
        .like('concert_date', `%-${monthDay}`)
        .order('concert_date', { ascending: false })
        .limit(10);

      if (todayError) {
        console.error('❌ Error fetching music history:', todayError);
        throw todayError;
      }
      
      // If we have events for today, return them
      if (todayData && todayData.length > 0) {
        console.log('✅ Music history events for today:', todayData.length, 'events found');
        return { events: todayData as TimeMachineEvent[], isToday: true };
      }
      
      // Fallback: get recent/featured events
      console.log('📅 No events for today, fetching recent events');
      const { data: recentData, error: recentError } = await supabase
        .from('time_machine_events')
        .select('*')
        .eq('is_published', true)
        .order('concert_date', { ascending: false })
        .limit(6);

      if (recentError) {
        console.error('❌ Error fetching recent music history:', recentError);
        throw recentError;
      }
      
      console.log('✅ Recent music history events:', recentData?.length || 0, 'events found');
      return { events: recentData as TimeMachineEvent[] || [], isToday: false };
    }
  });

  const eventList = events?.events || [];
  const isToday = events?.isToday ?? false;
  
  console.log('MusicHistorySpotlight render:', { isLoading, hasData: eventList.length > 0, isToday, error });

  if (isLoading || eventList.length === 0) {
    return null;
  }

  const previewEvents = isMobile ? eventList.slice(0, 4) : eventList.slice(0, 2);
  const totalEvents = eventList.length;
  const sectionTitle = isToday ? 'Vandaag in de Muziekgeschiedenis' : 'Muziekgeschiedenis Highlights';

  // Mobile compact version with slider
  if (isMobile) {
    return (
      <section className="py-6">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{sectionTitle}</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 px-2"
              onClick={() => window.location.href = '/vandaag-in-de-muziekgeschiedenis'}
            >
              Meer
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Slider */}
          <Carousel opts={{ align: "start", loop: false }}>
            <CarouselContent className="-ml-2">
              {previewEvents.map((event) => (
                <CarouselItem key={event.id} className="pl-2 basis-[75%]">
                  <Card 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => window.location.href = `/vandaag-in-de-muziekgeschiedenis/${event.slug}`}
                  >
                    <div className="aspect-[16/10] relative bg-gradient-to-br from-purple-500 to-pink-500">
                      {event.poster_image_url && (
                        <img 
                          src={event.poster_image_url} 
                          alt={event.event_title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {new Date(event.concert_date).getFullYear()}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm line-clamp-1">{event.event_title}</h3>
                      {event.artist_name && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{event.artist_name}</p>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>
    );
  }

  // Desktop version
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">{sectionTitle}</h2>
        <p className="text-muted-foreground">
          {isToday ? 'Ontdek iconische concerten die op deze dag plaatsvonden' : 'Ontdek iconische concerten uit de muziekgeschiedenis'}
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
