import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Music2, Target, Database } from 'lucide-react';
import { SuperAdminStats } from '@/hooks/useSuperAdminStats';

interface ContentAnalyticsSectionProps {
  stats?: SuperAdminStats;
}

export const ContentAnalyticsSection: React.FC<ContentAnalyticsSectionProps> = ({ stats }) => {
  if (!stats) return <div>Laden...</div>;

  const discogMatchRate = stats.totalScans > 0 ? 
    Math.round((stats.discogsMatches / stats.totalScans) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Content Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discogs Matches</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.discogsMatches}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={discogMatchRate} className="flex-1" />
              <Badge variant={discogMatchRate > 70 ? 'default' : 'secondary'}>
                {discogMatchRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              van {stats.totalScans} totaal scans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde Confidence</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConfidence}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={stats.avgConfidence} className="flex-1" />
              <Badge variant={stats.avgConfidence > 0.8 ? 'default' : 'secondary'}>
                {Math.round(stats.avgConfidence * 100)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI herkennings-betrouwbaarheid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unieke Artiesten</CardTitle>
            <Music2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueArtists}</div>
            <p className="text-xs text-muted-foreground mt-2">
              verschillende artiesten gescand
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Artists */}
      <Card>
        <CardHeader>
          <CardTitle>Meest Gescande Artiesten</CardTitle>
          <CardDescription>Top {Math.min(12, stats.topArtists.length)} artiesten op basis van scan-frequentie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topArtists.slice(0, 12).map((artist, index) => {
              const maxCount = stats.topArtists[0]?.count || 1;
              const percentage = Math.round((artist.count / maxCount) * 100);
              
              return (
                <div key={artist.artist} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{artist.artist}</span>
                    <Badge variant="outline">{artist.count}x</Badge>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};