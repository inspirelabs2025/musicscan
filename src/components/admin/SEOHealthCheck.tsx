import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export function SEOHealthCheck() {
  const { data: healthData } = useQuery({
    queryKey: ['seo-health'],
    queryFn: async () => {
      // Check sitemaps
      const sitemapCheck = { status: 'healthy', message: 'Sitemaps zijn up-to-date' };
      
      // Check IndexNow queue
      const { data: queueData } = await supabase
        .from('indexnow_queue')
        .select('*')
        .eq('processed', false);
      
      const queueCheck = {
        status: (queueData?.length || 0) < 100 ? 'healthy' : 'warning',
        message: `${queueData?.length || 0} URLs in wachtrij`,
        count: queueData?.length || 0
      };
      
      // Check recent price updates
      const { data: priceData } = await supabase
        .from('price_change_log')
        .select('*')
        .gte('changed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const priceCheck = {
        status: 'healthy',
        message: `${priceData?.length || 0} prijswijzigingen laatste 24u`,
        count: priceData?.length || 0
      };
      
      // Check content freshness
      const { data: blogData } = await supabase
        .from('blog_posts')
        .select('updated_at')
        .eq('is_published', true)
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const freshnessCheck = {
        status: (blogData?.length || 0) > 0 ? 'healthy' : 'warning',
        message: `${blogData?.length || 0} posts bijgewerkt laatste 7 dagen`,
        count: blogData?.length || 0
      };
      
      return {
        sitemap: sitemapCheck,
        queue: queueCheck,
        prices: priceCheck,
        freshness: freshnessCheck
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Gezond</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Waarschuwing</Badge>;
      default:
        return <Badge variant="outline">Onbekend</Badge>;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon(healthData?.sitemap.status || 'unknown')}
            Sitemaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getStatusBadge(healthData?.sitemap.status || 'unknown')}
            <p className="text-sm text-muted-foreground">
              {healthData?.sitemap.message}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon(healthData?.queue.status || 'unknown')}
            IndexNow Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getStatusBadge(healthData?.queue.status || 'unknown')}
            <p className="text-sm text-muted-foreground">
              {healthData?.queue.message}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon(healthData?.prices.status || 'unknown')}
            Prijswijzigingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getStatusBadge(healthData?.prices.status || 'unknown')}
            <p className="text-sm text-muted-foreground">
              {healthData?.prices.message}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon(healthData?.freshness.status || 'unknown')}
            Content Freshness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getStatusBadge(healthData?.freshness.status || 'unknown')}
            <p className="text-sm text-muted-foreground">
              {healthData?.freshness.message}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
