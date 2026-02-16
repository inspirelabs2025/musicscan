
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Disc, Music, Calendar, TrendingUp } from "lucide-react";
import { CollectionStats, MusicHistoryTimeline, ChartData } from "@/hooks/useCollectionAIAnalysis";
import { useLanguage } from "@/contexts/LanguageContext";

interface MusicHistoryHeaderProps {
  stats: CollectionStats;
  timeline: MusicHistoryTimeline;
  chartData: ChartData;
}

export function MusicHistoryHeader({ stats, timeline, chartData }: MusicHistoryHeaderProps) {
  const { tr } = useLanguage();
  const a = tr.aiAnalysis;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Main Title */}
      <div className="text-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-2 md:mb-4 bg-gradient-to-r from-primary via-vinyl-gold to-accent bg-clip-text text-transparent">
          {a.yourMusicHistory}
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {timeline.overview}
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 px-4">
        <Card variant="default" className="hover:bg-accent/50 transition-all duration-300">
          <CardContent className="p-4 md:p-6 text-center">
            <Music className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 mx-auto mb-2 text-primary" />
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{stats.totalItems}</div>
            <div className="text-xs md:text-sm text-muted-foreground">{a.albums}</div>
            <div className="text-xs text-muted-foreground/70 mt-1">
              {stats.cdCount} CD • {stats.vinylCount} Vinyl
            </div>
          </CardContent>
        </Card>

        <Card variant="default" className="hover:bg-accent/50 transition-all duration-300">
          <CardContent className="p-4 md:p-6 text-center">
            <Users className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 mx-auto mb-2 text-vinyl-gold" />
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{stats.uniqueArtists}</div>
            <div className="text-xs md:text-sm text-muted-foreground">{a.artists}</div>
            <div className="text-xs text-muted-foreground/70 mt-1">{stats.uniqueGenres} {a.genres}</div>
          </CardContent>
        </Card>

        <Card variant="default" className="hover:bg-accent/50 transition-all duration-300">
          <CardContent className="p-4 md:p-6 text-center">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 mx-auto mb-2 text-accent" />
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{stats.timeSpan}</div>
            <div className="text-xs md:text-sm text-muted-foreground">{a.yearHistory}</div>
            <div className="text-xs text-muted-foreground/70 mt-1">
              {stats.oldestItem} - {stats.newestItem}
            </div>
          </CardContent>
        </Card>

        <Card variant="default" className="hover:bg-accent/50 transition-all duration-300">
          <CardContent className="p-4 md:p-6 text-center">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 mx-auto mb-2 text-vinyl-gold" />
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{formatValue(stats.totalValue)}</div>
            <div className="text-xs md:text-sm text-muted-foreground">{a.totalValue}</div>
            <div className="text-xs text-muted-foreground/70 mt-1">
              Ø {formatValue(stats.avgValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Musical Evolution Summary */}
      <Card variant="default" className="mx-4">
        <CardHeader>
          <CardTitle className="text-foreground text-xl md:text-2xl flex items-center gap-3">
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            {a.musicalEvolution}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/90 text-sm md:text-base lg:text-lg leading-relaxed mb-4 md:mb-6">
            {timeline.musicalEvolution}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary/50 text-xs">
                  {a.timePeriods}
                </Badge>
              </h4>
              <div className="space-y-2">
                {timeline.keyPeriods.slice(0, 3).map((period, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg border border-border">
                    <p className="text-foreground/80 text-xs md:text-sm leading-relaxed">{period}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-vinyl-gold border-vinyl-gold/50 text-xs">
                  {a.culturalMovements}
                </Badge>
              </h4>
              <div className="space-y-2">
                {timeline.culturalMovements.slice(0, 3).map((movement, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg border border-border">
                    <p className="text-foreground/80 text-xs md:text-sm leading-relaxed">{movement}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
