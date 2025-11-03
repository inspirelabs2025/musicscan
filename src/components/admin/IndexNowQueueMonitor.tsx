import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

export function IndexNowQueueMonitor() {
  const { data: queueStats } = useQuery({
    queryKey: ['indexnow-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indexnow_queue')
        .select('*');
      
      if (error) throw error;
      
      const pending = data?.filter(item => !item.processed).length || 0;
      const processed = data?.filter(item => item.processed).length || 0;
      const recentlyProcessed = data?.filter(item => 
        item.processed && 
        item.processed_at && 
        new Date(item.processed_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;
      
      return { pending, processed, recentlyProcessed, total: data?.length || 0 };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentItems } = useQuery({
    queryKey: ['indexnow-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('indexnow_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Totaal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Wachtrij</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{queueStats?.pending || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verwerkt (24u)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{queueStats?.recentlyProcessed || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Totaal Verwerkt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats?.processed || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recente IndexNow Submissies</CardTitle>
          <CardDescription>De laatste 10 URLs in de queue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentItems?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.url}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{item.content_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('nl-NL')}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  {item.processed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
