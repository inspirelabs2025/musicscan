import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";

export default function GenerateSeed() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResults(null);

    try {
      toast({
        title: "🎨 Genereren gestart",
        description: "Dit kan enkele minuten duren...",
      });

      const { data, error } = await supabase.functions.invoke('generate-fanwall-seed', {
        body: {}
      });

      if (error) throw error;

      setResults(data);

      toast({
        title: "✅ Seed data gegenereerd",
        description: `${data.created} van ${data.total} foto's succesvol aangemaakt`,
      });

    } catch (error: any) {
      console.error('Generate seed error:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon seed data niet genereren",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">FanWall Seed Generator</h1>
          <p className="text-muted-foreground">
            Genereer demo foto's met AI voor de FanWall (iconische muziekmomenten)
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Wat wordt gegenereerd?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 10 AI-gegenereerde foto's van iconische muziekmomenten</li>
                  <li>• Diverse artiesten: David Bowie, Pink Floyd, Nirvana, Beatles, etc.</li>
                  <li>• Verschillende formats: vinyl, concert, poster, CD, cassette</li>
                  <li>• Realistische vintage aesthetiek uit verschillende decennia</li>
                  <li>• Volledige metadata en SEO optimalisatie</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Genereren... (dit duurt ~2-3 minuten)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Genereer Seed Data
                </>
              )}
            </Button>
          </div>
        </Card>

        {results && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Resultaten</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Totaal:</span>
                <span className="font-medium">{results.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Succesvol:</span>
                <span className="font-medium text-green-600">{results.created}</span>
              </div>
              {results.failed > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mislukt:</span>
                  <span className="font-medium text-red-600">{results.failed}</span>
                </div>
              )}
            </div>

            {results.results && results.results.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Details:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded ${
                        result.success
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {result.success ? '✅' : '❌'} {result.artist}
                      {result.error && ` - ${result.error}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
