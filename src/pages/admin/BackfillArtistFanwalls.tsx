import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";

export default function BackfillArtistFanwalls() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runBackfill = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('backfill-artist-fanwalls');
      
      if (error) throw error;
      
      setResult(data);
      toast({
        title: "Backfill voltooid",
        description: `${data.successCount} artiesten verwerkt`,
      });
    } catch (error: any) {
      console.error('Backfill error:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon backfill niet uitvoeren",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Artist FanWall Backfill</h1>
        
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Wat doet dit?</h2>
              <p className="text-muted-foreground">
                Deze tool maakt artist_fanwalls records aan voor alle artiesten uit bestaande foto's.
                Het groepeert foto's per artiest en maakt dedic ated fanwall pagina's.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
              <p className="text-sm">
                <strong>Let op:</strong> Deze actie kan enkele minuten duren als je veel foto's hebt.
              </p>
            </div>

            <Button 
              onClick={runBackfill} 
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Bezig met verwerken...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Start Backfill
                </>
              )}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resultaten</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Succesvol</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.successCount}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Fouten</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {result.errorCount}
                  </p>
                </div>
              </div>

              {result.results && result.results.length > 0 && (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Artiest</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-right">Foto's</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map((r: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{r.artist}</td>
                          <td className="p-2">
                            {r.status === 'success' ? (
                              <span className="text-green-600 dark:text-green-400">✓</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">✗</span>
                            )}
                          </td>
                          <td className="p-2 text-right">{r.photoCount || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
