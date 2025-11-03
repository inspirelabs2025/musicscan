import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function PriceChangeMonitor() {
  const { data: priceStats } = useQuery({
    queryKey: ['price-change-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_change_log')
        .select('*')
        .order('changed_at', { ascending: false });
      
      if (error) throw error;
      
      const last24h = data?.filter(item => 
        new Date(item.changed_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;
      
      const last7d = data?.filter(item => 
        new Date(item.changed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;
      
      const increases = data?.filter(item => 
        item.price_change_percent && item.price_change_percent > 0
      ).length || 0;
      
      const decreases = data?.filter(item => 
        item.price_change_percent && item.price_change_percent < 0
      ).length || 0;
      
      return { total: data?.length || 0, last24h, last7d, increases, decreases };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: recentChanges } = useQuery({
    queryKey: ['price-changes-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_change_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const getTrendIcon = (percent: number | null) => {
    if (!percent) return <Minus className="h-4 w-4" />;
    if (percent > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (percent < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Totaal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{priceStats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Laatste 24u</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{priceStats?.last24h || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Laatste 7d</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{priceStats?.last7d || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Stijgingen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{priceStats?.increases || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dalingen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{priceStats?.decreases || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recente Prijswijzigingen</CardTitle>
          <CardDescription>De laatste 10 prijswijzigingen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentChanges?.map((change) => (
              <div
                key={change.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{change.scan_type}</Badge>
                    {change.discogs_id && (
                      <span className="text-sm text-muted-foreground">
                        Discogs #{change.discogs_id}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="line-through text-muted-foreground">
                      €{change.old_price?.toFixed(2)}
                    </span>
                    <span className="font-medium">→</span>
                    <span className="font-medium">
                      €{change.new_price?.toFixed(2)}
                    </span>
                    {change.price_change_percent && (
                      <span className={`flex items-center gap-1 ${
                        change.price_change_percent > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {getTrendIcon(change.price_change_percent)}
                        {Math.abs(change.price_change_percent).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(change.changed_at).toLocaleString('nl-NL')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
