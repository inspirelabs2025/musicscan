import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, RefreshCw, Download, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function SitemapManagement() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<{ blogs: number; stories: number; products: number } | null>(null);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const [blogsResult, storiesResult, productsResult] = await Promise.all([
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('music_stories').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('platform_products').select('id', { count: 'exact', head: true }).eq('media_type', 'art').eq('status', 'active').not('published_at', 'is', null),
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

  const generateAllSitemaps = async () => {
    try {
      setIsGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('generate-static-sitemaps');

      if (error) throw error;

      toast({
        title: "Sitemaps gegenereerd",
        description: `Alle sitemaps succesvol gegenereerd: ${data?.stats?.blogPosts || 0} blog posts, ${data?.stats?.musicStories || 0} music stories, ${data?.stats?.artProducts || 0} producten`,
      });

      await fetchStats();
    } catch (error) {
      console.error('Error generating sitemaps:', error);
      toast({
        variant: "destructive",
        title: "Fout bij genereren",
        description: "Er is een fout opgetreden bij het genereren van de sitemaps",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSitemap = (type: string) => {
    const urls = {
      main: 'https://www.musicscan.app/sitemap.xml',
      blog: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-blog.xml',
      stories: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-music-stories.xml',
      products: 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-products.xml',
    };
    
    window.open(urls[type as keyof typeof urls], '_blank');
  };

  useState(() => {
    fetchStats();
  });

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
          Genereer en beheer XML sitemaps voor betere SEO en indexering door zoekmachines
        </p>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          <strong>Google Search Console:</strong> Submit deze sitemaps in GSC voor optimale indexering:
          <ul className="list-disc ml-6 mt-2">
            <li>Hoofdsitemap: <code>https://www.musicscan.app/sitemap.xml</code></li>
            <li>Blog sitemap: <code>https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-blog.xml</code></li>
            <li>Stories sitemap: <code>https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-music-stories.xml</code></li>
            <li>Producten sitemap: <code>https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-products.xml</code></li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Alle Sitemaps Genereren</CardTitle>
          <CardDescription>
            Genereer blog en music stories sitemaps tegelijk (wordt automatisch elke nacht om 2:00 uur uitgevoerd)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={generateAllSitemaps} 
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isGenerating ? 'Bezig met genereren...' : 'Genereer Alle Sitemaps'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Hoofdsitemap</CardTitle>
            <CardDescription>Sitemap index met alle submaps</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => downloadSitemap('main')} 
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blog Sitemap</CardTitle>
            <CardDescription>
              {stats ? `${stats.blogs} gepubliceerde posts` : 'Laden...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => downloadSitemap('blog')} 
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Music Stories Sitemap</CardTitle>
            <CardDescription>
              {stats ? `${stats.stories} gepubliceerde verhalen` : 'Laden...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => downloadSitemap('stories')} 
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Producten Sitemap</CardTitle>
            <CardDescription>
              {stats ? `${stats.products} metaalprint producten` : 'Laden...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => downloadSitemap('products')} 
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Preview
            </Button>
          </CardContent>
        </Card>
      </div>

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
        </CardContent>
      </Card>
    </div>
  );
}
