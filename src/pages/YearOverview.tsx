import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useYearOverview, useAvailableYears, useGenerateYearOverview } from '@/hooks/useYearOverview';
import { YearOverviewHero } from '@/components/year-overview/YearOverviewHero';
import { GlobalStatsCards } from '@/components/year-overview/GlobalStatsCards';
import { GenreDistributionChart } from '@/components/year-overview/GenreDistributionChart';
import { FormatDistributionChart } from '@/components/year-overview/FormatDistributionChart';
import { DecadeDistributionChart } from '@/components/year-overview/DecadeDistributionChart';
import { MonthlyTrendsChart } from '@/components/year-overview/MonthlyTrendsChart';
import { TopArtistsChart } from '@/components/year-overview/TopArtistsChart';
import { CountryDistributionChart } from '@/components/year-overview/CountryDistributionChart';
import { PriceInsightsSection } from '@/components/year-overview/PriceInsightsSection';
import { AIGeneratedNarrative } from '@/components/year-overview/AIGeneratedNarrative';
import { Loader2 } from 'lucide-react';

const YearOverview: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data: availableYears = [] } = useAvailableYears();
  const { data, isLoading, error } = useYearOverview(selectedYear);

  const stats = data?.data_points?.stats;
  const narratives = data?.generated_narratives || {};

  return (
    <>
      <Helmet>
        <title>{`Muziek Jaar Overzicht ${selectedYear} | MusicScan`}</title>
        <meta name="description" content={`Bekijk het complete muziek jaaroverzicht van ${selectedYear}. Ontdek trends, top artiesten, genre statistieken en meer op MusicScan.`} />
        <meta property="og:title" content={`Muziek Jaar Overzicht ${selectedYear} | MusicScan`} />
        <meta property="og:description" content={`Ontdek de muziektrends van ${selectedYear}: top artiesten, populaire genres, en community statistieken.`} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <YearOverviewHero
            year={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Overzicht laden...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive">Er ging iets mis bij het laden van het overzicht.</p>
            </div>
          ) : stats ? (
            <>
              {/* AI Narrative - Global Overview */}
              {narratives.global_overview && (
                <div className="mb-8">
                  <AIGeneratedNarrative 
                    title="Globaal Overzicht" 
                    narrative={narratives.global_overview}
                    icon="🌍"
                  />
                </div>
              )}

              {/* Stats Cards */}
              <GlobalStatsCards stats={stats} />

              {/* Charts Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

              {/* Monthly Trends - Full Width */}
              <div className="mb-8">
                <MonthlyTrendsChart data={data?.data_points?.monthly || []} />
              </div>

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <TopArtistsChart data={data?.data_points?.topArtists || []} />
                <CountryDistributionChart data={data?.data_points?.countries || []} />
              </div>

              {/* Price Insights */}
              <PriceInsightsSection data={data?.data_points?.priceInsights || { highest_valued: [], price_ranges: [] }} />
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Geen data beschikbaar voor {selectedYear}</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default YearOverview;
