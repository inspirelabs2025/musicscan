import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Calendar, Music, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import { useState } from "react";

interface MusicHistoryEvent {
  year: number;
  title: string;
  description: string;
  category: string;
  source?: 'discogs' | 'perplexity' | 'ai';
  image_url?: string;
  artist?: string;
  discogs_release_id?: number;
  metadata?: {
    label?: string;
    catalog_number?: string;
    format?: string;
  };
}

interface MusicHistoryData {
  id: string;
  event_date: string;
  day_of_month: number;
  month_of_year: number;
  events: MusicHistoryEvent[];
  generated_at: string;
}

const MusicHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<string>(
    dateParam || new Date().toISOString().split('T')[0]
  );

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['music-history', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_history_events')
        .select('*')
        .eq('event_date', selectedDate)
        .maybeSingle();

      if (error) throw error;
      return data as MusicHistoryData | null;
    }
  });

  // Query for available dates (for archive navigation)
  const { data: availableDates } = useQuery({
    queryKey: ['music-history-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_history_events')
        .select('event_date')
        .order('event_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data.map(d => d.event_date);
    }
  });

  const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                      'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  
  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      release: 'Release',
      concert: 'Concert',
      milestone: 'Mijlpaal',
      birth: 'Geboorte',
      death: 'Overlijden',
      event: 'Gebeurtenis'
    };
    return labels[category] || category;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (!availableDates) return;
    
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex === -1) return;

    let newDate: string | undefined;
    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      newDate = availableDates[currentIndex + 1];
    } else if (direction === 'next' && currentIndex > 0) {
      newDate = availableDates[currentIndex - 1];
    }

    if (newDate) {
      setSelectedDate(newDate);
      setSearchParams({ date: newDate });
    }
  };

  const canNavigatePrev = availableDates && availableDates.indexOf(selectedDate) < availableDates.length - 1;
  const canNavigateNext = availableDates && availableDates.indexOf(selectedDate) > 0;

  return (
    <>
      <Helmet>
        <title>Vandaag in de Muziekgeschiedenis - Muzikale Mijlpalen</title>
        <meta 
          name="description" 
          content="Ontdek wat er op deze dag in de muziekgeschiedenis gebeurde. Van legendarische releases tot iconische concerten en belangrijke mijlpalen." 
        />
      </Helmet>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug naar home
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">
                Vandaag in de Muziekgeschiedenis
              </h1>
            </div>
            
            <p className="text-muted-foreground">
              Ontdek wat er op deze dag in de muziekgeschiedenis gebeurde
            </p>
          </div>

          {/* Date Navigation */}
          {availableDates && availableDates.length > 1 && (
            <div className="flex items-center justify-between mb-6 gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
                disabled={!canNavigatePrev}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Vorige dag
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Bekijk datum</p>
                <p className="font-semibold">{getFormattedDate(selectedDate)}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
                disabled={!canNavigateNext}
                className="gap-2"
              >
                Volgende dag
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </Card>
          ) : !historyData || !historyData.events || historyData.events.length === 0 ? (
            <Card className="p-8 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Geen gebeurtenissen gevonden</h2>
              <p className="text-muted-foreground">
                Er zijn nog geen muziekgeschiedenis gebeurtenissen voor deze datum.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                <Music className="h-4 w-4" />
                <span className="font-medium">
                  {getFormattedDate(historyData.event_date)}
                </span>
                <span className="text-xs">• {historyData.events.length} gebeurtenissen</span>
              </div>

              <div className="space-y-6">
                {historyData.events.map((event, index) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start gap-4">
                      {/* Album Cover (if available) */}
                      {event.image_url && (
                        <div className="flex-shrink-0">
                          <img 
                            src={event.image_url} 
                            alt={event.title}
                            className="w-24 h-24 rounded-lg object-cover shadow-md"
                          />
                        </div>
                      )}

                      <div className="flex-shrink-0">
                        <div className={`text-3xl font-bold ${getCategoryColor(event.category)}`}>
                          {event.year}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 text-center">
                          {getCategoryLabel(event.category)}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 text-foreground">
                          {event.title}
                        </h3>
                        {event.artist && (
                          <p className="text-sm text-primary font-medium mb-1">
                            {event.artist}
                          </p>
                        )}
                        <p className="text-muted-foreground leading-relaxed">
                          {event.description}
                        </p>
                        {event.metadata && (
                          <div className="mt-3 text-xs text-muted-foreground space-y-1">
                            {event.metadata.label && <div>Label: {event.metadata.label}</div>}
                            {event.metadata.catalog_number && <div>Cat#: {event.metadata.catalog_number}</div>}
                            {event.metadata.format && <div>Format: {event.metadata.format}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Archive hint */}
              {availableDates && availableDates.length > 1 && (
                <Card className="mt-8 p-6 bg-muted/50">
                  <h3 className="font-semibold mb-2">Archief</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Bekijk gebeurtenissen van andere dagen
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableDates.slice(0, 10).map((date) => (
                      <Button
                        key={date}
                        variant={date === selectedDate ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedDate(date);
                          setSearchParams({ date });
                        }}
                      >
                        {new Date(date).getDate()} {monthNames[new Date(date).getMonth()]}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MusicHistory;
