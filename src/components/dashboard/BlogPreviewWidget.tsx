import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Newspaper, ArrowRight, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  summary: string;
  slug: string;
  published_at: string;
  source: string;
}

interface UserBlogPost {
  id: string;
  slug: string;
  yaml_frontmatter: any;
  published_at: string;
  album_type: string;
}

const useLatestBlogs = () => {
  return useQuery({
    queryKey: ['latest-blogs'],
    queryFn: async () => {
      // Get latest news blog posts
      const { data: newsBlogs, error: newsError } = await supabase
        .from('news_blog_posts')
        .select('id, title, summary, slug, published_at, source')
        .order('published_at', { ascending: false })
        .limit(2);

      if (newsError) console.error('Error fetching news blogs:', newsError);

      // Get latest user blog posts (Plaat & Verhaal)
      const { data: userBlogs, error: userError } = await supabase
        .from('blog_posts')
        .select('id, slug, yaml_frontmatter, published_at, album_type')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(2);

      if (userError) console.error('Error fetching user blogs:', userError);

      return {
        newsBlogs: newsBlogs || [],
        userBlogs: userBlogs || []
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const BlogPreviewWidget = () => {
  const { data, isLoading } = useLatestBlogs();

  if (isLoading) {
    return (
      <Card className="border-2 hover:border-primary/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            📚 Nieuwste Verhalen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getAlbumTitle = (yamlFrontmatter: any) => {
    if (!yamlFrontmatter) return 'Onbekend Album';
    return `${yamlFrontmatter.artist || 'Onbekende Artiest'} - ${yamlFrontmatter.title || 'Onbekende Titel'}`;
  };

  return (
    <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary animate-pulse" />
          📚 Nieuwste Verhalen & Nieuws
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Blog Posts (Plaat & Verhaal) */}
        {data?.userBlogs && data.userBlogs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-vinyl-purple" />
              <span className="text-sm font-medium">🎵 Plaat & Verhaal</span>
            </div>
            <div className="space-y-2">
              {data.userBlogs.slice(0, 2).map((post: UserBlogPost) => (
                <Link
                  key={post.id}
                  to={`/plaat-verhaal/${post.slug}`}
                  className="block p-2 rounded-lg hover:bg-accent/10 transition-colors group"
                >
                  <div className="text-sm font-medium line-clamp-1 group-hover:text-vinyl-purple transition-colors">
                    {getAlbumTitle(post.yaml_frontmatter)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(post.published_at)}</span>
                    <span>•</span>
                    <span className="capitalize">{post.album_type}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* News Blog Posts */}
        {data?.newsBlogs && data.newsBlogs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="w-4 h-4 text-vinyl-gold" />
              <span className="text-sm font-medium">📰 Muzieknieuws</span>
            </div>
            <div className="space-y-2">
              {data.newsBlogs.slice(0, 1).map((post: BlogPost) => (
                <Link
                  key={post.id}
                  to={`/nieuws/${post.slug}`}
                  className="block p-2 rounded-lg hover:bg-accent/10 transition-colors group"
                >
                  <div className="text-sm font-medium line-clamp-2 group-hover:text-vinyl-gold transition-colors">
                    {post.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(post.published_at)}</span>
                    <span>•</span>
                    <span>{post.source}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No Content State */}
        {(!data?.userBlogs?.length && !data?.newsBlogs?.length) && (
          <div className="text-center py-4">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nog geen verhalen beschikbaar
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1 hover:bg-vinyl-purple/10">
            <Link to="/plaat-verhaal">
              <BookOpen className="w-4 h-4 mr-2" />
              Alle Verhalen
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1 hover:bg-vinyl-gold/10">
            <Link to="/news">
              <Newspaper className="w-4 h-4 mr-2" />
              Meer Nieuws
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};