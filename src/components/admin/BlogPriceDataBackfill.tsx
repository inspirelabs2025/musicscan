import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, Database } from 'lucide-react';

export function BlogPriceDataBackfill() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleBackfillPriceData = async () => {
    setIsProcessing(true);
    try {
      console.log('Starting price data backfill for blog posts...');
      
      // Get all blog posts with discogs_id
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('id, yaml_frontmatter, album_id, album_type')
        .not('yaml_frontmatter->discogs_id', 'is', null);

      if (blogError) throw blogError;

      console.log(`Found ${blogPosts?.length} blog posts with discogs_id`);

      // Extract unique discogs_ids with proper type handling
      const discogsIds = blogPosts
        ?.map(post => {
          const frontmatter = post.yaml_frontmatter as Record<string, any>;
          return frontmatter?.discogs_id;
        })
        .filter(id => id && id !== '—')
        .map(id => typeof id === 'string' ? parseInt(id) : id)
        .filter(id => !isNaN(id) && id > 0);

      const uniqueDiscogsIds = [...new Set(discogsIds)];

      console.log(`Triggering price collection for ${uniqueDiscogsIds.length} unique albums`);

      // Trigger price collection specifically for these albums
      const { data, error } = await supabase.functions.invoke('collect-price-history', {
        body: { 
          manual: true,
          target_discogs_ids: uniqueDiscogsIds,
          priority: 'high'
        }
      });

      if (error) throw error;

      setResult({
        blogPostsFound: blogPosts?.length || 0,
        uniqueAlbums: uniqueDiscogsIds.length,
        processed: data?.processed || 0,
        successful: data?.successful || 0,
        errors: data?.errors || 0
      });

      toast({
        title: "Prijsdata backfill gestart!",
        description: `${uniqueDiscogsIds.length} albums worden verwerkt voor blog posts`,
      });
    } catch (error) {
      console.error('Error in price data backfill:', error);
      toast({
        title: "Fout bij backfill",
        description: "Er is een probleem opgetreden bij het ophalen van prijsdata",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Blog Prijsdata Backfill
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Start prijsdata verzameling voor alle albums die in blog posts voorkomen. 
          Dit vult de prijshistorie grafieken in de blog posts.
        </p>
        
        <Button 
          onClick={handleBackfillPriceData} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isProcessing ? 'Verwerken...' : 'Start Backfill'}
        </Button>

        {result && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Resultaat:</h4>
            <div className="text-sm space-y-1">
              <p>Blog posts gevonden: {result.blogPostsFound}</p>
              <p>Unieke albums: {result.uniqueAlbums}</p>
              <p>Verwerkt: {result.processed}</p>
              <p>Succesvol: {result.successful}</p>
              <p>Fouten: {result.errors}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}