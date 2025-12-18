import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { RefreshCw, ExternalLink, CheckCircle, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SitemapInfo {
  urlCount?: number;
  firstItems?: string[];
  status?: number;
  contentType?: string;
  isVerifying?: boolean;
}

export function SitemapStatus() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [sitemapInfo, setSitemapInfo] = useState<Record<string, SitemapInfo>>({});

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

  const verifySitemap = async (name: string, url: string) => {
    setSitemapInfo(prev => ({ ...prev, [name]: { ...prev[name], isVerifying: true } }));
    
    const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
    try {
      const response = await fetch(cacheBustedUrl, { cache: 'no-store' });
      const text = await response.text();
      
      // Count URLs
      const urlMatches = text.match(/<loc>/g);
      const urlCount = urlMatches ? urlMatches.length : 0;
      
      // Extract first 3 slugs
      const locRegex = /<loc>(.*?)<\/loc>/g;
      const firstItems: string[] = [];
      let match;
      let count = 0;
      while ((match = locRegex.exec(text)) !== null && count < 3) {
        const fullUrl = match[1];
        const slug = fullUrl.split('/').pop() || fullUrl;
        firstItems.push(slug);
        count++;
      }
      
      setSitemapInfo(prev => ({
        ...prev,
        [name]: {
          urlCount,
          firstItems,
          status: response.status,
          contentType: response.headers.get('content-type') || undefined,
          isVerifying: false
        }
      }));
      
      toast({
        title: "Verificatie compleet",
        description: `${name}: ${urlCount} URLs gevonden`,
      });
    } catch (error) {
      console.error('Verification error:', error);
      setSitemapInfo(prev => ({ ...prev, [name]: { isVerifying: false } }));
      toast({
        title: "Verificatie mislukt",
        description: `Kon ${name} niet ophalen`,
        variant: "destructive",
      });
    }
  };

  const sitemapUrls = [
    { name: "Hoofd Sitemap", url: "https://www.musicscan.app/sitemap.xml" },
    { name: "Blog Posts", url: "https://www.musicscan.app/sitemaps/sitemap-blog.xml" },
    { name: "Music Stories", url: "https://www.musicscan.app/sitemaps/sitemap-music-stories.xml" },
    { name: "Products", url: "https://www.musicscan.app/sitemaps/sitemap-products.xml" },
    { name: "Blog Images", url: "https://www.musicscan.app/sitemaps/sitemap-images-blogs.xml" },
    { name: "Story Images", url: "https://www.musicscan.app/sitemaps/sitemap-images-stories.xml" },
    { name: "Product Images", url: "https://www.musicscan.app/sitemaps/sitemap-images-products.xml" },
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
          {sitemapUrls.map((sitemap) => {
            const info = sitemapInfo[sitemap.name];
            return (
              <div
                key={sitemap.name}
                className="flex flex-col gap-2 p-3 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{sitemap.name}</p>
                      <p className="text-sm text-muted-foreground">{sitemap.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => verifySitemap(sitemap.name, sitemap.url)}
                      disabled={info?.isVerifying}
                    >
                      {info?.isVerifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={sitemap.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                
                {info && (
                  <div className="ml-8 space-y-1 text-sm">
                    {info.urlCount !== undefined && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{info.urlCount} URLs</Badge>
                        {info.status && (
                          <Badge variant={info.status === 200 ? "default" : "destructive"}>
                            Status {info.status}
                          </Badge>
                        )}
                      </div>
                    )}
                    {info.firstItems && info.firstItems.length > 0 && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Eerste items:</span>
                        <ul className="list-disc list-inside ml-2">
                          {info.firstItems.map((item, i) => (
                            <li key={i} className="truncate">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
