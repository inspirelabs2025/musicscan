import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Youtube, Play, RefreshCw, Mic, Music, Video, Loader2, ExternalLink } from "lucide-react";

interface YouTubeDiscovery {
  id: string;
  video_id: string;
  title: string;
  description: string | null;
  channel_name: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  view_count: number | null;
  content_type: string;
  artist_name: string | null;
  quality_score: number | null;
  tags: string[] | null;
}

const contentTypeConfig = {
  interview: { label: "Interviews", icon: Mic, color: "bg-purple-500" },
  studio: { label: "Studio", icon: Music, color: "bg-blue-500" },
  live_session: { label: "Live Sessions", icon: Video, color: "bg-green-500" },
  documentary: { label: "Documentaires", icon: Play, color: "bg-orange-500" },
  other: { label: "Overig", icon: Youtube, color: "bg-gray-500" },
};

export default function YouTubeDiscoveries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discoveries, setDiscoveries] = useState<YouTubeDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscoveries();
  }, [user]);

  const fetchDiscoveries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('youtube_discoveries')
        .select('*')
        .order('quality_score', { ascending: false })
        .limit(100);

      if (error) throw error;
      setDiscoveries(data || []);
    } catch (error) {
      console.error('Error fetching discoveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const discoverNewVideos = async () => {
    if (!user) {
      toast({
        title: "Log in vereist",
        description: "Je moet ingelogd zijn om videos te ontdekken op basis van je collectie.",
        variant: "destructive"
      });
      return;
    }

    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-discoveries', {
        body: {
          userId: user.id,
          contentTypes: ['interview', 'studio']
        }
      });

      if (error) throw error;

      toast({
        title: "Ontdekking voltooid!",
        description: `${data.discoveriesFound} nieuwe video's gevonden van ${data.artistsSearched} artiesten.`
      });

      fetchDiscoveries();
    } catch (error: any) {
      console.error('Error discovering videos:', error);
      toast({
        title: "Fout",
        description: error.message || "Kon geen video's ontdekken",
        variant: "destructive"
      });
    } finally {
      setDiscovering(false);
    }
  };

  const filteredDiscoveries = activeTab === "all" 
    ? discoveries 
    : discoveries.filter(d => d.content_type === activeTab);

  const formatViewCount = (count: number | null) => {
    if (!count) return "";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K views`;
    return `${count} views`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Helmet>
        <title>YouTube Discoveries - Unieke Muziek Content | MusicScan</title>
        <meta name="description" content="Ontdek bijzondere muziekvideo's: interviews, studio sessies en meer van artiesten uit je collectie." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Youtube className="h-8 w-8 text-red-500" />
                YouTube Discoveries
              </h1>
              <p className="text-muted-foreground mt-2">
                Unieke muziekcontent van artiesten uit je collectie
              </p>
            </div>
            
            <Button 
              onClick={discoverNewVideos} 
              disabled={discovering || !user}
              className="gap-2"
            >
              {discovering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {discovering ? "Zoeken..." : "Ontdek Nieuwe Video's"}
            </Button>
          </div>

          {/* Content Type Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="all">Alles</TabsTrigger>
              <TabsTrigger value="interview" className="gap-2">
                <Mic className="h-4 w-4 hidden sm:inline" />
                Interviews
              </TabsTrigger>
              <TabsTrigger value="studio" className="gap-2">
                <Music className="h-4 w-4 hidden sm:inline" />
                Studio
              </TabsTrigger>
              <TabsTrigger value="live_session" className="gap-2">
                <Video className="h-4 w-4 hidden sm:inline" />
                Live
              </TabsTrigger>
              <TabsTrigger value="documentary">Docs</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Selected Video Player */}
          {selectedVideo && (
            <Card className="mb-8 overflow-hidden">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </Card>
          )}

          {/* Video Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredDiscoveries.length === 0 ? (
            <Card className="p-12 text-center">
              <Youtube className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Geen video's gevonden</h3>
              <p className="text-muted-foreground mb-6">
                {user 
                  ? "Klik op 'Ontdek Nieuwe Video's' om content te vinden van artiesten uit je collectie."
                  : "Log in om video's te ontdekken op basis van je muziekcollectie."
                }
              </p>
              {user && (
                <Button onClick={discoverNewVideos} disabled={discovering}>
                  Start Ontdekking
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDiscoveries.map((video) => {
                const config = contentTypeConfig[video.content_type as keyof typeof contentTypeConfig] || contentTypeConfig.other;
                const Icon = config.icon;
                
                return (
                  <Card 
                    key={video.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => setSelectedVideo(video.video_id)}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={video.thumbnail_url || '/placeholder.svg'}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-16 w-16 text-white" fill="white" />
                      </div>
                      <Badge className={`absolute top-2 left-2 ${config.color} text-white`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      {video.quality_score && video.quality_score >= 50 && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
                          ⭐ Top
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      
                      {video.tags && video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {video.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {video.channel_name}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatViewCount(video.view_count)}</span>
                        <span>{formatDate(video.published_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Stats */}
          {discoveries.length > 0 && (
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(contentTypeConfig).slice(0, 4).map(([type, config]) => {
                const count = discoveries.filter(d => d.content_type === type).length;
                const Icon = config.icon;
                return (
                  <Card key={type} className="p-4 text-center">
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${config.color.replace('bg-', 'text-')}`} />
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
