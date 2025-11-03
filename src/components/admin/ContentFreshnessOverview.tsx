import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export function ContentFreshnessOverview() {
  const { data: blogStats } = useQuery({
    queryKey: ['blog-freshness'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('updated_at, yaml_frontmatter')
        .eq('is_published', true);
      
      if (error) throw error;
      
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentlyUpdated = data?.filter(post => 
        new Date(post.updated_at) > sevenDaysAgo
      ).length || 0;
      
      const monthlyUpdated = data?.filter(post => 
        new Date(post.updated_at) > thirtyDaysAgo
      ).length || 0;
      
      const withPriceUpdates = data?.filter(post => 
        post.yaml_frontmatter?.last_price_update
      ).length || 0;
      
      return { 
        total: data?.length || 0, 
        recentlyUpdated, 
        monthlyUpdated,
        withPriceUpdates
      };
    },
  });

  const { data: storyStats } = useQuery({
    queryKey: ['story-freshness'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select('updated_at')
        .eq('is_published', true);
      
      if (error) throw error;
      
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentlyUpdated = data?.filter(story => 
        new Date(story.updated_at) > sevenDaysAgo
      ).length || 0;
      
      const monthlyUpdated = data?.filter(story => 
        new Date(story.updated_at) > thirtyDaysAgo
      ).length || 0;
      
      return { total: data?.length || 0, recentlyUpdated, monthlyUpdated };
    },
  });

  const { data: productStats } = useQuery({
    queryKey: ['product-freshness'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_products')
        .select('updated_at')
        .eq('status', 'active');
      
      if (error) throw error;
      
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentlyUpdated = data?.filter(product => 
        new Date(product.updated_at) > sevenDaysAgo
      ).length || 0;
      
      const monthlyUpdated = data?.filter(product => 
        new Date(product.updated_at) > thirtyDaysAgo
      ).length || 0;
      
      return { total: data?.length || 0, recentlyUpdated, monthlyUpdated };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>Content freshness statistieken</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Totaal</span>
            <Badge>{blogStats?.total || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Laatste 7 dagen</span>
            <Badge variant="secondary">{blogStats?.recentlyUpdated || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Laatste 30 dagen</span>
            <Badge variant="outline">{blogStats?.monthlyUpdated || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Met prijs updates</span>
            <Badge variant="outline" className="bg-green-50">
              {blogStats?.withPriceUpdates || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Music Stories</CardTitle>
          <CardDescription>Content freshness statistieken</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Totaal</span>
            <Badge>{storyStats?.total || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Laatste 7 dagen</span>
            <Badge variant="secondary">{storyStats?.recentlyUpdated || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Laatste 30 dagen</span>
            <Badge variant="outline">{storyStats?.monthlyUpdated || 0}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Producten</CardTitle>
          <CardDescription>Content freshness statistieken</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Totaal</span>
            <Badge>{productStats?.total || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Laatste 7 dagen</span>
            <Badge variant="secondary">{productStats?.recentlyUpdated || 0}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Laatste 30 dagen</span>
            <Badge variant="outline">{productStats?.monthlyUpdated || 0}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
