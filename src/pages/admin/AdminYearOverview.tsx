import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useYearOverview, useAvailableYears, useGenerateYearOverview } from '@/hooks/useYearOverview';
import { GlobalStatsCards } from '@/components/year-overview/GlobalStatsCards';
import { GenreDistributionChart } from '@/components/year-overview/GenreDistributionChart';
import { FormatDistributionChart } from '@/components/year-overview/FormatDistributionChart';
import { DecadeDistributionChart } from '@/components/year-overview/DecadeDistributionChart';
import { MonthlyTrendsChart } from '@/components/year-overview/MonthlyTrendsChart';
import { TopArtistsChart } from '@/components/year-overview/TopArtistsChart';
import { RefreshCw, Calendar, Eye, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const AdminYearOverview: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data: availableYears = [] } = useAvailableYears();
  const { data, isLoading, refetch } = useYearOverview(selectedYear);
  const generateMutation = useGenerateYearOverview();

  const handleGenerate = async (regenerate: boolean = false) => {
    try {
      await generateMutation.mutateAsync({ year: selectedYear, regenerate });
      toast.success(`Jaar overzicht ${selectedYear} ${regenerate ? 'geregenereerd' : 'gegenereerd'}!`);
      refetch();
    } catch (error) {
      toast.error('Fout bij genereren van jaar overzicht');
      console.error(error);
    }
  };

  const stats = data?.data_points?.stats;
  const narratives = data?.generated_narratives || {};

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                Jaar Overzicht Beheer
              </h1>
              <p className="text-muted-foreground mt-1">
                Genereer en beheer jaar overzichten met statistieken en AI-verhalen
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button asChild variant="outline">
                <Link to={`/jaar-overzicht`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Link>
              </Button>
            </div>
          </div>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Generatie Acties</CardTitle>
              <CardDescription>
                Genereer of regenereer het jaar overzicht voor {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button 
                onClick={() => handleGenerate(false)}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Genereer Overzicht
              </Button>
              
              <Button 
                variant="secondary"
                onClick={() => handleGenerate(true)}
                disabled={generateMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                Regenereer (met AI)
              </Button>
              
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Vernieuwen
              </Button>
            </CardContent>
          </Card>

          {/* Cache Status */}
          {data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cache Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Gecached op:</span>
                    <Badge variant="secondary" className="ml-2">
                      {new Date(data.created_at).toLocaleString('nl-NL')}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Verloopt:</span>
                    <Badge variant="outline" className="ml-2">
                      {new Date(data.expires_at).toLocaleString('nl-NL')}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">AI Narratieven:</span>
                    <Badge variant={Object.keys(narratives).length > 0 ? 'default' : 'secondary'} className="ml-2">
                      {Object.keys(narratives).length} gegenereerd
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Section */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Data laden...</span>
            </div>
          ) : stats ? (
            <>
              <GlobalStatsCards stats={stats} />

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GenreDistributionChart 
                  data={data?.data_points?.genres || []} 
                  narrative={narratives.genre_trends}
                />
                <FormatDistributionChart 
                  stats={stats} 
                  narrative={narratives.format_analysis}
                />
                <DecadeDistributionChart data={data?.data_points?.decades || []} />
              </div>

              <MonthlyTrendsChart data={data?.data_points?.monthly || []} />

              <div className="grid md:grid-cols-2 gap-6">
                <TopArtistsChart data={data?.data_points?.topArtists || []} />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  Nog geen data voor {selectedYear}. Klik op "Genereer Overzicht" om te starten.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
};

export default AdminYearOverview;
