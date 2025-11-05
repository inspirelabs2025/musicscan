import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePaginatedBlogs } from '@/hooks/usePaginatedBlogs';
import { useDiscogsNews } from '@/hooks/useNewsCache';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Disc3, Newspaper, FileText, ArrowRight, Music } from 'lucide-react';

export const NewsAndStoriesSection = () => {
  
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
            <Link key={blog.id} to={`/plaat-verhaal/${blog.slug}`}>
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

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🎵 Ontdek Muzieknieuws
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Blijf op de hoogte van de nieuwste verhalen, nieuws en releases uit de muziekwereld
          </p>
        </div>

        {/* Three Column Grid with Direct Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Verhalen */}
          <Link to="/verhalen" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-vinyl-purple to-primary flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                  📚 Verhalen
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Ontdek de verhalen achter albums en artiesten
                </p>
                <Button variant="ghost" className="group-hover:bg-primary/10">
                  Bekijk Verhalen
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Nieuws */}
          <Link to="/nieuws" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-vinyl-purple to-primary flex items-center justify-center">
                  <Newspaper className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                  📰 Nieuws
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Het laatste nieuws uit de muziekindustrie
                </p>
                <Button variant="ghost" className="group-hover:bg-primary/10">
                  Bekijk Nieuws
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Releases */}
          <Link to="/releases" className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-vinyl-purple to-primary flex items-center justify-center">
                  <Music className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                  🎵 Releases
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  De nieuwste albums en releases
                </p>
                <Button variant="ghost" className="group-hover:bg-primary/10">
                  Bekijk Releases
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Preview Content - Show Verhalen by default */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Laatste Verhalen</h3>
            <Link to="/verhalen">
              <Button variant="outline" className="group">
                Bekijk alle verhalen
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          {renderVerhalenContent()}
        </div>
      </div>
    </section>
  );
};
