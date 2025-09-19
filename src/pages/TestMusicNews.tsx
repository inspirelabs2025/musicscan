import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TestMusicNews = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testPerplexityAPI = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Testing Perplexity API directly...');
      
      const { data, error } = await supabase.functions.invoke('music-news-perplexity');
      
      if (error) {
        console.error('❌ Perplexity API Error:', error);
        setResult({ error: error.message, type: 'error' });
        toast({
          title: "API Test Gefaald",
          description: `Fout: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('✅ Perplexity API Success:', data);
        setResult({ data, type: 'success', count: Array.isArray(data) ? data.length : 0 });
        toast({
          title: "API Test Geslaagd",
          description: `${Array.isArray(data) ? data.length : 0} nieuws items opgehaald`,
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error('❌ Test Error:', err);
      setResult({ error: err.message, type: 'error' });
      toast({
        title: "Test Fout",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerNewsUpdate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔄 Triggering daily news update...');
      
      const { data, error } = await supabase.functions.invoke('daily-news-update');
      
      if (error) {
        console.error('❌ News Update Error:', error);
        setResult({ error: error.message, type: 'error' });
        toast({
          title: "Update Gefaald",
          description: `Fout: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log('✅ News Update Success:', data);
        setResult({ data, type: 'success' });
        toast({
          title: "Update Geslaagd",
          description: `Cache bijgewerkt: ${data?.cache_updated ? 'Ja' : 'Nee'}`,
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error('❌ Update Error:', err);
      setResult({ error: err.message, type: 'error' });
      toast({
        title: "Update Fout",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Muzieknieuws API Test</h1>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Perplexity API Test</CardTitle>
              <CardDescription>
                Test de gerepareerde Perplexity integratie direct
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testPerplexityAPI}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Perplexity API'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>News Update Trigger</CardTitle>
              <CardDescription>
                Trigger een volledige nieuws update
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={triggerNewsUpdate}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                {loading ? 'Updating...' : 'Trigger News Update'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className={result.type === 'error' ? 'text-destructive' : 'text-success'}>
                Test Resultaat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestMusicNews;