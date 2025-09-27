import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { generateSitemap, getStaticRoutes, getBlogPostRoutes, getMusicStoryRoutes, type SitemapEntry } from '@/utils/sitemap';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw } from 'lucide-react';

export const SitemapGenerator: React.FC = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generateFullSitemap = async () => {
    setIsGenerating(true);
    try {
      // Get static routes
      const staticRoutes = getStaticRoutes();
      
      // Get blog post routes
      const blogRoutes = await getBlogPostRoutes();
      
      // Get music story routes
      const musicStoryRoutes = await getMusicStoryRoutes();
      
      // Combine all routes
      const allRoutes = [...staticRoutes, ...blogRoutes, ...musicStoryRoutes];
      
      // Generate sitemap XML
      const sitemapXml = generateSitemap(allRoutes);
      
      // Download sitemap as file
      const blob = new Blob([sitemapXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sitemap gegenereerd!",
        description: `Sitemap met ${allRoutes.length} URL's is gedownload.`,
      });
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast({
        title: "Fout bij genereren sitemap",
        description: "Er is een fout opgetreden bij het genereren van de sitemap.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBlogSitemap = async () => {
    setIsGenerating(true);
    try {
      const blogRoutes = await getBlogPostRoutes();
      const sitemapXml = generateSitemap(blogRoutes);
      
      const blob = new Blob([sitemapXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap-blog.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Blog sitemap gegenereerd!",
        description: `Blog sitemap met ${blogRoutes.length} posts is gedownload.`,
      });
    } catch (error) {
      console.error('Error generating blog sitemap:', error);
      toast({
        title: "Fout bij genereren blog sitemap",
        description: "Er is een fout opgetreden bij het genereren van de blog sitemap.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMusicStoriesSitemap = async () => {
    setIsGenerating(true);
    try {
      const musicStoryRoutes = await getMusicStoryRoutes();
      const sitemapXml = generateSitemap(musicStoryRoutes);
      
      const blob = new Blob([sitemapXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap-music-stories.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Muziek verhalen sitemap gegenereerd!",
        description: `Muziek verhalen sitemap met ${musicStoryRoutes.length} verhalen is gedownload.`,
      });
    } catch (error) {
      console.error('Error generating music stories sitemap:', error);
      toast({
        title: "Fout bij genereren muziek verhalen sitemap",
        description: "Er is een fout opgetreden bij het genereren van de muziek verhalen sitemap.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          SEO Sitemap Generator
        </CardTitle>
        <CardDescription>
          Genereer sitemaps voor betere zoekmachine optimalisatie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Button 
            onClick={generateFullSitemap}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Volledige Sitemap
          </Button>
          
          <Button 
            onClick={generateBlogSitemap}
            disabled={isGenerating}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Blog Sitemap
          </Button>

          <Button 
            onClick={generateMusicStoriesSitemap}
            disabled={isGenerating}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Muziek Verhalen
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>• Volledige sitemap bevat alle statische pagina's + blog posts + muziek verhalen</p>
          <p>• Blog sitemap bevat alleen gepubliceerde blog posts</p>
          <p>• Muziek verhalen sitemap bevat alleen gepubliceerde muziek verhalen</p>
          <p>• Upload de gegenereerde sitemaps naar je server root</p>
        </div>
      </CardContent>
    </Card>
  );
};