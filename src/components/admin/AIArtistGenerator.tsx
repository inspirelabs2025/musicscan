import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Users, TrendingUp } from "lucide-react";

export const AIArtistGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [count, setCount] = useState("200");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!count || parseInt(count) < 1 || parseInt(count) > 500) {
      toast({
        title: "⚠️ Ongeldig aantal",
        description: "Voer een aantal in tussen 1 en 500",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      console.log('🚀 Starting artist generation with count:', count);
      
      toast({
        title: "🤖 AI Generator Gestart",
        description: "Analyseren van bestaande artiesten en genereren van suggesties...",
      });

      const { data, error } = await supabase.functions.invoke('generate-curated-artists', {
        body: { count: parseInt(count) }
      });

      console.log('📦 Response received:', { data, error });

      if (error) {
        console.error('❌ Function error:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No data received');
        throw new Error('Geen data ontvangen van de functie');
      }

      console.log('✅ Success:', data);
      setResult(data);

      toast({
        title: "✨ Artiesten Gegenereerd",
        description: `${data.inserted || 0} nieuwe artiesten toegevoegd`,
      });
    } catch (error: any) {
      console.error('❌ Error in handleGenerate:', error);
      toast({
        title: "❌ Fout",
        description: error.message || "Kon artiesten niet genereren",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Artiest Generator
        </CardTitle>
        <CardDescription>
          Genereer automatisch nieuwe curated artists op basis van de bestaande lijst met AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Hoe het werkt
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Analyseert alle bestaande curated artists</li>
            <li>Identificeert succesvolle artiesten (veel releases gevonden)</li>
            <li>Gebruikt AI om vergelijkbare artiesten te suggereren</li>
            <li>Genereert mix van bekende en niche artiesten</li>
            <li>Filtert automatisch duplicaten uit</li>
            <li>Voegt ze direct toe aan de curated artists lijst</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="count">Aantal nieuwe artiesten</Label>
          <Input
            id="count"
            type="number"
            min="1"
            max="500"
            placeholder="200"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Aanbevolen: 200 artiesten voor optimale diversiteit
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI aan het genereren...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Genereer {count} Nieuwe Artiesten
            </>
          )}
        </Button>

        {result && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resultaten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Toegevoegd</p>
                  <p className="text-2xl font-bold text-green-600">{result.inserted}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Overgeslagen</p>
                  <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fouten</p>
                  <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Totaal nu</p>
                  <p className="text-2xl font-bold text-primary">{result.total_artists}</p>
                </div>
              </div>

              {result.sample_artists && result.sample_artists.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Voorbeelden van toegevoegde artiesten:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.sample_artists.map((artist: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {artist}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Gegenereerd om {new Date(result.generated_at).toLocaleString('nl-NL')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>💡 Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Start met 200 artiesten voor een goede basis</li>
            <li>Draai periodiek opnieuw voor nieuwe suggesties</li>
            <li>AI leert van succesvolle artiesten (veel releases)</li>
            <li>Controleer de lijst en verwijder irrelevante artiesten</li>
            <li>Zet actief/inactief om te bepalen wie gecrawld wordt</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
