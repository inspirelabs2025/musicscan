import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const FixBlogSlugs = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [onlyUnknownYear, setOnlyUnknownYear] = useState(false);
  const [targetSlug, setTargetSlug] = useState("");
  const [limit, setLimit] = useState("100");
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
        body: {
          only_unknown_year: onlyUnknownYear,
          target_slug: targetSlug || null,
          limit: limit ? parseInt(limit) : null
        }
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
            Update blog slugs met jaar uit Discogs API om "unknown" te verwijderen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Deze tool:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Haalt jaar op uit Discogs API als deze ontbreekt</li>
              <li>Genereert consistente slugs op basis van artiest, titel en jaar</li>
              <li>Update yaml_frontmatter.year met gevonden jaar</li>
              <li>Ondersteunt gefilterde batch-verwerking</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="unknown-year" 
                checked={onlyUnknownYear}
                onCheckedChange={(checked) => setOnlyUnknownYear(checked === true)}
              />
              <Label htmlFor="unknown-year" className="text-sm font-normal cursor-pointer">
                Alleen slugs met "-unknown" jaar
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-slug">Specifieke slug (optioneel)</Label>
              <Input
                id="target-slug"
                placeholder="klaus-schulze-picture-music-unknown"
                value={targetSlug}
                onChange={(e) => setTargetSlug(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="limit">Max aantal per run</Label>
              <Input
                id="limit"
                type="number"
                placeholder="100"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
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
              <CardContent className="space-y-4">
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

                {result.sources && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Jaar bronnen:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>Album data: {result.sources.albumData}</p>
                      <p>Discogs: {result.sources.discogs}</p>
                      <p>YAML: {result.sources.yaml}</p>
                      <p>Parsed: {result.sources.parsed}</p>
                    </div>
                  </div>
                )}

                {result.samples && result.samples.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Voorbeelden (eerste 10):</p>
                    <div className="space-y-2">
                      {result.samples.map((sample: any, idx: number) => (
                        <div key={idx} className="text-xs bg-muted p-2 rounded">
                          <p className="text-red-600">Oud: {sample.old}</p>
                          <p className="text-green-600">Nieuw: {sample.new}</p>
                          <p className="text-muted-foreground">Bron: {sample.yearSource}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FixBlogSlugs;
