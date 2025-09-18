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
    Math.round((stats.discogMatches.withIds / stats.totalScans) * 100) : 0;

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
            <div className="text-2xl font-bold">{stats.discogMatches.withIds}</div>
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
            <div className="text-2xl font-bold">{stats.discogMatches.avgConfidence}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={stats.discogMatches.avgConfidence} className="flex-1" />
              <Badge variant={stats.discogMatches.avgConfidence > 0.8 ? 'default' : 'secondary'}>
                {Math.round(stats.discogMatches.avgConfidence * 100)}%
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
            <div className="text-2xl font-bold">{stats.topArtists.length}</div>
            <p className="text-xs text-muted-foreground mt-4">
              Verschillende artiesten gescand
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Artists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Meest Gescande Artiesten
          </CardTitle>
          <CardDescription>
            Artiesten met de meeste scans in het systeem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topArtists.slice(0, 12).map((artist, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? 'default' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                  <span className="font-medium">{artist.artist || 'Unknown Artist'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <Progress 
                      value={(artist.count / Math.max(...stats.topArtists.map(a => a.count))) * 100} 
                    />
                  </div>
                  <Badge variant="outline">{artist.count} scans</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Kwaliteit</CardTitle>
            <CardDescription>
              Volledigheid van scan data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Met Discogs ID</span>
                <div className="flex items-center gap-2">
                  <Progress value={discogMatchRate} className="w-20" />
                  <Badge variant="outline">{stats.discogMatches.withIds}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CD met prijsinfo</span>
                <div className="flex items-center gap-2">
                  <Progress value={stats.cdScans.total > 0 ? (stats.cdScans.withPricing / stats.cdScans.total * 100) : 0} className="w-20" />
                  <Badge variant="outline">{stats.cdScans.withPricing}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vinyl met prijsinfo</span>
                <div className="flex items-center gap-2">
                  <Progress value={stats.vinylScans.total > 0 ? (stats.vinylScans.withPricing / stats.vinylScans.total * 100) : 0} className="w-20" />
                  <Badge variant="outline">{stats.vinylScans.withPricing}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI scans succesvol</span>
                <div className="flex items-center gap-2">
                  <Progress value={stats.aiScans.total > 0 ? (stats.aiScans.success / stats.aiScans.total * 100) : 0} className="w-20" />
                  <Badge variant="outline">{stats.aiScans.success}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Distributie</CardTitle>
            <CardDescription>
              Verdeling van content types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Scans</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-blue-100 dark:bg-blue-900 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(stats.aiScans.total / stats.totalScans) * 100}%` }}
                    />
                  </div>
                  <Badge variant="secondary">{stats.aiScans.total}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CD Scans</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-green-100 dark:bg-green-900 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(stats.cdScans.total / stats.totalScans) * 100}%` }}
                    />
                  </div>
                  <Badge variant="secondary">{stats.cdScans.total}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vinyl Scans</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-purple-100 dark:bg-purple-900 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(stats.vinylScans.total / stats.totalScans) * 100}%` }}
                    />
                  </div>
                  <Badge variant="secondary">{stats.vinylScans.total}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};