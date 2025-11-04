import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Music, Package, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const StaticHTMLGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ success: 0, failed: 0, total: 0 });

  const generateStaticHTML = async (contentType: 'blog_post' | 'music_story' | 'product') => {
    setIsGenerating(true);
    setProgress(0);
    setStats({ success: 0, failed: 0, total: 0 });

    try {
      // Fetch ALL published content (not limited to 1000)
      let items: any[] = [];
      
      if (contentType === 'blog_post') {
        // Get total count first
        const { count, error: countError } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true);
        
        if (countError) throw countError;
        
        // Fetch in batches of 1000
        const batchSize = 1000;
        for (let offset = 0; offset < (count || 0); offset += batchSize) {
          const { data, error } = await supabase
            .from('blog_posts')
            .select('slug')
            .eq('is_published', true)
            .range(offset, offset + batchSize - 1);
          
          if (error) throw error;
          if (data) items.push(...data);
        }
      } else if (contentType === 'music_story') {
        // Get total count first
        const { count, error: countError } = await supabase
          .from('music_stories')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true);
        
        if (countError) throw countError;
        
        // Fetch in batches of 1000
        const batchSize = 1000;
        for (let offset = 0; offset < (count || 0); offset += batchSize) {
          const { data, error } = await supabase
            .from('music_stories')
            .select('slug')
            .eq('is_published', true)
            .range(offset, offset + batchSize - 1);
          
          if (error) throw error;
          if (data) items.push(...data);
        }
      } else if (contentType === 'product') {
        // Get total count first
        const { count, error: countError } = await supabase
          .from('platform_products')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .not('published_at', 'is', null);
        
        if (countError) throw countError;
        
        // Fetch in batches of 1000
        const batchSize = 1000;
        for (let offset = 0; offset < (count || 0); offset += batchSize) {
          const { data, error } = await supabase
            .from('platform_products')
            .select('slug')
            .eq('status', 'active')
            .not('published_at', 'is', null)
            .range(offset, offset + batchSize - 1);
          
          if (error) throw error;
          if (data) items.push(...data);
        }
      }

      console.log(`Generating HTML for ${items.length} ${contentType}s`);
      setStats(prev => ({ ...prev, total: items.length }));

      // Generate static HTML for each item
      for (let i = 0; i < items.length; i++) {
        try {
          const { error } = await supabase.functions.invoke('generate-static-html', {
            body: {
              contentType,
              slug: items[i].slug,
              forceRegenerate: true,
            },
          });

          if (error) throw error;
          
          setStats(prev => ({ ...prev, success: prev.success + 1 }));
        } catch (err) {
          console.error(`Failed to generate HTML for ${items[i].slug}:`, err);
          setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        }

        setProgress(((i + 1) / items.length) * 100);
      }

      toast({
        title: "Generatie voltooid",
        description: `${stats.success + 1} van ${items.length} items succesvol gegenereerd`,
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Fout bij genereren",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAll = async () => {
    setIsGenerating(true);
    try {
      await generateStaticHTML('blog_post');
      await generateStaticHTML('music_story');
      await generateStaticHTML('product');
      
      toast({
        title: "Alle content gegenereerd",
        description: "Static HTML voor alle content types is gegenereerd",
      });
    } catch (error) {
      console.error('Error generating all:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Static HTML Generator (SEO)
        </CardTitle>
        <CardDescription>
          Genereer pre-rendered HTML voor crawlers en betere SEO indexatie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Voortgang</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>✅ Succesvol: {stats.success}</span>
              <span>❌ Mislukt: {stats.failed}</span>
              <span>📊 Totaal: {stats.total}</span>
            </div>
          </div>
        )}

        {/* Individual Generators */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Blog Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateStaticHTML('blog_post')}
                disabled={isGenerating}
                className="w-full"
                variant="secondary"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  'Genereer HTML'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Music className="h-4 w-4" />
                Music Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateStaticHTML('music_story')}
                disabled={isGenerating}
                className="w-full"
                variant="secondary"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  'Genereer HTML'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateStaticHTML('product')}
                disabled={isGenerating}
                className="w-full"
                variant="secondary"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  'Genereer HTML'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generate All */}
        <div className="pt-4 border-t">
          <Button
            onClick={generateAll}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Alles genereren...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Genereer Alles (Blogs + Stories + Products)
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>ℹ️ Static HTML wordt automatisch gegenereerd bij publicatie van nieuwe content</p>
          <p>🔄 Deze tool is voor bulk regeneratie of als automatische generatie faalt</p>
          <p>📦 HTML wordt opgeslagen in de 'sitemaps' storage bucket</p>
          <p>🤖 Crawlers krijgen direct deze HTML te zien, gebruikers krijgen de React app</p>
        </div>
      </CardContent>
    </Card>
  );
};
