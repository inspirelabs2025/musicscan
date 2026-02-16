import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useLanguage } from '@/contexts/LanguageContext';

interface MusicHistoryEvent { title: string; description: string; year: number; category: string; artist?: string; source?: string; }

export const MusicHistorySpotlight = () => {
  const isMobile = useIsMobile();
  const { tr } = useLanguage();
  const h = tr.homeUI;

  const { data: events, isLoading } = useQuery({
    queryKey: ['music-history-today'],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase.from('music_history_events').select('*').eq('day_of_month', today.getDate()).eq('month_of_year', today.getMonth() + 1).maybeSingle();
      if (error) throw error;
      if (data && data.events) return { events: data.events as MusicHistoryEvent[], isToday: true };
      const { data: recentData, error: recentError } = await supabase.from('music_history_events').select('*').order('event_date', { ascending: false }).limit(1).maybeSingle();
      if (recentError) throw recentError;
      return { events: (recentData?.events as MusicHistoryEvent[]) || [], isToday: false };
    }
  });

  const eventList = events?.events || [];
  const isToday = events?.isToday ?? false;
  if (isLoading || eventList.length === 0) return null;

  const previewEvents = isMobile ? eventList.slice(0, 4) : eventList.slice(0, 2);
  const totalEvents = eventList.length;
  const sectionTitle = isToday ? h.todayInHistory : h.historyHighlights;

  if (isMobile) {
    return (
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /><h2 className="text-lg font-bold">{sectionTitle}</h2></div>
            <Button variant="ghost" size="sm" className="text-xs gap-1 px-2" onClick={() => window.location.href = '/vandaag-in-de-muziekgeschiedenis'}>{h.more}<ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Carousel opts={{ align: "start", loop: false }}>
            <CarouselContent className="-ml-2">
              {previewEvents.map((event, index) => (
                <CarouselItem key={`${event.year}-${index}`} className="pl-2 basis-[75%]">
                  <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/vandaag-in-de-muziekgeschiedenis'}>
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
                      <div className="flex items-start justify-between mb-2"><Badge variant="secondary" className="text-xs">{event.year}</Badge><Badge variant="outline" className="text-xs capitalize">{event.category}</Badge></div>
                      <h3 className="font-bold text-sm line-clamp-2 mb-1">{event.title}</h3>
                      {event.artist && <p className="text-xs text-muted-foreground line-clamp-1">{event.artist}</p>}
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{event.description}</p>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">{sectionTitle}</h2>
        <p className="text-muted-foreground">{isToday ? h.todayHistoryDesc : h.historyHighlightsDesc}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {previewEvents.map((event, index) => (
          <Card key={`${event.year}-${index}`} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3"><div className="flex gap-2"><Badge variant="default" className="text-sm font-bold">{event.year}</Badge><Badge variant="outline" className="text-xs capitalize">{event.category}</Badge></div></div>
              <h3 className="text-xl font-bold mb-2">{event.title}</h3>
              {event.artist && <p className="text-sm text-primary mb-2">{event.artist}</p>}
              <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {totalEvents > 2 && (
        <div className="text-center">
          <Button variant="default" size="lg" onClick={() => window.location.href = '/vandaag-in-de-muziekgeschiedenis'}>{h.viewAllEvents.replace('{count}', String(totalEvents))}</Button>
        </div>
      )}
    </section>
  );
};
