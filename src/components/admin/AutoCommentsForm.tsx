import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BotProfilesManager } from "./BotProfilesManager";
import { Users, MessageSquare, Play, BarChart3, ExternalLink, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AutoCommentsForm() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [batchResult, setBatchResult] = useState<any>(null);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('comment_generation_stats')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateBotUsers = async () => {
    try {
      setIsProcessing(true);
      toast({
        title: "Bot gebruikers aanmaken...",
        description: "Dit kan een paar seconden duren",
      });

      const { data, error } = await supabase.functions.invoke('create-bot-users');

      if (error) throw error;

      toast({
        title: "✅ Bot gebruikers aangemaakt!",
        description: `${data.created_count} bot gebruikers succesvol aangemaakt`,
      });

      // Reload bot profiles
      loadStats();
    } catch (error: any) {
      console.error('Error creating bot users:', error);
      toast({
        title: "Fout bij aanmaken bot gebruikers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSingleComment = async () => {
    try {
      setIsProcessing(true);
      toast({
        title: "Test comment genereren...",
        description: "Selecteert random blog post",
      });

      // Get a random published blog post
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('id, slug, album_type, yaml_frontmatter')
        .eq('is_published', true)
        .limit(10);

      if (postsError) throw postsError;
      if (!posts || posts.length === 0) {
        throw new Error('Geen gepubliceerde blog posts gevonden');
      }

      const randomPost = posts[Math.floor(Math.random() * posts.length)];
      const frontmatter = randomPost.yaml_frontmatter || {};

      // Generate comment
      const { data, error } = await supabase.functions.invoke('generate-ai-comment', {
        body: {
          blog_post_id: randomPost.id,
          artist: frontmatter.artist || 'Unknown Artist',
          single_name: frontmatter.single_name,
          album_title: frontmatter.album_title,
          album_type: randomPost.album_type,
          genre: frontmatter.genre,
          year: frontmatter.year,
          num_comments: 1
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Test comment gegenereerd!",
        description: `Comment aangemaakt voor: ${randomPost.slug}`,
      });

      loadStats();
    } catch (error: any) {
      console.error('Error generating comment:', error);
      toast({
        title: "Fout bij genereren comment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchGenerate = async (batchSize: number) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setBatchResult(null);

      toast({
        title: "Batch processing gestart",
        description: `Verwerkt ${batchSize} blog posts...`,
      });

      const { data, error } = await supabase.functions.invoke('backfill-blog-comments', {
        body: {
          batch_size: batchSize,
          min_comments: 1,
          max_comments: 3
        }
      });

      if (error) throw error;

      setBatchResult(data);
      setProgress(100);

      toast({
        title: "✅ Batch processing voltooid!",
        description: `${data.successful}/${data.processed} posts succesvol verwerkt`,
      });

      loadStats();
    } catch (error: any) {
      console.error('Error in batch generation:', error);
      toast({
        title: "Fout bij batch processing",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard">
          <BarChart3 className="w-4 h-4 mr-2" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="actions">
          <MessageSquare className="w-4 h-4 mr-2" />
          Acties
        </TabsTrigger>
        <TabsTrigger value="bots">
          <Users className="w-4 h-4 mr-2" />
          Bot Gebruikers
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Totaal Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_comments_generated || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Posts Verwerkt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_posts_processed || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tokens Gebruikt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_tokens_used?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
        </div>

        {stats?.last_run_at && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Laatste Run</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {new Date(stats.last_run_at).toLocaleString('nl-NL')}
              </p>
            </CardContent>
          </Card>
        )}

        {batchResult && (
          <Card>
            <CardHeader>
              <CardTitle>Laatste Batch Resultaten</CardTitle>
              <CardDescription>
                {batchResult.processed} posts verwerkt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{batchResult.processed}</div>
                    <div className="text-sm text-muted-foreground">Verwerkt</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{batchResult.successful}</div>
                    <div className="text-sm text-green-600">Succesvol</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{batchResult.failed}</div>
                    <div className="text-sm text-red-600">Gefaald</div>
                  </div>
                </div>

                {batchResult.details && batchResult.details.length > 0 && (
                  <div className="space-y-2 mt-6">
                    <h4 className="font-semibold text-sm mb-3">Verwerkte Posts</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {batchResult.details.map((detail: any, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {detail.status === 'success' && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                            {detail.status === 'failed' && (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                            {detail.status === 'skipped' && (
                              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <a
                                  href={`/plaat-verhaal/${detail.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium hover:text-primary truncate flex items-center gap-1"
                                >
                                  {detail.slug}
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              </div>
                              {detail.status === 'success' && detail.comments_generated && (
                                <p className="text-xs text-muted-foreground">
                                  {detail.comments_generated} comment{detail.comments_generated !== 1 ? 's' : ''} gegenereerd
                                </p>
                              )}
                              {detail.status === 'failed' && detail.error && (
                                <p className="text-xs text-red-600">{detail.error}</p>
                              )}
                              {detail.status === 'skipped' && detail.reason && (
                                <p className="text-xs text-orange-600">
                                  {detail.reason === 'already_has_comments' ? 'Heeft al comments' : detail.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <Badge 
                            variant={
                              detail.status === 'success' ? 'default' : 
                              detail.status === 'failed' ? 'destructive' : 
                              'secondary'
                            }
                            className="ml-2 flex-shrink-0"
                          >
                            {detail.status === 'success' ? 'Success' : 
                             detail.status === 'failed' ? 'Failed' : 
                             'Skipped'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Statistieken Laden</CardTitle>
            <CardDescription>
              Laad de nieuwste statistieken van het comment systeem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadStats} disabled={isProcessing}>
              Statistieken Laden
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="actions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Test Comment Generator</CardTitle>
            <CardDescription>
              Genereer één test comment voor een random blog post
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGenerateSingleComment}
              disabled={isProcessing}
            >
              <Play className="w-4 h-4 mr-2" />
              Genereer Test Comment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch Comment Generation</CardTitle>
            <CardDescription>
              Genereer comments voor meerdere blog posts tegelijk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => handleBatchGenerate(10)}
                disabled={isProcessing}
              >
                10 Posts
              </Button>
              <Button 
                onClick={() => handleBatchGenerate(50)}
                disabled={isProcessing}
              >
                50 Posts
              </Button>
              <Button 
                onClick={() => handleBatchGenerate(100)}
                disabled={isProcessing}
                variant="outline"
              >
                100 Posts
              </Button>
            </div>

            {isProcessing && progress > 0 && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                  {progress}% voltooid
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bots">
        <Card>
          <CardHeader>
            <CardTitle>Bot Gebruikers Beheren</CardTitle>
            <CardDescription>
              Maak bot gebruikers aan die comments kunnen plaatsen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleCreateBotUsers}
              disabled={isProcessing}
            >
              <Users className="w-4 h-4 mr-2" />
              Bot Gebruikers Aanmaken
            </Button>

            <BotProfilesManager />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}