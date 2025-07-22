
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Disc, Music, Calendar, TrendingUp } from "lucide-react";
import { CollectionStats, MusicHistoryTimeline, ChartData } from "@/hooks/useCollectionAIAnalysis";

interface MusicHistoryHeaderProps {
  stats: CollectionStats;
  timeline: MusicHistoryTimeline;
  chartData: ChartData;
}

export function MusicHistoryHeader({ stats, timeline, chartData }: MusicHistoryHeaderProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Main Title */}
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Jouw Muziekgeschiedenis
        </h1>
        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
          {timeline.overview}
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card variant="dark" className="hover:bg-white/10 transition-all duration-300">
          <CardContent className="p-4 md:p-6 text-center">
            <Music className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl md:text-3xl font-bold text-white">{stats.totalItems}</div>
            <div className="text-sm text-white/80">Albums</div>
            <div className="text-xs text-white/60 mt-1">
              {stats.cdCount} CD • {stats.vinylCount} Vinyl
            </div>
          </CardContent>
        </Card>

        <Card variant="dark" className="hover:bg-white/10 transition-all duration-300">
          <CardContent className="p-4 md:p-6 text-center">
            <Users className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl md:text-3xl font-bold text-white">{stats.uniqueArtists}</div>
            <div className="text-sm text-white/80">Artiesten</div>
            <div className="text-xs text-white/60 mt-1">{stats.uniqueGenres} genres</div>
          </CardContent>
        </Card>

        <Card variant="dark" className="hover:bg-white/10 transition-all duration-300">
          <CardContent className="p-4 md:p-6 text-center">
            <Calendar className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-2 text-green-400" />
            <div className="text-2xl md:text-3xl font-bold text-white">{stats.timeSpan}</div>
            <div className="text-sm text-white/80">Jaar Geschiedenis</div>
            <div className="text-xs text-white/60 mt-1">
              {stats.oldestItem} - {stats.newestItem}
            </div>
          </CardContent>
        </Card>

        <Card variant="dark" className="hover:bg-white/10 transition-all duration-300">
          <CardContent className="p-4 md:p-6 text-center">
            <TrendingUp className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-2 text-orange-400" />
            <div className="text-2xl md:text-3xl font-bold text-white">{formatValue(stats.totalValue)}</div>
            <div className="text-sm text-white/80">Totale Waarde</div>
            <div className="text-xs text-white/60 mt-1">
              Ø {formatValue(stats.avgValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Musical Evolution Summary */}
      <Card variant="purple">
        <CardHeader>
          <CardTitle className="text-white text-2xl flex items-center gap-3">
            <Clock className="h-6 w-6 text-indigo-400" />
            Muzikale Evolutie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/90 text-lg leading-relaxed mb-6">
            {timeline.musicalEvolution}
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-indigo-300 border-indigo-400/50">
                  Tijdperioden
                </Badge>
              </h4>
              <div className="space-y-2">
                {timeline.keyPeriods.slice(0, 3).map((period, index) => (
                  <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                    <p className="text-white/80 text-sm leading-relaxed">{period}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-purple-300 border-purple-400/50">
                  Culturele Bewegingen
                </Badge>
              </h4>
              <div className="space-y-2">
                {timeline.culturalMovements.slice(0, 3).map((movement, index) => (
                  <div key={index} className="p-3 bg-white/10 rounded-lg border border-white/20">
                    <p className="text-white/80 text-sm leading-relaxed">{movement}</p>
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
