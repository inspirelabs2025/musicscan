import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Sparkles, Copy, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const LongTailKeywordGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [format, setFormat] = useState("vinyl");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!artist && !title) {
      toast({
        title: "⚠️ Vul minimaal artiest of titel in",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-longtail-keywords', {
        body: { artist, title, genre, year, format }
      });

      if (error) throw error;

      setKeywords(data.keywords);
      toast({
        title: "✨ Keywords gegenereerd",
        description: `${data.count} long-tail trefwoorden aangemaakt`,
      });
    } catch (error: any) {
      console.error('Error generating keywords:', error);
      toast({
        title: "❌ Fout",
        description: error.message || "Kon keywords niet genereren",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(keywords.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "📋 Gekopieerd",
      description: "Keywords naar klembord gekopieerd",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Long-Tail Keyword Generator
        </CardTitle>
        <CardDescription>
          Genereer specifieke, minder competitieve zoektermen voor betere SEO
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="artist">Artiest *</Label>
            <Input
              id="artist"
              placeholder="Marvin Gaye"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              placeholder="What's Going On"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              placeholder="Soul, Motown"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Jaar</Label>
            <Input
              id="year"
              placeholder="1971"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Input
              id="format"
              placeholder="vinyl, cd, cassette"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            />
          </div>
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
              Genereren...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Genereer Long-Tail Keywords
            </>
          )}
        </Button>

        {keywords.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Gegenereerde Keywords ({keywords.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Gekopieerd
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Kopieer
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Keywords als tekst</Label>
              <Textarea
                value={keywords.join(', ')}
                readOnly
                rows={4}
                className="font-mono text-xs"
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>💡 Tips:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Gebruik deze keywords in je meta description en content</li>
                <li>Integreer ze natuurlijk in koppen en paragrafen</li>
                <li>Focus op 3-5 primaire keywords per pagina</li>
                <li>Update keywords regelmatig op basis van zoektrends</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
