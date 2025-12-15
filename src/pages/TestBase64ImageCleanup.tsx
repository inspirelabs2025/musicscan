import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestBase64ImageCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runCleanup = async (dryRun: boolean) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-base64-product-images', {
        body: { dryRun, limit: 200 },
      });

      if (error) {
        console.error('Cleanup error:', error);
        toast.error('Cleanup mislukt: ' + error.message);
        return;
      }

      setResult(data);
      if (dryRun) {
        toast.success(`Dry-run klaar: ${data.found} gevonden`);
      } else {
        toast.success(`Opgeschoond: ${data.cleaned} producten (gevonden: ${data.found})`);
      }
    } catch (err: any) {
      console.error('Cleanup failed:', err);
      toast.error('Cleanup mislukt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Base64 afbeeldingen opschonen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Deze tool verwijdert base64 afbeeldingen uit <code>platform_products</code> (primary_image/images) zodat pagina’s
            zoals <code>/kerst</code> niet meer time-outen.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => runCleanup(true)} disabled={isLoading}>
              {isLoading ? 'Bezig…' : 'Dry-run (alleen check)'}
            </Button>
            <Button onClick={() => runCleanup(false)} disabled={isLoading}>
              {isLoading ? 'Opschonen…' : 'Start opschonen'}
            </Button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-secondary rounded-lg">
              <h3 className="font-semibold mb-2">Resultaat:</h3>
              <ul className="space-y-1 text-sm">
                <li>Dry-run: {String(!!result.dryRun)}</li>
                <li>Gevonden: {result.found}</li>
                <li>Opgeschoond: {result.cleaned}</li>
                <li>Errors: {result.errors?.length || 0}</li>
              </ul>

              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer">Fouten (details)</summary>
                  <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto">
                    {JSON.stringify(result.errors, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
