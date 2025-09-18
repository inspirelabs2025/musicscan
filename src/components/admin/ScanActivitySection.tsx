import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Disc3, Music, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SuperAdminStats } from '@/hooks/useSuperAdminStats';

interface ScanActivitySectionProps {
  stats?: SuperAdminStats;
}

export const ScanActivitySection: React.FC<ScanActivitySectionProps> = ({ stats }) => {
  if (!stats) return <div>Laden...</div>;

  const aiSuccessRate = stats.aiScans.total > 0 ? 
    Math.round((stats.aiScans.success / stats.aiScans.total) * 100) : 0;

  const cdPricingRate = stats.cdScans.total > 0 ? 
    Math.round((stats.cdScans.withPricing / stats.cdScans.total) * 100) : 0;

  const vinylPricingRate = stats.vinylScans.total > 0 ? 
    Math.round((stats.vinylScans.withPricing / stats.vinylScans.total) * 100) : 0;

  const batchSuccessRate = stats.batchUploads.total > 0 ? 
    Math.round((stats.batchUploads.completed / stats.batchUploads.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Scan Type Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Scans</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiScans.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={aiSuccessRate} className="flex-1" />
              <Badge variant={aiSuccessRate > 80 ? 'default' : 'secondary'}>
                {aiSuccessRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.aiScans.success} succesvol, {stats.aiScans.failed} gefaald
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CD Scans</CardTitle>
            <Disc3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cdScans.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={cdPricingRate} className="flex-1" />
              <Badge variant={cdPricingRate > 60 ? 'default' : 'secondary'}>
                {cdPricingRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.cdScans.withPricing} met prijsinfo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vinyl Scans</CardTitle>
            <Music className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vinylScans.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={vinylPricingRate} className="flex-1" />
              <Badge variant={vinylPricingRate > 60 ? 'default' : 'secondary'}>
                {vinylPricingRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.vinylScans.withPricing} met prijsinfo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch Uploads</CardTitle>
            <Upload className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.batchUploads.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={batchSuccessRate} className="flex-1" />
              <Badge variant={batchSuccessRate > 80 ? 'default' : 'secondary'}>
                {batchSuccessRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.batchUploads.completed} voltooid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Scan Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Scan Status Overzicht
          </CardTitle>
          <CardDescription>
            Gedetailleerde status van alle AI-scans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Succesvol</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Voltooid met resultaten</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{stats.aiScans.success}</p>
                <p className="text-sm text-green-700 dark:text-green-300">{aiSuccessRate}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-red-50 dark:bg-red-950">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">Gefaald</p>
                  <p className="text-sm text-red-700 dark:text-red-300">Fouten bij verwerking</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{stats.aiScans.failed}</p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {Math.round((stats.aiScans.failed / Math.max(stats.aiScans.total, 1)) * 100)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">In behandeling</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Wordt verwerkt</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-600">{stats.aiScans.pending}</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {Math.round((stats.aiScans.pending / Math.max(stats.aiScans.total, 1)) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recente Scan Activiteit</CardTitle>
          <CardDescription>
            Laatste scans en hun status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 8).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{activity.type}</Badge>
                  <div>
                    <p className="font-medium">
                      {activity.details?.artist} - {activity.details?.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString('nl-NL')}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  activity.details?.status === 'completed' ? 'default' :
                  activity.details?.status === 'failed' ? 'destructive' : 'secondary'
                }>
                  {activity.details?.status || 'Unknown'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};