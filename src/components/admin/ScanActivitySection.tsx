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

  const aiSuccessRate = stats.aiScans > 0 ? 
    Math.round((stats.aiScansWithPricing / stats.aiScans) * 100) : 0;

  const cdPricingRate = stats.cdScans > 0 ? 
    Math.round((stats.cdScansWithPricing / stats.cdScans) * 100) : 0;

  const vinylPricingRate = stats.vinylScans > 0 ? 
    Math.round((stats.vinylScansWithPricing / stats.vinylScans) * 100) : 0;

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
            <div className="text-2xl font-bold">{stats.aiScans}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={aiSuccessRate} className="flex-1" />
              <Badge variant={aiSuccessRate > 80 ? 'default' : 'secondary'}>
                {aiSuccessRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.aiScansWithPricing} succesvol, {stats.aiScansFailed} gefaald
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CD Scans</CardTitle>
            <Disc3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cdScans}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={cdPricingRate} className="flex-1" />
              <Badge variant={cdPricingRate > 60 ? 'default' : 'secondary'}>
                {cdPricingRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.cdScansWithPricing} met pricing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vinyl Scans</CardTitle>
            <Music className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vinylScans}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={vinylPricingRate} className="flex-1" />
              <Badge variant={vinylPricingRate > 60 ? 'default' : 'secondary'}>
                {vinylPricingRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.vinylScansWithPricing} met pricing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch Uploads</CardTitle>
            <Upload className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.batchUploads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              batch verwerkingen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recente Activiteit</CardTitle>
          <CardDescription>Laatste 20 scans in het systeem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.slice(0, 20).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{activity.type}</Badge>
                  <div>
                    <p className="font-medium text-sm">
                      {activity.artist} - {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString('nl-NL')}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  User: {activity.user_id.slice(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};