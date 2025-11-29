import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Facebook, 
  Settings, 
  FileText, 
  Clock, 
  Send, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Trash2,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface AutoPostSetting {
  id: string;
  content_type: string;
  is_enabled: boolean;
  schedule_type: string;
  schedule_hour: number;
  max_posts_per_day: number;
  include_image: boolean;
  include_url: boolean;
  custom_hashtags: string[];
  last_auto_post_at: string | null;
}

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

interface QueueItem {
  id: string;
  content_type: string;
  content_id: string;
  title: string;
  content_preview: string | null;
  image_url: string | null;
  url: string | null;
  status: string;
  scheduled_for: string | null;
  posted_at: string | null;
  facebook_post_id: string | null;
  error_message: string | null;
  created_at: string;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  blog_posts: "Blog Posts",
  platform_products: "Producten",
  music_news: "Muziek Nieuws",
  artist_stories: "Artiest Verhalen",
  music_anecdotes: "Anekdotes",
  admin_album_reviews: "Album Reviews"
};

export default function FacebookAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContentType, setSelectedContentType] = useState<string>("blog_posts");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);

  // Fetch auto-post settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['facebook-auto-post-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facebook_auto_post_settings')
        .select('*')
        .order('content_type');
      
      if (error) throw error;
      return data as AutoPostSetting[];
    }
  });

  // Fetch content queue
  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ['facebook-content-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facebook_content_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as QueueItem[];
    }
  });

  // Fetch post history
  const { data: postHistory } = useQuery({
    queryKey: ['facebook-post-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facebook_post_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch content based on selected type
  const { data: contentItems, isLoading: contentLoading } = useQuery({
    queryKey: ['facebook-content-items', selectedContentType],
    queryFn: async () => {
      let items: ContentItem[] = [];
      
      switch (selectedContentType) {
        case 'blog_posts': {
          const { data } = await supabase
            .from('blog_posts')
            .select('id, slug, yaml_frontmatter, is_published, created_at, album_cover_url')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(50);
          
          items = (data || []).map(item => ({
            id: item.id,
            title: (item.yaml_frontmatter as any)?.title || item.slug,
            content_preview: (item.yaml_frontmatter as any)?.description,
            image_url: item.album_cover_url,
            url: `https://www.musicscan.app/blog/${item.slug}`,
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
        case 'music_news': {
          const { data } = await supabase
            .from('music_news')
            .select('id, title, content, image_url, slug, created_at, is_published')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(50);
          
          items = (data || []).map(item => ({
            id: item.id,
            title: item.title,
            content_preview: item.content?.substring(0, 150),
            image_url: item.image_url,
            url: `https://www.musicscan.app/nieuws/${item.slug}`,
            created_at: item.created_at,
            is_published: item.is_published,
            type: 'music_news'
          }));
          break;
        }
        case 'artist_stories': {
          const { data } = await supabase
            .from('artist_stories')
            .select('id, artist_name, story_content, artwork_url, slug, created_at, is_published')
            .eq('is_published', true)
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
        case 'music_anecdotes': {
          const { data } = await supabase
            .from('music_anecdotes')
            .select('id, title, content, image_url, slug, created_at, is_published')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(50);
          
          items = (data || []).map(item => ({
            id: item.id,
            title: item.title,
            content_preview: item.content?.substring(0, 150),
            image_url: item.image_url,
            url: `https://www.musicscan.app/anekdotes/${item.slug}`,
            created_at: item.created_at,
            is_published: item.is_published,
            type: 'music_anecdotes'
          }));
          break;
        }
        case 'admin_album_reviews': {
          const { data } = await supabase
            .from('admin_album_reviews')
            .select('id, title, summary, cover_image_url, slug, created_at, is_published')
            .eq('is_published', true)
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

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutoPostSetting> }) => {
      const { error } = await supabase
        .from('facebook_auto_post_settings')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-auto-post-settings'] });
      toast({ title: "Instellingen opgeslagen" });
    },
    onError: (error: any) => {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  });

  // Add to queue mutation
  const addToQueueMutation = useMutation({
    mutationFn: async (items: ContentItem[]) => {
      const queueItems = items.map(item => ({
        content_type: item.type,
        content_id: item.id,
        title: item.title,
        content_preview: item.content_preview,
        image_url: item.image_url,
        url: item.url,
        status: 'pending'
      }));
      
      const { error } = await supabase
        .from('facebook_content_queue')
        .upsert(queueItems, { onConflict: 'content_type,content_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-content-queue'] });
      setSelectedItems(new Set());
      toast({ title: "Toegevoegd aan wachtrij" });
    },
    onError: (error: any) => {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    }
  });

  // Remove from queue mutation
  const removeFromQueueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('facebook_content_queue')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-content-queue'] });
      toast({ title: "Verwijderd uit wachtrij" });
    }
  });

  // Post to Facebook
  const postToFacebook = async (item: QueueItem | ContentItem, isFromQueue: boolean = false) => {
    setIsPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke('post-to-facebook', {
        body: {
          content_type: 'type' in item ? item.type : item.content_type,
          title: item.title,
          content: 'content_preview' in item ? item.content_preview : item.content_preview,
          url: item.url,
          image_url: item.image_url,
          hashtags: ['MusicScan', 'Muziek', 'Vinyl']
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({ title: "Gepost naar Facebook!", description: `Post ID: ${data.post_id}` });
        
        if (isFromQueue && 'id' in item) {
          await supabase
            .from('facebook_content_queue')
            .update({ 
              status: 'posted', 
              posted_at: new Date().toISOString(),
              facebook_post_id: data.post_id 
            })
            .eq('id', item.id);
        }
        
        queryClient.invalidateQueries({ queryKey: ['facebook-content-queue'] });
        queryClient.invalidateQueries({ queryKey: ['facebook-post-history'] });
      } else {
        throw new Error(data?.error || 'Onbekende fout');
      }
    } catch (error: any) {
      toast({ title: "Fout bij posten", description: error.message, variant: "destructive" });
      
      if (isFromQueue && 'id' in item) {
        await supabase
          .from('facebook_content_queue')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', item.id);
        queryClient.invalidateQueries({ queryKey: ['facebook-content-queue'] });
      }
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

  const handleAddSelectedToQueue = () => {
    const items = contentItems?.filter(item => selectedItems.has(item.id)) || [];
    if (items.length > 0) {
      addToQueueMutation.mutate(items);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: nl });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Facebook className="h-8 w-8 text-blue-500" />
            Facebook Content Manager
          </h1>
          <p className="text-muted-foreground">
            Beheer auto-posting instellingen en selecteer handmatig content om te posten
          </p>
        </div>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual" className="gap-2">
              <FileText className="h-4 w-4" />
              Handmatig Posten
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <Clock className="h-4 w-4" />
              Wachtrij ({queue?.filter(q => q.status === 'pending').length || 0})
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Auto-Posting
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Geschiedenis
            </TabsTrigger>
          </TabsList>

          {/* Manual Posting Tab */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Selecteer Content</CardTitle>
                <CardDescription>
                  Kies content om direct te posten of toe te voegen aan de wachtrij
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
                      variant="outline" 
                      disabled={selectedItems.size === 0 || addToQueueMutation.isPending}
                      onClick={handleAddSelectedToQueue}
                    >
                      {addToQueueMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 mr-2" />
                      )}
                      Toevoegen aan Wachtrij ({selectedItems.size})
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[500px] border rounded-lg">
                  {contentLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
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
                            <p className="font-medium truncate">{item.title}</p>
                            {item.content_preview && (
                              <p className="text-sm text-muted-foreground truncate">
                                {item.content_preview}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(item.created_at)}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            {item.url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              disabled={isPosting}
                              onClick={() => postToFacebook(item)}
                            >
                              {isPosting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Wachtrij</CardTitle>
                <CardDescription>
                  Items in de wachtrij voor Facebook posting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {queueLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : queue?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Geen items in de wachtrij
                  </p>
                ) : (
                  <div className="divide-y">
                    {queue?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-4">
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
                            </Badge>
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                        </div>
                        
                        <Badge
                          variant={
                            item.status === 'posted' ? 'default' :
                            item.status === 'failed' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {item.status === 'posted' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {item.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {item.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {item.status}
                        </Badge>
                        
                        {item.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={isPosting}
                              onClick={() => postToFacebook(item, true)}
                            >
                              {isPosting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromQueueMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {item.error_message && (
                          <span className="text-xs text-destructive" title={item.error_message}>
                            ⚠️
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto-Posting Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Posting Instellingen</CardTitle>
                <CardDescription>
                  Configureer welke content automatisch naar Facebook wordt gepost
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {settings?.map((setting) => (
                      <div 
                        key={setting.id} 
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">
                              {CONTENT_TYPE_LABELS[setting.content_type] || setting.content_type}
                            </h3>
                            {setting.last_auto_post_at && (
                              <p className="text-xs text-muted-foreground">
                                Laatste post: {formatDate(setting.last_auto_post_at)}
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={setting.is_enabled}
                            onCheckedChange={(checked) => 
                              updateSettingMutation.mutate({ 
                                id: setting.id, 
                                updates: { is_enabled: checked } 
                              })
                            }
                          />
                        </div>
                        
                        {setting.is_enabled && (
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div>
                              <Label>Schema</Label>
                              <Select 
                                value={setting.schedule_type}
                                onValueChange={(value) =>
                                  updateSettingMutation.mutate({
                                    id: setting.id,
                                    updates: { schedule_type: value }
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">Handmatig</SelectItem>
                                  <SelectItem value="hourly">Elk uur</SelectItem>
                                  <SelectItem value="daily">Dagelijks</SelectItem>
                                  <SelectItem value="weekly">Wekelijks</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label>Max per dag</Label>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={setting.max_posts_per_day}
                                onChange={(e) =>
                                  updateSettingMutation.mutate({
                                    id: setting.id,
                                    updates: { max_posts_per_day: parseInt(e.target.value) || 5 }
                                  })
                                }
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={setting.include_image}
                                onCheckedChange={(checked) =>
                                  updateSettingMutation.mutate({
                                    id: setting.id,
                                    updates: { include_image: !!checked }
                                  })
                                }
                              />
                              <Label>Afbeelding toevoegen</Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={setting.include_url}
                                onCheckedChange={(checked) =>
                                  updateSettingMutation.mutate({
                                    id: setting.id,
                                    updates: { include_url: !!checked }
                                  })
                                }
                              />
                              <Label>URL toevoegen</Label>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Post Geschiedenis</CardTitle>
                <CardDescription>
                  Overzicht van recente Facebook posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {postHistory?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nog geen posts geplaatst
                  </p>
                ) : (
                  <div className="divide-y">
                    {postHistory?.map((post: any) => (
                      <div key={post.id} className="flex items-center gap-4 py-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{post.title || 'Geen titel'}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {post.content?.substring(0, 100)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(post.created_at)}
                          </p>
                        </div>
                        
                        <Badge
                          variant={post.status === 'success' ? 'default' : 'destructive'}
                        >
                          {post.status === 'success' ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {post.status}
                        </Badge>
                        
                        {post.facebook_post_id && (
                          <Button variant="ghost" size="sm" asChild>
                            <a 
                              href={`https://facebook.com/${post.facebook_post_id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
