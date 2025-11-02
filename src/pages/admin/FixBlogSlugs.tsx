import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const FixBlogSlugs = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFixSlugs = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      toast({
        title: "🔧 Slug Fix Gestart",
        description: "Bezig met updaten van blog slugs...",
      });

      const { data, error } = await supabase.functions.invoke('fix-blog-slugs', {
        body: {}
      });

      if (error) throw error;

      setResult(data);

      toast({
        title: "✅ Slugs Gefixed",
        description: `${data.updated} blogs bijgewerkt, ${data.skipped} overgeslagen`,
      });
    } catch (error: any) {
      console.error('Error fixing slugs:', error);
      toast({
        title: "❌ Fout",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 Fix Blog Slugs
          </CardTitle>
          <CardDescription>
            Update alle blog slugs met correcte Discogs data om "unknown" te verwijderen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Deze tool:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Haalt alle blog posts op</li>
              <li>Voor platform_products: haalt correcte artist/title van Discogs API</li>
              <li>Genereert nieuwe slug met effectieve data</li>
              <li>Slaat blogs over met incomplete metadata</li>
              <li>Update alleen blogs waarvan de slug verandert</li>
            </ul>
          </div>

          <Button
            onClick={handleFixSlugs}
            disabled={isProcessing}
            size="lg"
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig met fixen...
              </>
            ) : (
              "Start Slug Fix"
            )}
          </Button>

          {result && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">📊 Resultaat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Totaal</p>
                    <p className="text-2xl font-bold">{result.total}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Bijgewerkt
                    </p>
                    <p className="text-2xl font-bold text-green-600">{result.updated}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Overgeslagen</p>
                    <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Fouten
                    </p>
                    <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FixBlogSlugs;
