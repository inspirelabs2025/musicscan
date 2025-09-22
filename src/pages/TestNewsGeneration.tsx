import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const TestNewsGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const generateNews = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log("Calling music-news-perplexity function...");
      
      const { data, error } = await supabase.functions.invoke('music-news-perplexity');
      
      if (error) {
        console.error("Function error:", error);
        toast({
          title: "Error",
          description: `Failed to generate news: ${error.message}`,
          variant: "destructive",
        });
        setResult({ error: error.message });
      } else {
        console.log("Function success:", data);
        setResult(data);
        toast({
          title: "Success",
          description: `Generated ${data.blogPosts?.length || 0} blog posts`,
        });
        
        // Refresh the page after a delay to show updated news
        setTimeout(() => {
          window.location.href = '/news';
        }, 2000);
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: `Unexpected error: ${error.message}`,
        variant: "destructive",
      });
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test News Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateNews} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate New Rewritten Blog Posts
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestNewsGeneration;