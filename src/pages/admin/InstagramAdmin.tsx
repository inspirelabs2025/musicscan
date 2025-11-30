import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Instagram, 
  FileText, 
  Send, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Image as ImageIcon
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface ContentItem {
  id: string;
  title: string;
  content_preview?: string;
  image_url?: string;
  url?: string;
  created_at: string;
  is_published?: boolean;
  type: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog_posts: "Blog Posts",
  platform_products: "Producten",
  artist_stories: "Artiest Verhalen",
  admin_album_reviews: "Album Reviews"
};

export default function InstagramAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContentType, setSelectedContentType] = useState<string>("blog_posts");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);

  // Fetch post history
  const { data: postHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['instagram-post-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_post_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch content based on selected type (only items with images)
  const { data: contentItems, isLoading: contentLoading } = useQuery({
    queryKey: ['instagram-content-items', selectedContentType],
    queryFn: async () => {
      let items: ContentItem[] = [];
      
      switch (selectedContentType) {
        case 'blog_posts': {
          const { data } = await supabase
            .from('blog_posts')
            .select('id, slug, yaml_frontmatter, is_published, created_at, album_cover_url')
            .eq('is_published', true)
            .not('album_cover_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);
          
          items = (data || []).map(item => ({
            id: item.id,
            title: (item.yaml_frontmatter as any)?.title || item.slug,
            content_preview: (item.yaml_frontmatter as any)?.description,
            image_url: item.album_cover_url,
            url: `https://www.musicscan.app/plaat-verhaal/${item.slug}`,
            created_at: item.created_at,
            is_published: item.is_published,
            type: 'blog_posts'
          }));
          break;
        }
        case 'platform_products': {
          const { data } = await supabase
            .from('platform_products')
            .select('id, title, description, primary_image, slug, created_at, status')
            .eq('status', 'active')
            .not('primary_image', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);
          
          items = (data || []).map(item => ({
            id: item.id,
            title: item.title,
            content_preview: item.description?.substring(0, 150),
            image_url: item.primary_image,
            url: `https://www.musicscan.app/product/${item.slug}`,
            created_at: item.created_at,
            is_published: item.status === 'active',
            type: 'platform_products'
          }));
          break;
        }
        case 'artist_stories': {
          const { data } = await supabase
            .from('artist_stories')
            .select('id, artist_name, story_content, artwork_url, slug, created_at, is_published')
            .eq('is_published', true)
            .not('artwork_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);
          
          items = (data || []).map(item => ({
            id: item.id,
            title: item.artist_name,
            content_preview: item.story_content?.substring(0, 150),
            image_url: item.artwork_url,
            url: `https://www.musicscan.app/artist/${item.slug}`,
            created_at: item.created_at,
            is_published: item.is_published,
            type: 'artist_stories'
          }));
          break;
        }
        case 'admin_album_reviews': {
          const { data } = await supabase
            .from('admin_album_reviews')
            .select('id, title, summary, cover_image_url, slug, created_at, is_published')
            .eq('is_published', true)
            .not('cover_image_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);
          
          items = (data || []).map(item => ({
            id: item.id,
            title: item.title,
            content_preview: item.summary?.substring(0, 150),
            image_url: item.cover_image_url,
            url: `https://www.musicscan.app/review/${item.slug}`,
            created_at: item.created_at,
            is_published: item.is_published,
            type: 'admin_album_reviews'
          }));
          break;
        }
      }
      
      return items;
    }
  });

  // Post to Instagram
  const postToInstagram = async (item: ContentItem) => {
    if (!item.image_url) {
      toast({ 
        title: "Geen afbeelding", 
        description: "Instagram vereist een afbeelding", 
        variant: "destructive" 
      });
      return;
    }

    setIsPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-to-instagram', {
        body: {
          content_type: item.type,
          title: item.title,
          content: item.content_preview,
          url: item.url,
          image_url: item.image_url,
          hashtags: ['MusicScan', 'Muziek', 'Vinyl', 'Records', 'Music']
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({ title: "Gepost naar Instagram!", description: `Post ID: ${data.post_id}` });
        queryClient.invalidateQueries({ queryKey: ['instagram-post-history'] });
      } else {
        throw new Error(data?.error || 'Onbekende fout');
      }
    } catch (error: any) {
      toast({ title: "Fout bij posten", description: error.message, variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handlePostSelected = async () => {
    const items = contentItems?.filter(item => selectedItems.has(item.id)) || [];
    for (const item of items) {
      await postToInstagram(item);
    }
    setSelectedItems(new Set());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: nl });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Gepost</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Mislukt</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Instagram className="h-8 w-8 text-pink-500" />
            Instagram Content Manager
          </h1>
          <p className="text-muted-foreground">
            Selecteer content met afbeeldingen om te posten naar Instagram
          </p>
        </div>

        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <ImageIcon className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Let op:</strong> Instagram vereist een afbeelding voor elke post. 
                Alleen content met een afbeelding wordt hier getoond.
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual" className="gap-2">
              <FileText className="h-4 w-4" />
              Handmatig Posten
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Geschiedenis ({postHistory?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Manual Posting Tab */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Selecteer Content</CardTitle>
                <CardDescription>
                  Kies content om direct te posten naar Instagram
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Content Type</Label>
                    <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 pt-6">
                    <Button 
                      disabled={selectedItems.size === 0 || isPosting}
                      onClick={handlePostSelected}
                    >
                      {isPosting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Post Geselecteerde ({selectedItems.size})
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[500px] border rounded-lg">
                  {contentLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : contentItems?.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Geen content gevonden met afbeeldingen
                    </div>
                  ) : (
                    <div className="divide-y">
                      {contentItems?.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center gap-4 p-4 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                          />
                          
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.title}</h4>
                            {item.content_preview && (
                              <p className="text-sm text-muted-foreground truncate">
                                {item.content_preview}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(item.created_at)}
                            </p>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={isPosting}
                            onClick={() => postToInstagram(item)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Post Geschiedenis</CardTitle>
                  <CardDescription>
                    Overzicht van alle Instagram posts
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['instagram-post-history'] })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ververs
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : postHistory?.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Nog geen posts verstuurd
                    </div>
                  ) : (
                    <div className="divide-y">
                      {postHistory?.map((post) => (
                        <div key={post.id} className="py-4 first:pt-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3">
                              {post.image_url && (
                                <img 
                                  src={post.image_url} 
                                  alt={post.title || 'Post image'}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <h4 className="font-medium">{post.title || 'Zonder titel'}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {post.content_type} • {formatDate(post.created_at)}
                                </p>
                                {post.error_message && (
                                  <p className="text-sm text-destructive mt-1">
                                    {post.error_message}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(post.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
