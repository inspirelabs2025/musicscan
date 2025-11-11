import { useState, useMemo } from 'react';
import { useTimeMachineEvents } from '@/hooks/useTimeMachineEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Search, Calendar, MapPin, Music2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSEO } from '@/hooks/useSEO';

export default function TimeMachine() {
  const navigate = useNavigate();
  const { data: events, isLoading, error } = useTimeMachineEvents({ published: true });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  useSEO({
    title: 'Music Time Machine – Herleef Iconische Concerten | Verhalen & Posters',
    description: 'Ontdek legendarische concerten uit het verleden. Elk event komt tot leven met verhalen, setlists, archiefmateriaal en exclusieve limited edition posters.',
    keywords: 'concert posters, music history, vintage concerts, limited edition prints, concert memories, music memorabilia',
  });

  // Extract unique values for filters
  const decades = useMemo(() => {
    if (!events) return [];
    const uniqueDecades = new Set(
      events.map(e => {
        const year = new Date(e.concert_date).getFullYear();
        return Math.floor(year / 10) * 10;
      })
    );
    return Array.from(uniqueDecades).sort((a, b) => b - a);
  }, [events]);

  const venues = useMemo(() => {
    if (!events) return [];
    const uniqueVenues = new Set(events.map(e => `${e.venue_name}, ${e.venue_city}`));
    return Array.from(uniqueVenues).sort();
  }, [events]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let filtered = events.filter(event => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        event.artist_name.toLowerCase().includes(searchLower) ||
        event.event_title.toLowerCase().includes(searchLower) ||
        event.venue_name.toLowerCase().includes(searchLower) ||
        event.venue_city.toLowerCase().includes(searchLower);

      // Decade filter
      const eventYear = new Date(event.concert_date).getFullYear();
      const eventDecade = Math.floor(eventYear / 10) * 10;
      const matchesDecade = selectedDecade === 'all' || eventDecade === parseInt(selectedDecade);

      // Venue filter
      const eventVenue = `${event.venue_name}, ${event.venue_city}`;
      const matchesVenue = selectedVenue === 'all' || eventVenue === selectedVenue;

      return matchesSearch && matchesDecade && matchesVenue;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.concert_date).getTime() - new Date(a.concert_date).getTime();
        case 'date-asc':
          return new Date(a.concert_date).getTime() - new Date(b.concert_date).getTime();
        case 'artist':
          return a.artist_name.localeCompare(b.artist_name);
        case 'popular':
          return (b.views_count || 0) - (a.views_count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [events, searchQuery, selectedDecade, selectedVenue, sortBy]);

  const featuredEvents = useMemo(() => {
    return events?.filter(e => e.is_featured).slice(0, 3) || [];
  }, [events]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-16 w-96 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fout bij laden van Time Machine events: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Limited Edition Posters
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              🕰️ Music Time Machine
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Herleef legendarische concerten uit het verleden. Elk event komt tot leven met verhalen, 
              setlists, archiefmateriaal en exclusieve limited edition posters.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Featured Events</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {featuredEvents.map((event) => {
                // Determine display poster URL with fallback
                const displayPosterUrl = event.poster_source === 'original'
                  ? (event.original_poster_url || event.poster_image_url)
                  : event.poster_image_url;
                
                return (
                <Card
                  key={event.id}
                  className="overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
                  onClick={() => navigate(`/time-machine/${event.slug}`)}
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                    {displayPosterUrl ? (
                      <img
                        src={displayPosterUrl}
                        alt={event.event_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary">Featured</Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {event.event_title}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.concert_date).toLocaleDateString('nl-NL', { year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.venue_name}, {event.venue_city}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Filters & Search */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Zoek op artiest, venue, stad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Select value={selectedDecade} onValueChange={setSelectedDecade}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Decennia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Decennia</SelectItem>
                  {decades.map(decade => (
                    <SelectItem key={decade} value={decade.toString()}>
                      {decade}'s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Venues</SelectItem>
                  {venues.map(venue => (
                    <SelectItem key={venue} value={venue}>
                      {venue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sorteer op" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Nieuwste Eerst</SelectItem>
                  <SelectItem value="date-asc">Oudste Eerst</SelectItem>
                  <SelectItem value="artist">Artiest (A-Z)</SelectItem>
                  <SelectItem value="popular">Meest Populair</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDecade('all');
                  setSelectedVenue('all');
                  setSortBy('date-desc');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} gevonden
          </p>
        </motion.div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card className="p-12 text-center">
            <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Geen events gevonden</h3>
            <p className="text-muted-foreground mb-6">
              Probeer je filters aan te passen of een andere zoekterm te gebruiken
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedDecade('all');
              setSelectedVenue('all');
            }}>
              Reset Filters
            </Button>
          </Card>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
              {filteredEvents.map((event, index) => {
                // Determine display poster URL with fallback
                const displayPosterUrl = event.poster_source === 'original'
                  ? (event.original_poster_url || event.poster_image_url)
                  : event.poster_image_url;
                
                return (
              <motion.div
                key={event.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
                  onClick={() => navigate(`/time-machine/${event.slug}`)}
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                    {displayPosterUrl ? (
                      <img
                        src={displayPosterUrl}
                        alt={event.event_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    {event.is_featured && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary">Featured</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {event.event_title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                      {event.artist_name}
                    </p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(event.concert_date).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.venue_name}, {event.venue_city}</span>
                      </div>
                    </div>
                    {event.views_count !== undefined && event.views_count > 0 && (
                      <p className="text-xs text-muted-foreground mt-3">
                        {event.views_count} views
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
                );
              })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
