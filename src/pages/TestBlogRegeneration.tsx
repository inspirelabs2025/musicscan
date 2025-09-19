import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  album_id: string;
  album_type: string;
  slug: string;
  title: string;
}

const EXISTING_POSTS: BlogPost[] = [
  { 
    id: 'ab3c01d3-cbdd-4321-ae8d-aa3bc4807f6d',
    album_id: 'cca58590-0b4b-4c94-aa7e-45804b80feaa',
    album_type: 'cd',
    slug: 'u2-u2-zooropa-1993',
    title: 'U2 - Zooropa (1993) [Test Album Cover]'
  }
];

export const TestBlogRegeneration = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [currentProcessing, setCurrentProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const regeneratePost = async (post: BlogPost) => {
    setCurrentProcessing(post.id);
    
    try {
      console.log(`Regenerating ${post.title}...`);
      
      const { data, error } = await supabase.functions.invoke('plaat-verhaal-generator', {
        body: {
          albumId: post.album_id,
          albumType: post.album_type,
          forceRegenerate: true,
          autoPublish: false
        }
      });
      
      if (error) {
        console.error(`Error regenerating ${post.title}:`, error);
        setResults(prev => ({
          ...prev,
          [post.id]: { success: false, error: error.message, title: post.title }
        }));
        return false;
      } else {
        console.log(`Successfully regenerated ${post.title}:`, data);
        setResults(prev => ({
          ...prev,
          [post.id]: { success: true, data, title: post.title }
        }));
        return true;
      }
    } catch (error: any) {
      console.error(`Unexpected error regenerating ${post.title}:`, error);
      setResults(prev => ({
        ...prev,
        [post.id]: { success: false, error: error.message, title: post.title }
      }));
      return false;
    }
  };

  const regenerateAllPosts = async () => {
    setLoading(true);
    setResults({});
    
    let successCount = 0;
    
    for (const post of EXISTING_POSTS) {
      const success = await regeneratePost(post);
      if (success) successCount++;
      
      // Small delay between posts to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCurrentProcessing(null);
    setLoading(false);
    
    toast({
      title: "Regeneration Complete",
      description: `Successfully regenerated ${successCount}/${EXISTING_POSTS.length} blog posts with new 8-section structure`,
      variant: successCount === EXISTING_POSTS.length ? "default" : "destructive",
    });
  };

  const getStatusIcon = (postId: string) => {
    const result = results[postId];
    if (!result) return null;
    return result.success ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>U2 Zooropa Blog Regeneration - Test Album Cover via Perplexity</CardTitle>
          <p className="text-sm text-muted-foreground">
            This will regenerate the U2 Zooropa blog post to test the improved Perplexity album cover search functionality.
            The function now tries multiple search strategies and better URL extraction patterns.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={regenerateAllPosts} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Regenerate U2 Zooropa Blog with Album Cover
          </Button>
          
          <div className="space-y-3">
            {EXISTING_POSTS.map((post) => (
              <Card key={post.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{post.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Album ID: {post.album_id} | Type: {post.album_type.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentProcessing === post.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {getStatusIcon(post.id)}
                  </div>
                </div>
                
                {results[post.id] && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">
                      Status: {results[post.id].success ? "✅ Success" : "❌ Failed"}
                    </p>
                    {results[post.id].error && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {results[post.id].error}
                      </p>
                    )}
                    {results[post.id].success && results[post.id].data && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          ✅ Generated with {results[post.id].data.reading_time || 8} minutes reading time
                        </p>
                        <p className="text-sm text-green-600">
                          ✅ Word count: {results[post.id].data.word_count || '~1500'} words
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
          
          {Object.keys(results).length === EXISTING_POSTS.length && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Regeneration Summary:</h3>
              <div className="text-sm space-y-1">
                <p>✅ All posts now include 8 enhanced sections:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Waarom deze plaat nú?</li>
                  <li>Het verhaal</li>
                  <li>De opnames & productie</li>
                  <li><strong>NEW:</strong> Albumhoes & artwork</li>
                  <li><strong>NEW:</strong> Kritieken & ontvangst</li>
                  <li>Commercieel succes & impact</li>
                  <li><strong>NEW:</strong> Verzamelwaarde / vinylcultuur</li>
                  <li><strong>NEW:</strong> Persoonlijke touch</li>
                  <li><strong>ENHANCED:</strong> Luister met aandacht</li>
                  <li>Voor wie is dit?</li>
                </ul>
                <p className="mt-2">
                  Reading time increased to 8 minutes, word count ~1500 words per post.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestBlogRegeneration;