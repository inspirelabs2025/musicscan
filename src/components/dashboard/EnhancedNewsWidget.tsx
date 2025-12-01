import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, BookOpen, ArrowRight, Clock, Music } from 'lucide-react';
import { useSpotifyNewReleases } from '@/hooks/useSpotifyNewReleases';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  summary: string;
  source: string;
  published_at: string;
  category: string;
  slug: string;
  image_url?: string;
}

interface UserBlogPost {
  id: string;
  slug: string;
  yaml_frontmatter: any;
  published_at: string;
  album_type: string;
}

const useLatestContent = () => {
  return useQuery({
    queryKey: ['enhanced-news-content'],
    queryFn: async () => {
      const { data: newsBlogs } = await supabase
        .from('news_blog_posts')
        .select('id, title, summary, slug, published_at, source, category, image_url')
        .order('published_at', { ascending: false })
        .limit(4);

      const { data: userBlogs } = await supabase
        .from('blog_posts')
        .select('id, slug, yaml_frontmatter, published_at, album_type')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(4);

      return { newsBlogs: newsBlogs || [], userBlogs: userBlogs || [] };
    },
    staleTime: 5 * 60 * 1000,
  });
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
};

const getAlbumTitle = (yamlFrontmatter: any) => {
  if (!yamlFrontmatter) return 'Onbekend Album';
  return `${yamlFrontmatter.artist || 'Onbekende Artiest'} - ${yamlFrontmatter.title || 'Onbekende Titel'}`;
};

const LoadingSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex gap-3 p-3 rounded-lg border">
        <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const EnhancedNewsWidget = () => {
  const { data: spotifyReleases = [], isLoading: isLoadingReleases } = useSpotifyNewReleases();
  const { data: latestContent, isLoading: isLoadingContent } = useLatestContent();

  return (
    <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary animate-pulse" />
          🎵 Muziek Ontdekkingen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="releases" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="releases" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Releases</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">Nieuws</span>
            </TabsTrigger>
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Verhalen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="releases" className="mt-4">
            {isLoadingReleases ? (
              <LoadingSkeleton />
            ) : spotifyReleases.length > 0 ? (
              <div className="space-y-3">
                {spotifyReleases.slice(0, 3).map((release) => (
                  <a key={release.id} href={release.spotify_url} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-primary/20 rounded-lg flex-shrink-0 overflow-hidden">
                      {release.image_url ? (
                        <img src={release.image_url} alt={release.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Music className="w-8 h-8 text-green-500 m-auto mt-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-green-500 transition-colors">{release.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{release.artist}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(release.release_date)}</p>
                    </div>
                  </a>
                ))}
                <Button asChild size="sm" variant="outline" className="w-full hover:bg-green-500/10">
                  <Link to="/releases"><Music className="w-4 h-4 mr-2" />Alle Releases<ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6"><Music className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" /><p className="text-sm text-muted-foreground">Geen releases beschikbaar</p></div>
            )}
          </TabsContent>

          <TabsContent value="news" className="mt-4">
            {isLoadingContent ? (<LoadingSkeleton />) : latestContent?.newsBlogs?.length > 0 ? (
              <div className="space-y-3">
                {latestContent.newsBlogs.slice(0, 3).map((post: BlogPost) => (
                  <Link key={post.id} to={`/nieuws/${post.slug}`} className="flex gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group block">
                    <div className="w-16 h-16 bg-gradient-to-br from-vinyl-gold/20 to-primary/20 rounded-lg flex-shrink-0 overflow-hidden">
                      {post.image_url ? (<img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />) : (<Newspaper className="w-8 h-8 text-vinyl-gold m-auto mt-4" />)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2 group-hover:text-vinyl-gold transition-colors">{post.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /><span>{formatDate(post.published_at)}</span></div>
                    </div>
                  </Link>
                ))}
                <Button asChild size="sm" variant="outline" className="w-full hover:bg-vinyl-gold/10"><Link to="/nieuws"><Newspaper className="w-4 h-4 mr-2" />Alle Nieuws<ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
              </div>
            ) : (<div className="text-center py-6"><Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" /><p className="text-sm text-muted-foreground">Geen nieuws beschikbaar</p></div>)}
          </TabsContent>

          <TabsContent value="stories" className="mt-4">
            {isLoadingContent ? (<LoadingSkeleton />) : latestContent?.userBlogs?.length > 0 ? (
              <div className="space-y-3">
                {latestContent.userBlogs.slice(0, 3).map((post: UserBlogPost) => (
                  <Link key={post.id} to={`/plaat-verhaal/${post.slug}`} className="flex gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group block">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex-shrink-0 flex items-center justify-center"><BookOpen className="w-8 h-8 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{getAlbumTitle(post.yaml_frontmatter)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" /><span>{formatDate(post.published_at)}</span></div>
                    </div>
                  </Link>
                ))}
                <Button asChild size="sm" variant="outline" className="w-full hover:bg-primary/10"><Link to="/verhalen"><BookOpen className="w-4 h-4 mr-2" />Alle Verhalen<ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
              </div>
            ) : (<div className="text-center py-6"><BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" /><p className="text-sm text-muted-foreground">Geen verhalen beschikbaar</p></div>)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
