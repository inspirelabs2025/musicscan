import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, RefreshCw, Rss } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function NewsRssManager() {
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState("");
  const queryClient = useQueryClient();

  const { data: feeds, isLoading } = useQuery({
    queryKey: ['news-rss-feeds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_rss_feeds')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recentArticles } = useQuery({
    queryKey: ['recent-news-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, yaml_frontmatter, created_at')
        .eq('album_type', 'news')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const addFeedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('news_rss_feeds')
        .insert({
          feed_url: newFeedUrl,
          feed_name: newFeedName,
          category: newFeedCategory
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-rss-feeds'] });
      setNewFeedUrl("");
      setNewFeedName("");
      setNewFeedCategory("");
      toast.success("RSS feed toegevoegd");
    },
    onError: (error) => {
      toast.error("Fout bij toevoegen feed: " + error.message);
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('news_rss_feeds')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-rss-feeds'] });
      toast.success("RSS feed verwijderd");
    },
    onError: (error) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  const toggleFeedMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('news_rss_feeds')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-rss-feeds'] });
      toast.success("RSS feed status gewijzigd");
    },
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateNewsMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke('rss-news-rewriter', {
        body: { manual: true, limit: 10 }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['recent-news-articles'] });
      toast.success(`${data.created} nieuwe artikelen gegenereerd!`);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error("Fout bij genereren: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RSS Nieuws Manager</h1>
          <p className="text-muted-foreground">
            Beheer RSS feeds en genereer herschreven nieuwsartikelen
          </p>
        </div>
        <Button
          onClick={() => generateNewsMutation.mutate()}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Genereren...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Genereer Nieuws
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Actieve Feeds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeds?.filter(f => f.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Totaal Artikelen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeds?.reduce((sum, f) => sum + (f.articles_fetched_count || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recente Artikelen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentArticles?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Nieuwe RSS Feed Toevoegen</CardTitle>
          <CardDescription>
            Voeg een nieuwe RSS feed toe voor automatische nieuwsgeneratie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Feed URL"
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
            />
            <Input
              placeholder="Feed Naam"
              value={newFeedName}
              onChange={(e) => setNewFeedName(e.target.value)}
            />
            <Input
              placeholder="Categorie"
              value={newFeedCategory}
              onChange={(e) => setNewFeedCategory(e.target.value)}
            />
            <Button
              onClick={() => addFeedMutation.mutate()}
              disabled={!newFeedUrl || !newFeedName || addFeedMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Toevoegen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RSS Feeds List */}
      <Card>
        <CardHeader>
          <CardTitle>RSS Feeds ({feeds?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeds?.map((feed) => (
              <div
                key={feed.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Rss className="h-4 w-4" />
                    <h3 className="font-semibold">{feed.feed_name}</h3>
                    {feed.is_active ? (
                      <Badge>Actief</Badge>
                    ) : (
                      <Badge variant="secondary">Inactief</Badge>
                    )}
                    {feed.category && (
                      <Badge variant="outline">{feed.category}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{feed.feed_url}</p>
                  <div className="text-xs text-muted-foreground">
                    {feed.articles_fetched_count || 0} artikelen •{" "}
                    {feed.last_fetched_at ? (
                      <>Laatste fetch: {format(new Date(feed.last_fetched_at), "d MMM yyyy HH:mm", { locale: nl })}</>
                    ) : (
                      "Nog niet opgehaald"
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFeedMutation.mutate({ id: feed.id, isActive: feed.is_active })}
                  >
                    {feed.is_active ? "Deactiveer" : "Activeer"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFeedMutation.mutate(feed.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Recente Nieuwsartikelen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentArticles?.map((article) => (
              <div key={article.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{article.yaml_frontmatter?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(article.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/plaat-verhaal/${article.slug}`, '_blank')}
                >
                  Bekijk
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
