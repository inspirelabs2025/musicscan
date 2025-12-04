import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Footer } from '@/components/Footer';
import { useYearOverview, useAvailableYears, useGenerateYearOverview } from '@/hooks/useYearOverview';
import { YearOverviewHero } from '@/components/year-overview/YearOverviewHero';
import { AIGeneratedNarrative } from '@/components/year-overview/AIGeneratedNarrative';
import { TopArtistsSection } from '@/components/year-overview/TopArtistsSection';
import { TopAlbumsSection } from '@/components/year-overview/TopAlbumsSection';
import { AwardsSection } from '@/components/year-overview/AwardsSection';
import { InMemoriamSection } from '@/components/year-overview/InMemoriamSection';
import { DutchMusicSection } from '@/components/year-overview/DutchMusicSection';
import { StreamingViralSection } from '@/components/year-overview/StreamingViralSection';
import { ToursFestivalsSection } from '@/components/year-overview/ToursFestivalsSection';
import { GenreTrendsSection } from '@/components/year-overview/GenreTrendsSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const YearOverview: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data: availableYears = [] } = useAvailableYears();
  const { data, isLoading, error } = useYearOverview(selectedYear);
  const generateMutation = useGenerateYearOverview();

  const handleGenerate = async () => {
    try {
      toast.info('Jaaroverzicht wordt gegenereerd... Dit kan even duren.');
      await generateMutation.mutateAsync({ year: selectedYear, regenerate: true });
      toast.success(`Jaaroverzicht ${selectedYear} gegenereerd!`);
    } catch (error) {
      toast.error('Fout bij genereren van jaaroverzicht');
    }
  };

  const sections = data?.generated_narratives;
  const sources = data?.sources;

  return (
    <>
      <Helmet>
        <title>{`Muziek Jaaroverzicht ${selectedYear} | MusicScan`}</title>
        <meta name="description" content={`Ontdek het complete muziekjaaroverzicht van ${selectedYear}. Top artiesten, beste albums, awards, virale hits en meer.`} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <YearOverviewHero year={selectedYear} onYearChange={setSelectedYear} availableYears={availableYears} />

          {sources && (
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <span className="text-sm text-muted-foreground">Bronnen:</span>
              {sources.spotify && <Badge variant="secondary">Spotify</Badge>}
              {sources.discogs && <Badge variant="secondary">Discogs</Badge>}
              {sources.perplexity && <Badge variant="secondary">Perplexity</Badge>}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Overzicht laden...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive">Er ging iets mis bij het laden.</p>
            </div>
          ) : !data ? (
            <Card className="max-w-lg mx-auto">
              <CardContent className="py-12 text-center space-y-4">
                <Sparkles className="h-12 w-12 mx-auto text-primary/50" />
                <h3 className="text-lg font-semibold">Nog geen jaaroverzicht voor {selectedYear}</h3>
                <p className="text-muted-foreground">Genereer een compleet muziekjaaroverzicht met Spotify, Discogs en meer.</p>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending} size="lg">
                  {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Genereer Jaaroverzicht
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generateMutation.isPending}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                  Vernieuwen
                </Button>
              </div>
              {sections?.global_overview?.narrative && (
                <AIGeneratedNarrative title={`Het Muziekjaar ${selectedYear}`} narrative={sections.global_overview.narrative} icon="🌍" />
              )}
              <TopArtistsSection artists={sections?.top_artists || []} />
              <TopAlbumsSection albums={sections?.top_albums || []} />
              <AwardsSection narrative={sections?.awards?.narrative || ''} grammy={sections?.awards?.grammy || []} brit_awards={sections?.awards?.brit_awards || []} edison={sections?.awards?.edison || []} />
              <StreamingViralSection 
                narrative={sections?.streaming_viral?.narrative || ''} 
                viralHits={sections?.streaming_viral?.viral_hits || []} 
                streamingRecords={sections?.streaming_viral?.streaming_records || []}
                spotifyWrapped={sections?.streaming_viral?.spotify_wrapped}
                tiktokTrends={sections?.streaming_viral?.tiktok_trends}
              />
              <GenreTrendsSection 
                narrative={sections?.genre_trends?.narrative || ''} 
                risingGenres={sections?.genre_trends?.rising_genres} 
                popularGenres={sections?.genre_trends?.popular_genres || []}
                decliningGenres={sections?.genre_trends?.declining_genres}
                fusionTrends={sections?.genre_trends?.fusion_trends}
              />
              <ToursFestivalsSection 
                narrative={sections?.tours_festivals?.narrative || ''} 
                biggestTours={sections?.tours_festivals?.biggest_tours || []} 
                festivals={sections?.tours_festivals?.festivals || []}
                venueRecords={sections?.tours_festivals?.venue_records}
              />
              <DutchMusicSection narrative={sections?.dutch_music?.narrative || ''} highlights={sections?.dutch_music?.highlights || []} topArtists={sections?.dutch_music?.top_artists || []} edisonWinners={sections?.dutch_music?.edison_winners || []} />
              <InMemoriamSection narrative={sections?.in_memoriam?.narrative || ''} artists={sections?.in_memoriam?.artists || []} />
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default YearOverview;
