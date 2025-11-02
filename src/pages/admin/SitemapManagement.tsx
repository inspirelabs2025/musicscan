import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, RefreshCw, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SitemapManagement() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<{ blogs: number; stories: number } | null>(null);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const [blogsResult, storiesResult] = await Promise.all([
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('music_stories').select('id', { count: 'exact', head: true }).eq('is_published', true),
      ]);

      setStats({
        blogs: blogsResult.count || 0,
        stories: storiesResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateSitemap = async (type: 'main' | 'blog' | 'stories') => {
    try {
      setIsGenerating(true);
      
      const path = type === 'main' ? '' : type === 'blog' ? 'sitemap-blog' : 'sitemap-music-stories';
      const { data, error } = await supabase.functions.invoke('generate-sitemaps', {
        body: { type: path },
      });

      if (error) throw error;

      toast({
        title: "Sitemap gegenereerd",
        description: `${type === 'main' ? 'Hoofd' : type === 'blog' ? 'Blog' : 'Music Stories'} sitemap succesvol gegenereerd`,
      });

      await fetchStats();
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast({
        variant: "destructive",
        title: "Fout bij genereren",
        description: "Er is een fout opgetreden bij het genereren van de sitemap",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSitemap = (type: string) => {
    const url = type === 'main' 
      ? 'https://www.musicscan.app/sitemap.xml'
      : type === 'blog'
      ? 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/generate-sitemaps?path=sitemap-blog'
      : 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/generate-sitemaps?path=sitemap-music-stories';
    
    window.open(url, '_blank');
  };

  useState(() => {
    fetchStats();
  });

  return (
    <div className="container mx-auto py-8 px-4">
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
            <li>Blog sitemap: <code>https://www.musicscan.app/api/sitemap-blog.xml</code></li>
            <li>Stories sitemap: <code>https://www.musicscan.app/api/sitemap-music-stories.xml</code></li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Hoofdsitemap</CardTitle>
            <CardDescription>Sitemap index met alle submaps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => generateSitemap('main')} 
              disabled={isGenerating}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Genereer
            </Button>
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
          <CardContent className="space-y-3">
            <Button 
              onClick={() => generateSitemap('blog')} 
              disabled={isGenerating}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Genereer
            </Button>
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
          <CardContent className="space-y-3">
            <Button 
              onClick={() => generateSitemap('stories')} 
              disabled={isGenerating}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Genereer
            </Button>
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
