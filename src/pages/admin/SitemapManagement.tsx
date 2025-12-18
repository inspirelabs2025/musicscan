import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, RefreshCw, Home, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { StaticHTMLGenerator } from "@/components/admin/StaticHTMLGenerator";
import { Separator } from "@/components/ui/separator";

export default function SitemapManagement() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLLM, setIsGeneratingLLM] = useState(false);
  const [llmSitemapInfo, setLlmSitemapInfo] = useState<{ totalUrls?: string; generatedAt?: string } | null>(null);
  const [stats, setStats] = useState<{ blogs: number; stories: number; products: number } | null>(null);
  const [sitemapStatus, setSitemapStatus] = useState<Record<string, { status: number; lastModified?: string; checking?: boolean }>>({});
  const { toast } = useToast();

  const sitemaps = [
    { name: 'Main Index', url: 'https://www.musicscan.app/sitemap.xml', type: 'index' },
    { name: 'Static Pages', url: 'https://www.musicscan.app/sitemaps/sitemap-static.xml', type: 'static' },
    { name: 'Blog Posts', url: 'https://www.musicscan.app/sitemaps/sitemap-blog.xml', type: 'content', count: stats?.blogs },
    { name: 'Music Stories', url: 'https://www.musicscan.app/sitemaps/sitemap-music-stories.xml', type: 'content', count: stats?.stories },
    { name: 'Products', url: 'https://www.musicscan.app/sitemaps/sitemap-products.xml', type: 'content', count: stats?.products },
    { name: 'Blog Images', url: 'https://www.musicscan.app/sitemaps/sitemap-images-blogs.xml', type: 'images' },
    { name: 'Story Images', url: 'https://www.musicscan.app/sitemaps/sitemap-images-stories.xml', type: 'images' },
    { name: 'Product Images', url: 'https://www.musicscan.app/sitemaps/sitemap-images-products.xml', type: 'images' },
  ];

  const fetchStats = async () => {
    try {
      const [blogsResult, storiesResult, productsResult] = await Promise.all([
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('music_stories').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('platform_products').select('id', { count: 'exact', head: true }).eq('status', 'active').not('published_at', 'is', null),
      ]);

      setStats({
        blogs: blogsResult.count || 0,
        stories: storiesResult.count || 0,
        products: productsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkSitemapStatus = async (url: string) => {
    setSitemapStatus(prev => ({
      ...prev,
      [url]: { ...prev[url], checking: true, status: 0 }
    }));

    try {
      const response = await fetch(url, { method: 'HEAD' });
      const lastModified = response.headers.get('Last-Modified');
      setSitemapStatus(prev => ({
        ...prev,
        [url]: { status: response.status, lastModified: lastModified || undefined, checking: false }
      }));
    } catch (error) {
      console.error(`Error checking ${url}:`, error);
      setSitemapStatus(prev => ({
        ...prev,
        [url]: { status: 0, checking: false }
      }));
    }
  };

  const checkAllSitemaps = async () => {
    for (const sitemap of sitemaps) {
      await checkSitemapStatus(sitemap.url);
    }
  };

  useEffect(() => {
    fetchStats();
    checkAllSitemaps();
  }, []);

  const downloadSitemap = (url: string) => {
    window.open(url, '_blank');
  };

  const generateLLMSitemap = async () => {
    setIsGeneratingLLM(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-llm-sitemap');
      
      if (error) throw error;
      
      // Parse response headers if available
      if (data) {
        // Try to extract metadata from the XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'text/xml');
        const urls = xmlDoc.getElementsByTagName('url');
        
        setLlmSitemapInfo({
          totalUrls: urls.length.toString(),
          generatedAt: new Date().toISOString()
        });
      }
      
      toast({
        title: "LLM Sitemap Gegenereerd",
        description: "De LLM-geoptimaliseerde sitemap is succesvol ververst.",
      });
    } catch (error: any) {
      console.error('Error generating LLM sitemap:', error);
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het genereren van de LLM sitemap.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLLM(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
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
            <BreadcrumbPage>Sitemap Management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sitemap Management</h1>
        <p className="text-muted-foreground">
          Alle sitemaps worden nu dynamisch gegenereerd en gehost op musicscan.app
        </p>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          <strong>✅ Nieuwe setup:</strong> Alle sitemaps worden nu rechtstreeks vanaf musicscan.app geserveerd via Vercel rewrites.
          Dit zorgt ervoor dat Google alle URL's kan crawlen en indexeren.
          <div className="mt-2">
            <strong>Google Search Console:</strong> Submit alleen de hoofdsitemap:
            <ul className="list-disc ml-6 mt-2">
              <li><code>https://www.musicscan.app/sitemap.xml</code></li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      <StaticHTMLGenerator />

      <Separator className="my-8" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>LLM Sitemap Management</CardTitle>
          <CardDescription>
            Geoptimaliseerde sitemap voor LLM crawlers (GPTBot, Claude-Web, Google-Extended)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>🤖 LLM Indexatie:</strong> Deze sitemap bevat Markdown versies van alle content
              speciaal geformatteerd voor AI training. Automatisch dagelijks bijgewerkt om 04:00 UTC.
            </AlertDescription>
          </Alert>

          {llmSitemapInfo && (
            <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
              <div className="text-sm">
                <span className="font-semibold">Totaal URLs:</span> {llmSitemapInfo.totalUrls}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold">Laatst gegenereerd:</span>{' '}
                {new Date(llmSitemapInfo.generatedAt).toLocaleString('nl-NL')}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={generateLLMSitemap}
              disabled={isGeneratingLLM}
              className="flex-1"
            >
              {isGeneratingLLM ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Genereren...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenereer Nu
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://www.musicscan.app/sitemap-llm.xml', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold text-sm">LLM Endpoints:</h4>
            <div className="space-y-1 text-xs font-mono text-muted-foreground">
              <div>• /api/llm/plaat-verhaal/[slug].md</div>
              <div>• /api/llm/muziek-verhaal/[slug].md</div>
              <div>• /api/llm/artists/[slug].md</div>
              <div>• /api/llm/anekdotes/[slug].md</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sitemap Status</CardTitle>
          <CardDescription>
            Real-time status van alle sitemaps (automatisch bijgewerkt bij nieuwe content)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={checkAllSitemaps}
            className="mb-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check All Status
          </Button>

          {sitemaps.map((sitemap) => {
            const status = sitemapStatus[sitemap.url];
            const isOk = status?.status === 200;
            const isChecking = status?.checking;
            const hasError = status && !isOk && !isChecking;

            return (
              <div key={sitemap.url} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{sitemap.name}</h3>
                    {isChecking && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Checking...
                      </span>
                    )}
                    {isOk && !isChecking && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Online
                      </span>
                    )}
                    {hasError && (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Error {status.status || 'Failed'}
                      </span>
                    )}
                    {sitemap.count !== undefined && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {sitemap.count} items
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{sitemap.url}</p>
                  {status?.lastModified && (
                    <p className="text-xs text-muted-foreground">Last modified: {status.lastModified}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSitemap(sitemap.url)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Resources</CardTitle>
          <CardDescription>Handige links voor SEO monitoring en testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.open('https://search.google.com/search-console', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Google Search Console
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.open('https://search.google.com/test/rich-results', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Google Rich Results Test
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.open('https://validator.schema.org/', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Schema Markup Validator
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.open('https://www.xml-sitemaps.com/validate-xml-sitemap.html', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            XML Sitemap Validator
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
