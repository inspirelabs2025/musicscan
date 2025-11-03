import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { RefreshCw, ExternalLink, CheckCircle } from "lucide-react";

export function SitemapStatus() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-static-sitemaps');
      
      if (error) throw error;
      
      toast({
        title: "Sitemaps gegenereerd",
        description: "Alle sitemaps zijn succesvol bijgewerkt",
      });
    } catch (error) {
      console.error('Sitemap generation error:', error);
      toast({
        title: "Generatie mislukt",
        description: "Er is een fout opgetreden bij het genereren van sitemaps",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sitemapUrls = [
    { name: "Hoofd Sitemap", url: "/sitemap.xml" },
    { name: "Blog Posts", url: "https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-blog.xml" },
    { name: "Music Stories", url: "https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-music-stories.xml" },
    { name: "Products", url: "https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-products.xml" },
    { name: "Blog Images", url: "https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-images-blogs.xml" },
    { name: "Story Images", url: "https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-images-stories.xml" },
    { name: "Product Images", url: "https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-images-products.xml" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Sitemap Status
          <Button onClick={handleGenerate} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Genereer Nu
          </Button>
        </CardTitle>
        <CardDescription>
          Bekijk en beheer alle sitemaps. Automatische generatie: Elke dag om 2:00 uur
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {sitemapUrls.map((sitemap) => (
            <div
              key={sitemap.name}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{sitemap.name}</p>
                  <p className="text-sm text-muted-foreground">{sitemap.url}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={sitemap.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
