import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export function AutoIndexNowSubmitter() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const handleAutoSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-submit-blogs-indexnow', {
        body: {},
      });

      if (error) throw error;

      setLastResult(data);

      toast({
        title: 'Succesvol ingediend!',
        description: `${data.blogsFound} blog URLs toegevoegd aan IndexNow wachtrij`,
      });
    } catch (error) {
      console.error('Error auto-submitting blogs:', error);
      toast({
        title: 'Fout bij indienen',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Auto IndexNow Submitter
            </CardTitle>
            <CardDescription>
              Dien automatisch je belangrijkste blogs in voor indexering
            </CardDescription>
          </div>
          <Button
            onClick={handleAutoSubmit}
            disabled={isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Bezig...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Nu
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium">Recent Updates</div>
              <div className="text-xs text-muted-foreground">
                Blogs van afgelopen 7 dagen
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium">Top 20 Blogs</div>
              <div className="text-xs text-muted-foreground">
                Meest bekeken content
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium">Auto Dedup</div>
              <div className="text-xs text-muted-foreground">
                Geen duplicaten
              </div>
            </div>
          </div>
        </div>

        {lastResult && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-900 dark:text-green-100">
                Laatste Submission
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Blogs gevonden:</span>
                <Badge variant="outline" className="ml-2">
                  {lastResult.blogsFound}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">URLs in wachtrij:</span>
                <Badge variant="outline" className="ml-2">
                  {lastResult.urlsQueued}
                </Badge>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Processor status:</span>
                <Badge
                  variant={lastResult.processorTriggered ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {lastResult.processorTriggered ? 'Gestart' : 'Handmatig starten'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            💡 <strong>Tip:</strong> Deze functie draait automatisch dagelijks om 3:00 AM
          </p>
          <p>
            📊 Selecteert: Nieuwe blogs (7 dagen) + Top 20 meest bekeken
          </p>
          <p>
            🔄 Submits naar: Bing (direct) + Google (passief meeluisteren)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
