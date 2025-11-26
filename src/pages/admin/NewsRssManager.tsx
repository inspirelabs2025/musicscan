import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, RefreshCw, Rss, Search, Filter, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { NewsArticleCard } from "@/components/NewsArticleCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewsRssManager() {
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedCategory, setNewFeedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  const { data: newsArticles, isLoading: articlesLoading } = useQuery({
    queryKey: ['news-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, yaml_frontmatter, album_cover_url, is_published, views_count, created_at, published_at')
        .eq('album_type', 'news')
        .order('created_at', { ascending: false });
      
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
  const [isCleaning, setIsCleaning] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['news-articles'] });
      toast.success(`${data.created} nieuwe artikelen gegenereerd!`);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error("Fout bij genereren: " + error.message);
    },
  });

  const cleanupDuplicatesMutation = useMutation({
    mutationFn: async () => {
      setIsCleaning(true);
      const { data, error } = await supabase.functions.invoke('cleanup-news-duplicates');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setIsCleaning(false);
      queryClient.invalidateQueries({ queryKey: ['news-articles'] });
      toast.success(data.message || 'Duplicaten opgeschoond');
      console.log('Cleanup report:', data.report);
    },
    onError: (error) => {
      setIsCleaning(false);
      toast.error("Fout bij opschonen: " + error.message);
    },
  });

  const updateSummariesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('update-news-summaries');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['news-articles'] });
      toast.success(data.message || 'Samenvattingen toegevoegd');
    },
    onError: (error) => {
      toast.error("Fout bij toevoegen samenvattingen: " + error.message);
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-articles'] });
      toast.success("Artikel verwijderd");
    },
    onError: (error) => {
      toast.error("Fout bij verwijderen: " + error.message);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: boolean }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-articles'] });
      toast.success("Publicatiestatus gewijzigd");
    },
    onError: (error) => {
      toast.error("Fout bij wijzigen: " + error.message);
    },
  });

  // Filter articles
  const filteredArticles = newsArticles?.filter(article => {
    const frontmatter = article.yaml_frontmatter || {};
    const title = frontmatter.title || '';
    const category = frontmatter.category || '';
    const description = frontmatter.description || '';
    
    // Search filter
    const matchesSearch = searchTerm === '' || 
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && article.is_published) ||
      (statusFilter === 'draft' && !article.is_published);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories
  const categories = Array.from(new Set(
    newsArticles?.map(a => a.yaml_frontmatter?.category).filter(Boolean) || []
  ));

  // Statistics
  const publishedCount = newsArticles?.filter(a => a.is_published).length || 0;
  const draftCount = newsArticles?.filter(a => !a.is_published).length || 0;

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
        <div className="flex gap-2">
          <Button
            onClick={() => updateSummariesMutation.mutate()}
            disabled={updateSummariesMutation.isPending}
            variant="secondary"
          >
            {updateSummariesMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig...
              </>
            ) : (
              <>
                <Rss className="mr-2 h-4 w-4" />
                Voeg Samenvattingen Toe
              </>
            )}
          </Button>
          <Button
            onClick={() => cleanupDuplicatesMutation.mutate()}
            disabled={isCleaning}
            variant="outline"
          >
            {isCleaning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opschonen...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Verwijder Duplicaten
              </>
            )}
          </Button>
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
                Haal Nieuws Op
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {newsArticles?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gepubliceerd</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {publishedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Concepten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {draftCount}
            </div>
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

      {/* News Articles Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nieuwsartikelen ({filteredArticles?.length || 0})</CardTitle>
              <CardDescription>
                Beheer en bekijk alle gegenereerde nieuwsartikelen
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek in artikelen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle status</SelectItem>
                <SelectItem value="published">Gepubliceerd</SelectItem>
                <SelectItem value="draft">Concepten</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Articles Grid */}
          {articlesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredArticles && filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <NewsArticleCard
                  key={article.id}
                  article={article}
                  onDelete={(id) => deleteArticleMutation.mutate(id)}
                  onTogglePublish={(id, currentStatus) => 
                    togglePublishMutation.mutate({ id, currentStatus })
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Geen artikelen gevonden</p>
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' ? (
                <p className="text-sm mt-2">Probeer andere filters</p>
              ) : (
                <p className="text-sm mt-2">Klik op "Genereer Nieuws" om te beginnen</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
