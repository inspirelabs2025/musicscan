import React from 'react';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Music2, 
  Users, 
  TrendingUp, 
  Globe, 
  Calendar,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface KeyInsight {
  insight: string;
  category: string;
  importance: number;
}

interface CanonTrack {
  artist: string;
  title: string;
  classification: string;
  avg_position: number;
  years_present: number;
  trend: string;
}

interface DominantArtist {
  artist: string;
  total_entries: number;
  unique_songs: number;
  best_position: number;
  status: string;
}

interface GenreShift {
  genre: string;
  trend: string;
  peak_year: number;
  description: string;
}

interface StoryHook {
  title: string;
  description: string;
  suitable_for: string[];
}

export default function Top2000Analyse() {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['top2000-analysis-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('top2000_analyses')
        .select('*')
        .neq('main_narrative', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const keyInsights = (analysis?.key_insights as KeyInsight[]) || [];
  const canonTracks = (analysis?.canon_tracks as CanonTrack[]) || [];
  const dominantArtists = (analysis?.dominant_artists as DominantArtist[]) || [];
  const genreShifts = (analysis?.genre_shifts as GenreShift[]) || [];
  const dutchAnalysis = (analysis?.dutch_analysis as any) || {};
  const decadeAnalysis = (analysis?.decade_analysis as any) || {};
  const storyHooks = (analysis?.story_hooks as StoryHook[]) || [];

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'cultureel_anker': return 'bg-amber-500';
      case 'stabiele_klassieker': return 'bg-green-500';
      case 'golfbeweging': return 'bg-blue-500';
      case 'tijdelijk': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'stijgend': return '📈';
      case 'dalend': return '📉';
      case 'stabiel': return '➡️';
      case 'opkomend': return '🚀';
      default: return '•';
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!analysis) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Nog geen analyse beschikbaar</h1>
          <p className="text-muted-foreground">
            De Top 2000 culturele analyse wordt binnenkort gepubliceerd.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Top 2000 Culturele Analyse | MusicScan</title>
        <meta name="description" content="Ontdek de Nederlandse muziekcanon: welke nummers blijven, welke verdwijnen, en wat vormt ons collectieve muziekgeheugen." />
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-2">
            {analysis.years_covered?.length || 0} jaar geanalyseerd
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Top 2000 Culturele Analyse</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Een diepgaande AI-analyse van de Nederlandse muziekcanon, gebaseerd op {analysis.years_covered?.length || 0} jaar stemgedrag.
          </p>
        </div>

        {/* Main Narrative */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <BookOpen className="h-8 w-8 text-primary shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-semibold mb-3">Het Grote Verhaal</h2>
                <p className="text-lg leading-relaxed">{analysis.main_narrative}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-6 w-6 text-amber-500" />
            <h2 className="text-2xl font-bold">Kerninzichten</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyInsights.slice(0, 10).map((insight, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {insight.category}
                    </Badge>
                    <p className="text-sm">{insight.insight}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Tabs defaultValue="canon" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="canon" className="gap-2">
              <Music2 className="h-4 w-4" />
              <span className="hidden sm:inline">Canon</span>
            </TabsTrigger>
            <TabsTrigger value="artists" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Artiesten</span>
            </TabsTrigger>
            <TabsTrigger value="genres" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Genres</span>
            </TabsTrigger>
            <TabsTrigger value="dutch" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Nederlands</span>
            </TabsTrigger>
            <TabsTrigger value="decades" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Decennia</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="canon">
            <Card>
              <CardHeader>
                <CardTitle>Canon Nummers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {canonTracks.slice(0, 20).map((track, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <span className="text-lg font-bold text-muted-foreground w-8">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{track.title}</div>
                        <div className="text-sm text-muted-foreground truncate">{track.artist}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getClassificationColor(track.classification)} text-white`}>
                          {track.classification?.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm">{getTrendIcon(track.trend)}</span>
                      </div>
                      <div className="text-right text-sm">
                        <div>Gem. #{track.avg_position}</div>
                        <div className="text-muted-foreground">{track.years_present} jaar</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="artists">
            <Card>
              <CardHeader>
                <CardTitle>Dominante Artiesten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dominantArtists.slice(0, 20).map((artist, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <span className="text-2xl font-bold text-primary w-10">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold">{artist.artist}</div>
                        <div className="text-sm text-muted-foreground">
                          {artist.unique_songs} nummers • {artist.total_entries} entries
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={artist.status === 'canon' ? 'default' : 'secondary'}>
                          {artist.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          Beste: #{artist.best_position}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="genres">
            <Card>
              <CardHeader>
                <CardTitle>Genre Verschuivingen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {genreShifts.map((shift, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{getTrendIcon(shift.trend)}</span>
                        <h4 className="font-semibold">{shift.genre}</h4>
                        <Badge variant="outline">{shift.trend}</Badge>
                        {shift.peak_year && (
                          <span className="text-sm text-muted-foreground">
                            Piek: {shift.peak_year}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{shift.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dutch">
            <Card>
              <CardHeader>
                <CardTitle>Nederlandse Muziek Analyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {dutchAnalysis.cultural_icons && (
                  <div>
                    <h4 className="font-medium mb-2">🎖️ Culturele Iconen</h4>
                    <div className="flex flex-wrap gap-2">
                      {dutchAnalysis.cultural_icons.map((icon: string, i: number) => (
                        <Badge key={i} variant="secondary">{icon}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {dutchAnalysis.rising_dutch && (
                  <div>
                    <h4 className="font-medium mb-2">📈 In Opkomst</h4>
                    <div className="flex flex-wrap gap-2">
                      {dutchAnalysis.rising_dutch.map((artist: string, i: number) => (
                        <Badge key={i} className="bg-green-500">{artist}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {dutchAnalysis.declining_dutch && (
                  <div>
                    <h4 className="font-medium mb-2">📉 In Verval</h4>
                    <div className="flex flex-wrap gap-2">
                      {dutchAnalysis.declining_dutch.map((artist: string, i: number) => (
                        <Badge key={i} variant="outline">{artist}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decades">
            <Card>
              <CardHeader>
                <CardTitle>Decennia Analyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {decadeAnalysis.dominant_decade && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="text-sm text-muted-foreground">Dominant Decennium</div>
                    <div className="text-2xl font-bold">{decadeAnalysis.dominant_decade}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {decadeAnalysis.emerging_decades && (
                    <div>
                      <h4 className="font-medium mb-2">📈 Opkomende Decennia</h4>
                      <div className="flex flex-wrap gap-2">
                        {decadeAnalysis.emerging_decades.map((decade: string, i: number) => (
                          <Badge key={i} className="bg-green-500">{decade}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {decadeAnalysis.fading_decades && (
                    <div>
                      <h4 className="font-medium mb-2">📉 Afnemende Decennia</h4>
                      <div className="flex flex-wrap gap-2">
                        {decadeAnalysis.fading_decades.map((decade: string, i: number) => (
                          <Badge key={i} variant="outline">{decade}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Story Hooks */}
        {storyHooks.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Verhaallijnen voor Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storyHooks.map((hook, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{hook.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{hook.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {hook.suitable_for?.map((format, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
