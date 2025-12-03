import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useYearOverview, useAvailableYears, useGenerateYearOverview } from '@/hooks/useYearOverview';
import { TopArtistsSection } from '@/components/year-overview/TopArtistsSection';
import { TopAlbumsSection } from '@/components/year-overview/TopAlbumsSection';
import { AwardsSection } from '@/components/year-overview/AwardsSection';
import { GenreTrendsSection } from '@/components/year-overview/GenreTrendsSection';
import { AIGeneratedNarrative } from '@/components/year-overview/AIGeneratedNarrative';
import { RefreshCw, Calendar, Eye, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const AdminYearOverview: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data: availableYears = [] } = useAvailableYears();
  const { data, isLoading, refetch } = useYearOverview(selectedYear);
  const generateMutation = useGenerateYearOverview();

  const handleGenerate = async (regenerate: boolean = false) => {
    try {
      toast.info('Jaaroverzicht wordt gegenereerd... Dit kan 1-2 minuten duren.');
      await generateMutation.mutateAsync({ year: selectedYear, regenerate });
      toast.success(`Jaar overzicht ${selectedYear} gegenereerd!`);
      refetch();
    } catch (error) {
      toast.error('Fout bij genereren van jaar overzicht');
    }
  };

  const sections = data?.generated_narratives;
  const sources = data?.sources;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                Muziek Jaaroverzicht Beheer
              </h1>
              <p className="text-muted-foreground mt-1">Genereer jaaroverzichten met Spotify, Discogs & AI</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button asChild variant="outline">
                <Link to="/jaar-overzicht" target="_blank"><Eye className="h-4 w-4 mr-2" />Preview</Link>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generatie Acties</CardTitle>
              <CardDescription>Genereer een muziek jaaroverzicht voor {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => handleGenerate(false)} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Genereer Overzicht
              </Button>
              <Button variant="secondary" onClick={() => handleGenerate(true)} disabled={generateMutation.isPending}>
                <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                Regenereer
              </Button>
            </CardContent>
          </Card>

          {data && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Status</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div><span className="text-sm text-muted-foreground">Gecached:</span><Badge variant="secondary" className="ml-2">{new Date(data.created_at).toLocaleString('nl-NL')}</Badge></div>
                  <div><span className="text-sm text-muted-foreground">Bronnen:</span>
                    {sources?.spotify && <Badge className="ml-2 bg-green-500">Spotify</Badge>}
                    {sources?.discogs && <Badge className="ml-2 bg-blue-500">Discogs</Badge>}
                    {sources?.perplexity && <Badge className="ml-2 bg-purple-500">Perplexity</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : data && sections ? (
            <div className="space-y-6">
              {sections.global_overview?.narrative && <AIGeneratedNarrative title={`Het Muziekjaar ${selectedYear}`} narrative={sections.global_overview.narrative} icon="🌍" />}
              <TopArtistsSection artists={sections.top_artists || []} />
              <TopAlbumsSection albums={sections.top_albums || []} />
              <AwardsSection narrative={sections.awards?.narrative || ''} grammy={sections.awards?.grammy || []} brit_awards={sections.awards?.brit_awards || []} edison={sections.awards?.edison || []} />
              <GenreTrendsSection narrative={sections.genre_trends?.narrative || ''} risingGenres={sections.genre_trends?.rising_genres} popularGenres={sections.genre_trends?.popular_genres || []} />
            </div>
          ) : (
            <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">Klik op "Genereer Overzicht" om te starten.</p></CardContent></Card>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminYearOverview;
