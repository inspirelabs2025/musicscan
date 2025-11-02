import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePaginatedBlogs } from '@/hooks/usePaginatedBlogs';
import { useDiscogsNews } from '@/hooks/useNewsCache';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Disc3, Newspaper, FileText } from 'lucide-react';

export const NewsAndStoriesSection = () => {
  const [activeTab, setActiveTab] = useState<'releases' | 'nieuws' | 'verhalen'>('releases');
  
  // Releases from Discogs
  const { data: discogsReleases = [], isLoading: releasesLoading } = useDiscogsNews();
  
  // News from news_blog_posts
  const { data: musicNews = [], isLoading: newsLoading } = useQuery({
    queryKey: ["news-blog-posts-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_blog_posts')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  
  // Verhalen from blog_posts
  const { blogs: verhalen, isLoading: verhalenLoading } = usePaginatedBlogs();

  const renderReleasesContent = () => {
    if (releasesLoading) {
      return (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    const displayReleases = discogsReleases.slice(0, 3);

    if (!displayReleases || displayReleases.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Geen releases beschikbaar</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-3 gap-6">
        {displayReleases.map((release: any) => (
          <Link key={release.id} to={`/music-news?tab=releases`}>
            <Card className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 group h-full border-2 hover:border-vinyl-purple">
              {/* Album Cover */}
              <div className="aspect-square overflow-hidden bg-gradient-to-br from-vinyl-purple/20 to-vinyl-gold/20">
                {(release.stored_image || release.thumb || release.artwork) ? (
                  <img 
                    src={release.stored_image || release.thumb || release.artwork} 
                    alt={release.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🎵
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-3">
                <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {release.title || 'Onbekende titel'}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {release.artist || 'Onbekende artiest'}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  {release.year && (
                    <Badge variant="secondary" className="text-xs">
                      {release.year}
                    </Badge>
                  )}
                  {release.format && Array.isArray(release.format) && release.format.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {release.format[0]}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  const renderNewsContent = () => {
    if (newsLoading) {
      return (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (!musicNews || musicNews.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Geen nieuws beschikbaar</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-3 gap-6">
        {musicNews.map((news: any) => (
          <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer">
            <Card className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 group h-full border-2 hover:border-vinyl-gold">
              {/* Cover Image */}
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-vinyl-gold/20 to-accent/20">
                {news.image_url ? (
                  <img 
                    src={news.image_url} 
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    📰
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {news.category && (
                    <Badge variant="secondary" className="text-xs">
                      {news.category}
                    </Badge>
                  )}
                  {news.published_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(news.published_at), { 
                        addSuffix: true, 
                        locale: nl 
                      })}
                    </span>
                  )}
                </div>
                
                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {news.title}
                </h3>
                
                {news.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {news.summary}
                  </p>
                )}
              </div>
            </Card>
          </a>
        ))}
      </div>
    );
  };

  const renderVerhalenContent = () => {
    if (verhalenLoading) {
      return (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    const displayVerhalen = verhalen.slice(0, 3);

    if (!displayVerhalen || displayVerhalen.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Geen artikelen beschikbaar</p>
          <p className="text-sm text-muted-foreground">Kom later terug voor nieuwe verhalen!</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-3 gap-6">
        {displayVerhalen.map((blog) => {
          const title = blog.yaml_frontmatter?.title || blog.yaml_frontmatter?.album || 'Muziekverhaal';
          const description = blog.yaml_frontmatter?.description || blog.yaml_frontmatter?.excerpt || '';
          
          return (
            <Link key={blog.id} to={`/news/${blog.slug}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-all hover:scale-105 group h-full border-2 hover:border-accent">
                {/* Cover Image */}
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-accent/20 to-primary/20">
                  {blog.album_cover_url ? (
                    <img 
                      src={blog.album_cover_url} 
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      📖
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {blog.album_type && (
                      <Badge variant="secondary" className="text-xs">
                        {blog.album_type}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(blog.created_at), { 
                        addSuffix: true, 
                        locale: nl 
                      })}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  
                  {description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  };
    if (forumLoading) {
      return (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
      );
    }

    if (!forumTopics || forumTopics.length === 0) {
      return <p className="text-center text-muted-foreground py-12">Geen discussies gevonden</p>;
    }

    return (
      <div className="grid md:grid-cols-3 gap-6">
        {forumTopics.slice(0, 3).map((topic) => (
          <Link key={topic.id} to={`/forum/${topic.id}`}>
            <Card className="p-6 hover:shadow-xl transition-all hover:scale-105 group h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vinyl-purple to-accent flex items-center justify-center text-white font-bold">
                    {topic.profiles?.first_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {topic.profiles?.first_name || 'Anoniem'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {topic.created_at && formatDistanceToNow(new Date(topic.created_at), { 
                        addSuffix: true, 
                        locale: nl 
                      })}
                    </p>
                  </div>
                </div>

                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {topic.title}
                </h3>

                {topic.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {topic.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>💬 {topic.reply_count || 0} reacties</span>
                  {topic.view_count > 0 && <span>👁️ {topic.view_count}</span>}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">🎵 Releases, Nieuws & Verhalen</h2>
          <p className="text-xl text-muted-foreground">
            Ontdek nieuwe releases, blijf op de hoogte van nieuws en lees verhalen
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-xl">
            <TabsTrigger 
              value="releases"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-purple data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Disc3 className="h-4 w-4" />
              <span>🎵 Releases</span>
            </TabsTrigger>
            <TabsTrigger 
              value="nieuws"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-vinyl-gold data-[state=active]:to-amber-500 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Newspaper className="h-4 w-4" />
              <span>📰 Nieuws</span>
            </TabsTrigger>
            <TabsTrigger 
              value="verhalen"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <FileText className="h-4 w-4" />
              <span>📚 Verhalen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="releases">
            {renderReleasesContent()}
          </TabsContent>

          <TabsContent value="nieuws">
            {renderNewsContent()}
          </TabsContent>

          <TabsContent value="verhalen">
            {renderVerhalenContent()}
          </TabsContent>
        </Tabs>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link 
            to="/music-news"
            className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
          >
            Bekijk Alles →
          </Link>
        </div>
      </div>
    </section>
  );
};
