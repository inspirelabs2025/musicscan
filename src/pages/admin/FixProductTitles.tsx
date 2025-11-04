import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Home } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const FixProductTitles = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const runFix = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      toast({
        title: "🔧 Repair gestart",
        description: "Bezig met corrigeren van product titels...",
      });

      const { data, error } = await supabase.functions.invoke('fix-art-product-titles', {
        body: { limit: 30 }
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "✅ Repair voltooid",
        description: `${data.updated} producten gecorrigeerd, ${data.skipped} overgeslagen`,
      });
    } catch (error: any) {
      console.error('Repair error:', error);
      toast({
        title: "❌ Repair fout",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Fix Product Titles</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>🔧 Fix Product Titels & Slugs</CardTitle>
          <CardDescription>
            Corrigeert de laatste 30 merchandise producten met juiste master metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runFix} 
            disabled={isRunning}
            size="lg"
          >
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRunning ? 'Bezig met repareren...' : 'Start Repair'}
          </Button>

          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Resultaat</h3>
                <p className="text-sm">{result.message}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>✅ Gecorrigeerd: <strong>{result.updated}</strong></div>
                  <div>⏭️ Overgeslagen: <strong>{result.skipped}</strong></div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <h3 className="font-semibold mb-2 text-destructive">Fouten ({result.errors.length})</h3>
                  <ul className="text-sm space-y-1">
                    {result.errors.slice(0, 5).map((error: string, i: number) => (
                      <li key={i} className="font-mono text-xs">{error}</li>
                    ))}
                  </ul>
                  {result.errors.length > 5 && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      ... en {result.errors.length - 5} meer (check console voor details)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FixProductTitles;
