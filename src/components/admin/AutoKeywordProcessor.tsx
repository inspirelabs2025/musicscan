import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, TrendingUp, RefreshCw } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const AutoKeywordProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'missing' | 'improve'>('missing');
  const { toast } = useToast();

  const handleProcess = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      toast({
        title: "🚀 Keyword Generator Gestart",
        description: "Analyseren van content en genereren van keywords...",
      });

      const { data, error } = await supabase.functions.invoke('auto-generate-keywords', {
        body: { 
          limit: 20,
          mode 
        }
      });

      if (error) throw error;

      setResult(data);

      toast({
        title: "✨ Keywords Gegenereerd",
        description: `${data.stats.updated} items bijgewerkt met nieuwe keywords`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "❌ Fout",
        description: error.message || "Kon keywords niet genereren",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Automatische Keyword Generator
        </CardTitle>
        <CardDescription>
          Analyseert content en genereert automatisch long-tail keywords op basis van bestaande trends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Verwerkingsmodus</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="missing" id="missing" />
                <Label htmlFor="missing" className="font-normal cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold">Ontbrekende Keywords</span>
                    <span className="text-xs text-muted-foreground">
                      Voeg keywords toe aan content die nog geen keywords heeft
                    </span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="improve" id="improve" />
                <Label htmlFor="improve" className="font-normal cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold">Verbeter Bestaande</span>
                    <span className="text-xs text-muted-foreground">
                      Vul bestaande keywords aan met nieuwe suggesties
                    </span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Hoe het werkt
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Analyseert alle bestaande keywords op de site</li>
              <li>Detecteert trends en patronen in succesvolle keywords</li>
              <li>Genereert nieuwe long-tail keywords per content item</li>
              <li>Bouwt voort op bestaande keyword strategieën</li>
              <li>Verwerkt 20 items per run voor optimale kwaliteit</li>
            </ul>
          </div>
        </div>

        <Button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Bezig met verwerken...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Automatische Verwerking
            </>
          )}
        </Button>

        {result && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">📊 Resultaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Verwerkt</p>
                  <p className="text-2xl font-bold">{result.stats.processed}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Bijgewerkt</p>
                  <p className="text-2xl font-bold text-green-600">{result.stats.updated}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Overgeslagen</p>
                  <p className="text-2xl font-bold text-yellow-600">{result.stats.skipped}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fouten</p>
                  <p className="text-2xl font-bold text-red-600">{result.stats.errors}</p>
                </div>
              </div>

              {result.stats.by_table && Object.keys(result.stats.by_table).length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Per content type:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.stats.by_table).map(([table, count]) => (
                      <Badge key={table} variant="secondary">
                        {table}: {count as number}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Totaal unieke keywords</p>
                  <Badge variant="outline" className="text-lg">
                    {result.total_unique_keywords}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Keywords worden gebruikt om context te geven voor nieuwe suggesties
                </p>
              </div>

              <div className="text-xs text-muted-foreground pt-2">
                <p>Voltooid om {new Date(result.completed_at).toLocaleString('nl-NL')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>💡 Pro tip:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Draai dit dagelijks om nieuwe content automatisch te voorzien van keywords</li>
            <li>Gebruik 'Verbeter Bestaande' wekelijks om keywords up-to-date te houden</li>
            <li>Monitor welke keywords traffic genereren en pas aan</li>
            <li>Systeem leert van succesvolle keywords en past zich aan</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
