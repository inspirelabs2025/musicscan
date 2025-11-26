import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';

interface CleanupReport {
  totalPosts: number;
  duplicateGroups: number;
  postsToKeep: number;
  postsDeleted: number;
  deletedPosts: Array<{ id: string; slug: string; artist: string; album: string; reason: string }>;
  errors: string[];
}

export default function CleanupDuplicateBlogs() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CleanupReport | null>(null);
  const { toast } = useToast();

  const runCleanup = async () => {
    setLoading(true);
    try {
      console.log('🧹 Starting duplicate blog cleanup...');

      const { data, error } = await supabase.functions.invoke('cleanup-duplicate-blogs');

      if (error) {
        throw error;
      }

      setReport(data);
      toast({
        title: "✅ Cleanup voltooid",
        description: `${data.postsDeleted} duplicaten verwijderd uit ${data.duplicateGroups} groepen`,
      });
    } catch (error: any) {
      console.error('Error running cleanup:', error);
      toast({
        title: "❌ Fout bij cleanup",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>🧹 Cleanup Duplicate Blog Posts</CardTitle>
          <CardDescription>
            Verwijder duplicate blog posts en behoud alleen de beste versie per album.
            <br />
            <strong>Criteria:</strong> Meeste views → Vroegste jaar → Oudste post
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runCleanup} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig met opschonen...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Start Cleanup
              </>
            )}
          </Button>

          {report && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Totaal Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.totalPosts}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Duplicate Groepen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{report.duplicateGroups}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Posts Verwijderd</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{report.postsDeleted}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Posts Behouden</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{report.postsToKeep}</div>
                  </CardContent>
                </Card>
              </div>

              {report.errors.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-sm text-destructive">Errors ({report.errors.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {report.errors.map((error, i) => (
                        <li key={i} className="text-destructive">{error}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {report.deletedPosts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Verwijderde Posts ({report.deletedPosts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-auto space-y-2">
                      {report.deletedPosts.map((post, i) => (
                        <div key={i} className="text-sm p-2 bg-muted rounded">
                          <div className="font-medium">{post.artist} - {post.album}</div>
                          <div className="text-xs text-muted-foreground">{post.slug}</div>
                          <div className="text-xs text-muted-foreground">{post.reason}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
