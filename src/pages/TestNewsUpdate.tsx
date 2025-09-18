import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Clock, Calendar } from "lucide-react";

export default function TestNewsUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cacheData, setCacheData] = useState<any[]>([]);

  const triggerNewsUpdate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 Triggering daily news update...');
      
      const { data, error: invokeError } = await supabase.functions.invoke('daily-news-update');
      
      if (invokeError) {
        throw invokeError;
      }

      console.log('✅ Daily news update result:', data);
      setResult(data);
      
      // Refresh cache data
      await fetchCacheData();
      
    } catch (err) {
      console.error('❌ Error triggering news update:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCacheData = async () => {
    try {
      const { data, error } = await supabase
        .from('news_cache')
        .select('*')
        .order('cached_at', { ascending: false });

      if (error) throw error;
      setCacheData(data || []);
    } catch (err) {
      console.error('Error fetching cache data:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Test Dagelijkse Nieuws Update
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={triggerNewsUpdate} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? 'Nieuws Ophalen...' : 'Start Nieuws Update'}
            </Button>

            <Button 
              onClick={fetchCacheData} 
              variant="outline"
              className="w-full"
            >
              Ververs Cache Status
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-green-800 mb-2">Update Resultaat:</h4>
                <pre className="text-xs text-green-700 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nieuws Cache Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cacheData.length === 0 ? (
            <p className="text-muted-foreground">Geen cache data gevonden. Klik op 'Start Nieuws Update' om data op te halen.</p>
          ) : (
            <div className="space-y-4">
              {cacheData.map((cache) => (
                <div key={cache.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{cache.source}</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(cache.cached_at)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Verloopt: {formatDate(cache.expires_at)}</p>
                    <p>Items: {Array.isArray(cache.content) ? cache.content.length : 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}