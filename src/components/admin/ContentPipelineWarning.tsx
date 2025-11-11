import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AlertData {
  severity: 'info' | 'medium' | 'high';
  alerts: {
    needs_new_artists: boolean;
    low_productivity: boolean;
    artists_without_products: number;
    total_active_artists: number;
    recent_products: number;
    artist_details: string[];
  };
  summary: {
    needs_attention: boolean;
    message: string;
  };
}

export const ContentPipelineWarning: React.FC = () => {
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('curated-artists-monitor');
      
      if (error) throw error;
      
      setAlertData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching content pipeline alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !alertData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Content Pipeline Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Laden...</p>
        </CardContent>
      </Card>
    );
  }

  if (!alertData) return null;

  const getSeverityIcon = () => {
    switch (alertData.severity) {
      case 'high':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getSeverityVariant = () => {
    switch (alertData.severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getSeverityIcon()}
            Content Pipeline Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getSeverityVariant()}>
              {alertData.severity.toUpperCase()}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchAlerts}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Laatst gecontroleerd: {lastUpdate.toLocaleTimeString('nl-NL')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Alert Message */}
        {alertData.summary.needs_attention && (
          <Alert variant={alertData.severity === 'high' ? 'destructive' : 'default'}>
            <AlertTitle>{alertData.summary.message}</AlertTitle>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Actieve Artiesten</p>
            <p className="text-2xl font-bold">
              {alertData.alerts.total_active_artists}
            </p>
            <p className="text-xs text-muted-foreground">
              Min: 200
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">Producten (7d)</p>
            <p className="text-2xl font-bold">
              {alertData.alerts.recent_products}
            </p>
            <p className="text-xs text-muted-foreground">
              Min: 50/week
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">Zonder Producten</p>
            <p className="text-2xl font-bold text-destructive">
              {alertData.alerts.artists_without_products}
            </p>
            <p className="text-xs text-muted-foreground">
              {'>'}7 dagen oud
            </p>
          </div>
        </div>

        {/* Artists Without Products */}
        {alertData.alerts.artists_without_products > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Artiesten Zonder Producten ({alertData.alerts.artist_details.length} van {alertData.alerts.artists_without_products})
            </p>
            <div className="flex flex-wrap gap-2">
              {alertData.alerts.artist_details.map((artist, index) => (
                <Badge key={index} variant="outline">
                  {artist}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Recommendations */}
        {alertData.summary.needs_attention && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-sm font-medium">Aanbevolen Acties:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {alertData.alerts.needs_new_artists && (
                <li>Voeg nieuwe artiesten toe aan de curated artists lijst</li>
              )}
              {alertData.alerts.low_productivity && (
                <li>Check Discogs crawler status en queue processing</li>
              )}
              {alertData.alerts.artists_without_products > 10 && (
                <li>Trigger artist processing voor artiesten zonder producten</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
