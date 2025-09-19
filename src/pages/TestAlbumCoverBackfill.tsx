import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TestAlbumCoverBackfill = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runBackfill = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('album-cover-backfill');
      
      if (error) {
        console.error('Backfill error:', error);
        toast.error('Backfill failed: ' + error.message);
        return;
      }
      
      setResult(data);
      toast.success(`Backfill completed! ${data.successful} covers added`);
      
    } catch (error) {
      console.error('Error running backfill:', error);
      toast.error('Failed to run backfill');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Album Cover Backfill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Deze functie voegt album covers toe aan bestaande blog posts die nog geen cover hebben.
          </p>
          
          <Button 
            onClick={runBackfill}
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? 'Backfill wordt uitgevoerd...' : 'Start Album Cover Backfill'}
          </Button>
          
          {result && (
            <div className="mt-6 p-4 bg-secondary rounded-lg">
              <h3 className="font-semibold mb-2">Resultaten:</h3>
              <ul className="space-y-1 text-sm">
                <li>Totaal verwerkt: {result.total_processed}</li>
                <li>Succesvol: {result.successful}</li>
                <li>Gefaald: {result.failed}</li>
              </ul>
              
              {result.results && result.results.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer">Gedetailleerde resultaten</summary>
                  <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto">
                    {JSON.stringify(result.results, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAlbumCoverBackfill;