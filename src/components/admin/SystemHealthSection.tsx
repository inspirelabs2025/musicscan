import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Server, Activity, Clock } from 'lucide-react';
import { SuperAdminStats } from '@/hooks/useSuperAdminStats';

interface SystemHealthSectionProps {
  stats?: SuperAdminStats;
}

export const SystemHealthSection: React.FC<SystemHealthSectionProps> = ({ stats }) => {
  if (!stats) return <div>Laden...</div>;

  const systemHealth = stats.totalErrors < 10 ? 'healthy' : stats.totalErrors < 50 ? 'warning' : 'critical';
  const errorRate = stats.totalScans > 0 ? Math.round((stats.totalErrors / stats.totalScans) * 100 * 100) / 100 : 0;

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={systemHealth === 'healthy' ? 'border-green-200 bg-green-50 dark:bg-green-950' : 
                         systemHealth === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950' : 
                         'border-red-200 bg-red-50 dark:bg-red-950'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Systeem Status</CardTitle>
            {systemHealth === 'healthy' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className={`h-4 w-4 ${systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              systemHealth === 'healthy' ? 'text-green-600' : 
              systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {systemHealth === 'healthy' ? 'Gezond' : 
               systemHealth === 'warning' ? 'Waarschuwing' : 'Kritiek'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalErrors} totaal fouten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fout Ratio</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{errorRate}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              van alle verwerkingen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">99.9%</div>
            <p className="text-xs text-muted-foreground mt-2">
              afgelopen 30 dagen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">1.2s</div>
            <p className="text-xs text-muted-foreground mt-2">
              gemiddelde response tijd
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Systeem Performance</CardTitle>
          <CardDescription>Overzicht van belangrijke performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalScans}</div>
              <p className="text-sm text-muted-foreground">Totaal Scans</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.scansToday}</div>
              <p className="text-sm text-muted-foreground">Scans Vandaag</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.discogsMatches}</div>
              <p className="text-sm text-muted-foreground">Discogs Matches</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.avgConfidence}</div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};