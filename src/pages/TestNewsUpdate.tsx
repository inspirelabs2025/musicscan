import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export default function TestNewsUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const triggerNewsUpdate = async () => {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      console.log("🔄 Triggering news update...");
      
      const { data, error } = await supabase.functions.invoke('daily-news-update');
      
      if (error) {
        throw error;
      }

      setResult(data);
      toast.success("News update voltooid!");
      
      // Refetch cache data after update
      refetch();
    } catch (err: any) {
      console.error("❌ News update failed:", err);
      setError(err.message);
      toast.error(`Update mislukt: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const { data: cacheData, refetch } = useQuery({
    queryKey: ["news-cache-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_cache')
        .select('source, cached_at, expires_at')
        .order('cached_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL');
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">News Update Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Manual News Update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={triggerNewsUpdate} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Bezig met updaten..." : "Trigger News Update"}
          </Button>
          
          {result && (
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <h3 className="font-semibold text-green-800">Update Succesvol</h3>
              <pre className="text-sm mt-2 text-green-700">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <h3 className="font-semibold text-red-800">Fout opgetreden</h3>
              <p className="text-sm mt-2 text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Status</CardTitle>
        </CardHeader>
        <CardContent>
          {cacheData ? (
            <div className="space-y-4">
              {cacheData.map((cache, index) => (
                <div key={index} className="border rounded p-3 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold capitalize">{cache.source}</h4>
                      <p className="text-sm text-muted-foreground">
                        Cache: {formatDate(cache.cached_at)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Verloopt: {formatDate(cache.expires_at)}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      new Date(cache.expires_at) > new Date() 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {new Date(cache.expires_at) > new Date() ? 'Actief' : 'Verlopen'}
                    </div>
                  </div>
                </div>
              ))}
              {cacheData.length === 0 && (
                <p className="text-muted-foreground">Geen cache data gevonden</p>
              )}
            </div>
          ) : (
            <p>Cache data laden...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}