import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TestDiscogsFlow() {
  const [loading, setLoading] = useState(false);
  const [newsData, setNewsData] = useState<any>(null);
  const [blogData, setBlogData] = useState<any>(null);
  const { toast } = useToast();

  const fetchNews = async () => {
    setLoading(true);
    try {
      toast({
        title: "Ophalen releases",
        description: "Nieuwe Discogs releases worden opgehaald...",
      });

      const { data, error } = await supabase.functions.invoke('latest-discogs-news');

      if (error) throw error;

      setNewsData(data);
      toast({
        title: "Releases opgehaald!",
        description: `${data.releases?.length || 0} releases gevonden`,
      });

    } catch (error: any) {
      console.error('Error fetching news:', error);
      toast({
        title: "Fout bij ophalen releases",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBlogs = async () => {
    setLoading(true);
    try {
      toast({
        title: "Blog generatie gestart",
        description: "Blogs worden gegenereerd voor nieuwe releases...",
      });

      const { data, error } = await supabase.functions.invoke('discogs-blog-generator');

      if (error) throw error;

      setBlogData(data);
      toast({
        title: "Blogs gegenereerd!",
        description: `${data.processed || 0} blogs succesvol aangemaakt`,
      });

    } catch (error: any) {
      console.error('Error generating blogs:', error);
      toast({
        title: "Fout bij blog generatie",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Discogs → Blog Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Stap 1: Haal Discogs Releases Op</h3>
              <Button 
                onClick={fetchNews} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Bezig..." : "Haal Laatste Releases Op"}
              </Button>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Stap 2: Genereer Blogs</h3>
              <Button 
                onClick={generateBlogs} 
                disabled={loading}
                className="w-full"
                variant="secondary"
              >
                {loading ? "Bezig..." : "Genereer Blogs"}
              </Button>
            </div>
          </div>

          {newsData && (
            <div>
              <h3 className="font-semibold mb-2">Releases Resultaat:</h3>
              <div className="bg-muted p-4 rounded text-sm overflow-auto max-h-64">
                <div className="mb-2">
                  <strong>Aantal releases:</strong> {newsData.releases?.length || 0}
                </div>
                <div className="mb-2">
                  <strong>Cached:</strong> {newsData.cached ? 'Ja' : 'Nee'}
                </div>
                {newsData.releases?.slice(0, 3).map((release: any, i: number) => (
                  <div key={i} className="mb-1">
                    {release.artist} - {release.title} ({release.year})
                  </div>
                ))}
                {newsData.releases?.length > 3 && <div>... en {newsData.releases.length - 3} meer</div>}
              </div>
            </div>
          )}

          {blogData && (
            <div>
              <h3 className="font-semibold mb-2">Blog Generatie Resultaat:</h3>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-64">
                {JSON.stringify(blogData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}