import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ImageIcon, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Play,
  Pause,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SuperAdminStats } from '@/hooks/useSuperAdminStats';

interface ArtworkStatusSectionProps {
  stats?: SuperAdminStats;
}

export const ArtworkStatusSection: React.FC<ArtworkStatusSectionProps> = ({ stats }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<any>(null);

  const handleManualTrigger = async () => {
    setIsProcessing(true);
    try {
      console.log('🎨 Starting manual artwork batch fetch...');
      
      const { data, error } = await supabase.functions.invoke('batch-fetch-artwork', {
        body: { process_ai_scans: true }
      });

      if (error) throw error;

      toast({
        title: "Artwork Fetch Gestart! 🎨",
        description: `${data.total_processed} items verwerkt, ${data.success_count} succesvol`,
        variant: "default"
      });

      setBatchStatus(data);
    } catch (error) {
      console.error('❌ Manual artwork fetch failed:', error);
      toast({
        title: "Artwork Fetch Mislukt",
        description: "Er is een fout opgetreden tijdens het ophalen van artwork",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const artworkStats = stats?.artworkStats || {
    aiScansWithoutArtwork: 0,
    cdScansWithoutArtwork: 0,
    vinylScansWithoutArtwork: 0,
    totalScansWithArtwork: 0,
    totalScans: 0,
    lastBatchRun: null,
    batchSuccessRate: 0,
    cronjobStatus: 'unknown'
  };

  const completionRate = artworkStats.totalScans > 0 
    ? ((artworkStats.totalScansWithArtwork / artworkStats.totalScans) * 100).toFixed(1)
    : '0';

  const totalMissing = artworkStats.aiScansWithoutArtwork + 
                      artworkStats.cdScansWithoutArtwork + 
                      artworkStats.vinylScansWithoutArtwork;

  return (
    <div className="space-y-6">
      {/* Header with Manual Trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            Artwork Status & Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Automatische artwork fetch monitoring en beheer
          </p>
        </div>
        <Button 
          onClick={handleManualTrigger}
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isProcessing ? 'Verwerking...' : 'Handmatige Batch'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completeness Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            <Progress value={parseFloat(completionRate)} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {artworkStats.totalScansWithArtwork} van {artworkStats.totalScans} scans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing Artwork</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalMissing}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {artworkStats.aiScansWithoutArtwork} AI
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {artworkStats.cdScansWithoutArtwork} CD
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {artworkStats.vinylScansWithoutArtwork} Vinyl
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cronjob Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge 
                variant={artworkStats.cronjobStatus === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {artworkStats.cronjobStatus === 'active' ? 'Actief' : 'Inactief'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dagelijks om 02:00 CET
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {artworkStats.batchSuccessRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Laatste batch run
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Statistics per Media Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Artwork Status per Media Type
            </CardTitle>
            <CardDescription>
              Overzicht van missing artwork per scan type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">AI Scans</Badge>
                  <span className="text-sm text-muted-foreground">
                    {artworkStats.aiScansWithoutArtwork} missing
                  </span>
                </div>
                <div className="w-24">
                  <Progress 
                    value={artworkStats.aiScansWithoutArtwork > 0 ? 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">CD Scans</Badge>
                  <span className="text-sm text-muted-foreground">
                    {artworkStats.cdScansWithoutArtwork} missing
                  </span>
                </div>
                <div className="w-24">
                  <Progress 
                    value={artworkStats.cdScansWithoutArtwork > 0 ? 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Vinyl Scans</Badge>
                  <span className="text-sm text-muted-foreground">
                    {artworkStats.vinylScansWithoutArtwork} missing
                  </span>
                </div>
                <div className="w-24">
                  <Progress 
                    value={artworkStats.vinylScansWithoutArtwork > 0 ? 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health & Last Run Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Batch Processing Health
            </CardTitle>
            <CardDescription>
              Systeem status en laatste run informatie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Laatste Run:</span>
                <span className="text-sm text-muted-foreground">
                  {artworkStats.lastBatchRun 
                    ? new Date(artworkStats.lastBatchRun).toLocaleString('nl-NL')
                    : 'Nog geen run'
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate:</span>
                <Badge 
                  variant={artworkStats.batchSuccessRate > 80 ? 'default' : 'secondary'}
                >
                  {artworkStats.batchSuccessRate.toFixed(1)}%
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Queue Status:</span>
                <Badge variant="outline">
                  {totalMissing} items in queue
                </Badge>
              </div>

              {batchStatus && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Laatste Handmatige Run:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {batchStatus.total_processed} items verwerkt, {batchStatus.success_count} succesvol
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};