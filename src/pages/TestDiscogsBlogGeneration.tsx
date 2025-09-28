import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TestDiscogsBlogGeneration() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const generateBlogs = async () => {
    setLoading(true);
    setResult(null);

    try {
      toast({
        title: "Blog generatie gestart",
        description: "Nieuwe Discogs releases worden verwerkt...",
      });

      const { data, error } = await supabase.functions.invoke('discogs-blog-generator');

      if (error) {
        throw error;
      }

      setResult(data);

      toast({
        title: "Blogs gegenereerd!",
        description: `${data.processed || 0} blogs succesvol aangemaakt`,
      });

    } catch (error: any) {
      console.error('Error generating blogs:', error);
      toast({
        title: "Fout bij blog generatie",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Discogs Blog Generatie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Dit genereert automatisch blogs voor nieuwe Discogs releases die in de afgelopen 24 uur zijn toegevoegd.
          </p>
          
          <Button 
            onClick={generateBlogs} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Blogs genereren..." : "Genereer Blogs voor Nieuwe Releases"}
          </Button>

          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Resultaat:</h3>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}