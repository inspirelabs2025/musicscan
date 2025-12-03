import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Disc, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DanceHouseQueueManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    singles_queued: number;
    albums_queued: number;
    singles_skipped: number;
    albums_skipped: number;
  } | null>(null);

  const queueContent = async (action: 'singles' | 'albums' | 'both') => {
    setIsLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('queue-dance-house-content', {
        body: { action, limit: 200 },
      });

      if (error) throw error;

      if (data.success) {
        setResults(data.results);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Er ging iets mis');
      }
    } catch (error) {
      console.error('Queue error:', error);
      toast.error('Fout bij het queuen van content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-cyan-500/30 bg-gradient-to-br from-card to-cyan-500/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Music className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <CardTitle>Dance/House Content Queue</CardTitle>
            <CardDescription>
              Voeg dance artiesten toe aan de singles en album queue
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => queueContent('singles')}
            disabled={isLoading}
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
          >
            <Music className="w-5 h-5 text-cyan-400" />
            <span>Singles</span>
            <span className="text-xs text-muted-foreground">~80 tracks</span>
          </Button>
          
          <Button
            onClick={() => queueContent('albums')}
            disabled={isLoading}
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
          >
            <Disc className="w-5 h-5 text-purple-400" />
            <span>Albums</span>
            <span className="text-xs text-muted-foreground">~50 albums</span>
          </Button>
          
          <Button
            onClick={() => queueContent('both')}
            disabled={isLoading}
            className="h-auto py-3 flex-col gap-1 bg-gradient-to-r from-cyan-500 to-purple-500"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span>Beide</span>
            <span className="text-xs opacity-80">Aanbevolen</span>
          </Button>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-background/50 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Queue Resultaten
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Singles toegevoegd:</span>
                <Badge variant="secondary">{results.singles_queued}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Albums toegevoegd:</span>
                <Badge variant="secondary">{results.albums_queued}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Singles overgeslagen:</span>
                <Badge variant="outline">{results.singles_skipped}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Albums overgeslagen:</span>
                <Badge variant="outline">{results.albums_skipped}</Badge>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Voegt iconische dance singles en albums toe aan de verwerkingsqueue. 
          Bestaande items worden automatisch overgeslagen.
        </p>
      </CardContent>
    </Card>
  );
};
