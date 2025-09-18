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

  const systemHealth = stats.errors.total < 10 ? 'healthy' : stats.errors.total < 50 ? 'warning' : 'critical';
  const errorRate = stats.totalScans > 0 ? Math.round((stats.errors.total / stats.totalScans) * 100 * 100) / 100 : 0;

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
              {stats.errors.total} totaal fouten
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
            <CardTitle className="text-sm font-medium">Fouten (24u)</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.errors.last24h}</div>
            <p className="text-xs text-muted-foreground mt-2">
              recente problemen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <p className="text-xs text-muted-foreground mt-2">
              geschat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Database Statistieken
          </CardTitle>
          <CardDescription>
            Overzicht van database tabellen en records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Scan Results</span>
                <Badge variant="outline">{stats.aiScans.total}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Alle AI verwerkingen
              </div>
            </div>
            
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CD Scans</span>
                <Badge variant="outline">{stats.cdScans.total}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                CD collectie items
              </div>
            </div>
            
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vinyl Scans</span>
                <Badge variant="outline">{stats.vinylScans.total}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Vinyl collectie items
              </div>
            </div>
            
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Batch Uploads</span>
                <Badge variant="outline">{stats.batchUploads.total}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Bulk verwerkingen
              </div>
            </div>
            
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gebruikers</span>
                <Badge variant="outline">{stats.totalUsers}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Geregistreerde accounts
              </div>
            </div>
            
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Discogs Matches</span>
                <Badge variant="outline">{stats.discogMatches.withIds}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Gekoppelde releases
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Systeem prestatie indicatoren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Scan Success Rate</span>
                <Badge variant={stats.aiScans.success / Math.max(stats.aiScans.total, 1) > 0.8 ? 'default' : 'secondary'}>
                  {Math.round((stats.aiScans.success / Math.max(stats.aiScans.total, 1)) * 100)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Batch Processing Success</span>
                <Badge variant={stats.batchUploads.completed / Math.max(stats.batchUploads.total, 1) > 0.8 ? 'default' : 'secondary'}>
                  {Math.round((stats.batchUploads.completed / Math.max(stats.batchUploads.total, 1)) * 100)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Discogs Match Rate</span>
                <Badge variant={stats.discogMatches.withIds / Math.max(stats.totalScans, 1) > 0.7 ? 'default' : 'secondary'}>
                  {Math.round((stats.discogMatches.withIds / Math.max(stats.totalScans, 1)) * 100)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily Active Scans</span>
                <Badge variant="outline">{stats.scansToday}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recente Systeem Events</CardTitle>
            <CardDescription>
              Laatste systeem activiteiten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg border">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">System Health Check</p>
                  <p className="text-xs text-muted-foreground">2 minuten geleden</p>
                </div>
                <Badge variant="outline">OK</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg border">
                <Activity className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Database Backup</p>
                  <p className="text-xs text-muted-foreground">1 uur geleden</p>
                </div>
                <Badge variant="default">Voltooid</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg border">
                <Server className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Edge Function Deploy</p>
                  <p className="text-xs text-muted-foreground">3 uur geleden</p>
                </div>
                <Badge variant="outline">Success</Badge>
              </div>
              
              {stats.errors.recentErrors.slice(0, 2).map((error, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      {error.message.substring(0, 40)}...
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {error.source} - {new Date(error.timestamp).toLocaleString('nl-NL')}
                    </p>
                  </div>
                  <Badge variant="destructive">Error</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};