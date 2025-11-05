import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle, ExternalLink, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function GoogleIndexMonitor() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: indexStats, refetch } = useQuery({
    queryKey: ['google-index-stats'],
    queryFn: async () => {
      // Get total published blog posts
      const { count: totalBlogs } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('published', true);

      // Get recent IndexNow submissions
      const { data: recentSubmissions } = await supabase
        .from('indexnow_submissions')
        .select('submitted_at, status_code, urls_count')
        .order('submitted_at', { ascending: false })
        .limit(1);

      // Get queue status
      const { count: pendingQueue } = await supabase
        .from('indexnow_queue')
        .select('*', { count: 'exact', head: true })
        .eq('processed', false);

      const { count: processedQueue } = await supabase
        .from('indexnow_queue')
        .select('*', { count: 'exact', head: true })
        .eq('processed', true);

      return {
        totalPublished: totalBlogs || 0,
        pendingIndexing: pendingQueue || 0,
        submittedToIndexNow: processedQueue || 0,
        lastSubmission: recentSubmissions?.[0]?.submitted_at || null,
        lastSubmissionStatus: recentSubmissions?.[0]?.status_code || null,
        lastSubmissionCount: recentSubmissions?.[0]?.urls_count || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const indexingRate = indexStats?.totalPublished 
    ? ((indexStats.submittedToIndexNow / indexStats.totalPublished) * 100).toFixed(1)
    : 0;

  const processQueue = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('indexnow-processor');
      
      if (error) throw error;
      
      toast.success(`IndexNow verwerkt! ${data?.urlsSubmitted || 0} URLs ingediend bij Google/Bing`);
      await refetch();
    } catch (error) {
      console.error('Error processing IndexNow queue:', error);
      toast.error('Fout bij verwerken IndexNow queue');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gepubliceerde Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indexStats?.totalPublished || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Totaal blog posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Wacht op Indexering</CardTitle>
              {indexStats?.pendingIndexing && indexStats.pendingIndexing > 0 && (
                <Button 
                  onClick={processQueue} 
                  disabled={isProcessing}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Nu verwerken
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {indexStats?.pendingIndexing || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In wachtrij {indexStats?.pendingIndexing && indexStats.pendingIndexing > 0 && '⚠️'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ingediend bij IndexNow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {indexStats?.submittedToIndexNow || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">URLs verzonden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Indexering Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indexingRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Coverage rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Search Console Status</CardTitle>
          <CardDescription>Huidige indexeringsstatus volgens screenshots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Ontdekt via Sitemap</p>
                <p className="text-2xl font-bold mt-1">1,140</p>
                <p className="text-xs text-muted-foreground mt-1">Pagina's gevonden</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Geïndexeerd</p>
                <p className="text-2xl font-bold mt-1">18</p>
                <p className="text-xs text-muted-foreground mt-1">In Google index</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Niet Geïndexeerd</p>
                <p className="text-2xl font-bold mt-1">28</p>
                <p className="text-xs text-muted-foreground mt-1">Diverse redenen</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Redenen voor niet-indexering:</p>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Pagina met omleidingen</span>
                <Badge variant="outline">8 pagina's</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Soft 404</span>
                <Badge variant="outline">8 pagina's</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Ontdekt - momenteel niet geïndexeerd</span>
                <Badge variant="outline">10 pagina's</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">Gemarkeerd als 'noindex'</span>
                <Badge variant="outline">2 pagina's</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://search.google.com/search-console" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Google Search Console
              </a>
            </Button>
          </div>

          {indexStats?.lastSubmission ? (
            <div className="flex items-center gap-2 pt-2 text-xs">
              <span className="text-muted-foreground">
                Laatste IndexNow submission: {new Date(indexStats.lastSubmission).toLocaleString('nl-NL')}
              </span>
              {indexStats.lastSubmissionStatus && (
                <Badge 
                  variant={indexStats.lastSubmissionStatus === 200 ? "default" : "destructive"}
                  className="h-5"
                >
                  HTTP {indexStats.lastSubmissionStatus}
                </Badge>
              )}
              {indexStats.lastSubmissionCount > 0 && (
                <span className="text-muted-foreground">
                  ({indexStats.lastSubmissionCount} URLs)
                </span>
              )}
            </div>
          ) : (
            <div className="pt-2 text-xs text-destructive font-medium">
              ⚠️ Nog nooit IndexNow submission gedaan! {indexStats?.pendingIndexing || 0} URLs wachten.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aanbevelingen voor Snellere Indexering</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">IndexNow Processor Actief</p>
                <p className="text-sm text-muted-foreground">
                  Automatische batch processing draait elke 5 minuten
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Content Kwaliteit Verbeteren</p>
                <p className="text-sm text-muted-foreground">
                  Voeg structured data toe en optimaliseer meta descriptions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Soft 404 en Redirects Oplossen</p>
                <p className="text-sm text-muted-foreground">
                  Check de 16 pagina's met redirect/404 issues in Search Console
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
