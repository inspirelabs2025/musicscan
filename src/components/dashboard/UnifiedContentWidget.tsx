import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Disc3, 
  Newspaper, 
  BookOpen, 
  Music2, 
  ArrowRight, 
  Clock,
  Sparkles
} from 'lucide-react';
import { useDiscogsNews } from '@/hooks/useNewsCache';
import { useMuziekVerhalen } from '@/hooks/useMuziekVerhalen';
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

interface MusicStory {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  artist?: string;
  single_name?: string;
  artwork_url?: string;
  genre?: string;
}

interface DiscogsRelease {
  id: number;
  title: string;
  artist: string;
  year?: number;
  artwork?: string;
  thumb?: string;
  stored_image?: string;
  format?: string[] | string;
  genre?: string[] | string;
}

interface UnifiedContentItem {
  id: string;
  type: 'release' | 'news' | 'album-story' | 'single-story';
  title: string;
  subtitle?: string;
  date: string;
  image?: string;
  link: string;
  source?: string;
  badge: {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  };
}

const useUnifiedContent = () => {
  return useQuery({
    queryKey: ['unified-content'],
    queryFn: async () => {
      // Get latest news blog posts
      const { data: newsBlogs } = await supabase
        .from('news_blog_posts')
        .select('id, title, summary, slug, published_at, source, category, image_url')
        .order('published_at', { ascending: false })
        .limit(5);

      // Get latest user blog posts (Album Verhalen)
      const { data: userBlogs } = await supabase
        .from('blog_posts')
        .select('id, slug, yaml_frontmatter, published_at, album_type')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(5);

      // Get latest music stories (Single Verhalen)
      const { data: musicStories } = await supabase
        .from('music_stories')
        .select('id, title, slug, created_at, artist, single_name, artwork_url, genre')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        newsBlogs: newsBlogs || [],
        userBlogs: userBlogs || [],
        musicStories: musicStories || []
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const transformToUnifiedItems = (
  discogsReleases: DiscogsRelease[], 
  newsBlogs: BlogPost[], 
  userBlogs: UserBlogPost[], 
  musicStories: MusicStory[]
): UnifiedContentItem[] => {
  const items: UnifiedContentItem[] = [];

  // Add Discogs releases
  discogsReleases.slice(0, 3).forEach((release) => {
    items.push({
      id: `release-${release.id}`,
      type: 'release',
      title: release.title,
      subtitle: release.artist,
      date: new Date().toISOString(), // Current date for new releases
      image: release.stored_image || release.thumb || release.artwork,
      link: `/catalog?search=${encodeURIComponent(release.title)}`,
      badge: {
        label: '🆕 Nieuwe Release',
        variant: 'default',
        className: 'bg-green-500 text-white hover:bg-green-600'
      }
    });
  });

  // Add news blogs
  newsBlogs.forEach((post) => {
    items.push({
      id: `news-${post.id}`,
      type: 'news',
      title: post.title,
      subtitle: post.summary,
      date: post.published_at,
      image: post.image_url,
      link: `/nieuws/${post.slug}`,
      source: post.source,
      badge: {
        label: '📰 Muzieknieuws',
        variant: 'secondary',
        className: 'bg-blue-500 text-white hover:bg-blue-600'
      }
    });
  });

  // Add album stories
  userBlogs.forEach((post) => {
    const albumTitle = post.yaml_frontmatter?.artist && post.yaml_frontmatter?.title
      ? `${post.yaml_frontmatter.artist} - ${post.yaml_frontmatter.title}`
      : 'Onbekend Album';
    
    items.push({
      id: `album-story-${post.id}`,
      type: 'album-story',
      title: albumTitle,
      subtitle: post.album_type,
      date: post.published_at,
      image: post.yaml_frontmatter?.artwork_url,
      link: `/plaat-verhaal/${post.slug}`,
      badge: {
        label: '💿 Album Verhaal',
        variant: 'outline',
        className: 'bg-purple-500 text-white hover:bg-purple-600'
      }
    });
  });

  // Add music stories
  musicStories.forEach((story) => {
    const title = story.artist && story.single_name
      ? `${story.artist} - ${story.single_name}`
      : story.title;
    
    items.push({
      id: `single-story-${story.id}`,
      type: 'single-story',
      title: title,
      subtitle: story.genre,
      date: story.created_at,
      image: story.artwork_url,
      link: `/muziek-verhaal/${story.slug}`,
      badge: {
        label: '🎵 Single Verhaal',
        variant: 'destructive',
        className: 'bg-amber-500 text-white hover:bg-amber-600'
      }
    });
  });

  // Sort by date (newest first)
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short'
  });
};

const LoadingSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex gap-3 p-3 rounded-lg border">
        <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export const UnifiedContentWidget = () => {
  const [showAll, setShowAll] = useState(false);
  const { data: discogsReleases = [], isLoading: isLoadingDiscogs } = useDiscogsNews();
  const { data: unifiedData, isLoading: isLoadingContent } = useUnifiedContent();

  const isLoading = isLoadingDiscogs || isLoadingContent;

  if (isLoading) {
    return (
      <Card className="border-2 hover:border-primary/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            🌟 Ontdek & Leer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  const unifiedItems = transformToUnifiedItems(
    (discogsReleases as DiscogsRelease[]) || [],
    unifiedData?.newsBlogs || [],
    unifiedData?.userBlogs || [],
    unifiedData?.musicStories || []
  );

  const itemsToShow = showAll ? unifiedItems : unifiedItems.slice(0, 6);

  return (
    <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          🌟 Ontdek & Leer
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unifiedItems.length > 0 ? (
          <div className="space-y-3">
            {itemsToShow.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className="flex gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group border border-transparent hover:border-primary/20"
              >
                {/* Image */}
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.type === 'release' && <Disc3 className="w-8 h-8 text-primary" />}
                      {item.type === 'news' && <Newspaper className="w-8 h-8 text-primary" />}
                      {item.type === 'album-story' && <BookOpen className="w-8 h-8 text-primary" />}
                      {item.type === 'single-story' && <Music2 className="w-8 h-8 text-primary" />}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Badge */}
                  <Badge className={`mb-2 text-xs ${item.badge.className}`}>
                    {item.badge.label}
                  </Badge>

                  {/* Title */}
                  <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </p>

                  {/* Subtitle */}
                  {item.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                      {item.subtitle}
                    </p>
                  )}

                  {/* Date and Source */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(item.date)}</span>
                    {item.source && (
                      <>
                        <span>•</span>
                        <span>{item.source}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {/* Show More/Less Button */}
            {unifiedItems.length > 6 && (
              <Button 
                onClick={() => setShowAll(!showAll)}
                variant="outline" 
                className="w-full"
              >
                {showAll ? 'Toon minder' : `Toon meer (${unifiedItems.length - 6} extra items)`}
              </Button>
            )}

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button asChild size="sm" variant="outline" className="hover:bg-primary/10">
                <Link to="/news">
                  <Newspaper className="w-4 h-4 mr-2" />
                  Alle Nieuws
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="hover:bg-primary/10">
                <Link to="/plaat-verhaal">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Alle Verhalen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Geen content beschikbaar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};