import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Music, Newspaper, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import blogPlaceholder1 from "@/assets/blog-placeholder-1.jpg";
import blogPlaceholder2 from "@/assets/blog-placeholder-2.jpg";
import blogPlaceholder3 from "@/assets/blog-placeholder-3.jpg";

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

interface AlbumBlogPost {
  id: string;
  slug: string;
  album_id: string;
  artist: string;
  title: string;
  published_at: string;
  album_cover_url?: string;
  yaml_frontmatter: any;
}

// Helper function to get a placeholder image based on blog post ID
const getPlaceholderImage = (postId: string) => {
  const placeholders = [blogPlaceholder1, blogPlaceholder2, blogPlaceholder3];
  const index = postId.charCodeAt(0) % placeholders.length;
  return placeholders[index];
};

const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  // First try to get from database
  const { data: blogPosts, error } = await supabase
    .from('news_blog_posts')
    .select('id, title, summary, source, published_at, category, slug, image_url')
    .order('published_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching blog posts from database:', error);
  }

  // If we have recent blog posts from database, use them
  if (blogPosts && blogPosts.length > 0) {
    const latestPost = new Date(blogPosts[0].published_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - latestPost.getTime()) / (1000 * 60 * 60);
    
    // Use cached posts if they are less than 6 hours old
    if (hoursDiff < 6) {
      return blogPosts;
    }
  }

  // Fallback to generating new posts
  const { data: newBlogPosts, error: functionError } = await supabase.functions.invoke('music-news-perplexity');
  
  if (functionError) {
    console.error('Error generating new blog posts:', functionError);
    // Return existing posts even if old
    return blogPosts || [];
  }

  // Get fresh posts from database after generation
  const { data: freshBlogPosts } = await supabase
    .from('news_blog_posts')
    .select('id, title, summary, source, published_at, category, slug, image_url')
    .order('published_at', { ascending: false })
    .limit(6);

  return freshBlogPosts || [];
};

interface NewsSectionProps {
  compact?: boolean;
  limit?: number;
}

export const NewsSection = ({ compact = false, limit }: NewsSectionProps = {}) => {
  const [newsSource, setNewsSource] = useState<'perplexity' | 'blog'>('perplexity');
  const [isExpanded, setIsExpanded] = useState(false);

  // Use the blog posts query for perplexity news
  const { data: blogPosts = [], isLoading: isLoadingBlogPosts, error: blogPostsError } = useQuery({
    queryKey: ["music-blog-posts"],
    queryFn: fetchBlogPosts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Use album blogs query for blog stories - fetch real data from database
  const { data: albumBlogs = [], isLoading: isLoadingAlbumBlogs, error: albumBlogsError } = useQuery({
    queryKey: ["album-blogs-real"],
    queryFn: async (): Promise<AlbumBlogPost[]> => {
      const { data: blogPosts, error } = await supabase
        .from('blog_posts')
        .select('id, slug, album_id, published_at, created_at, album_cover_url, yaml_frontmatter')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
      }

      if (!blogPosts) return [];

      return blogPosts.map(post => {
        const frontmatter = (post.yaml_frontmatter as any) || {};
        return {
          id: post.id,
          slug: post.slug,
          album_id: post.album_id,
          artist: frontmatter?.artist || 'Onbekende Artiest',
          title: frontmatter?.title || 'Onbekende Titel',
          published_at: post.published_at || post.created_at,
          album_cover_url: post.album_cover_url,
          yaml_frontmatter: frontmatter
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  const loading = newsSource === 'perplexity' ? isLoadingBlogPosts : isLoadingAlbumBlogs;
  const error = newsSource === 'perplexity' ? blogPostsError : albumBlogsError;

  // Compact mode for homepage
  if (compact) {
    const displayItems = blogPosts.slice(0, limit || 3);
    
    if (isLoadingBlogPosts) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayItems.map((post) => (
          <Link key={post.id} to={`/nieuws/${post.slug}`}>
            <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img 
                  src={post.image_url || getPlaceholderImage(post.id)} 
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-2 mb-2">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.summary}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  }

  const handleSourceSwitch = (source: 'perplexity' | 'blog') => {
    if (source !== newsSource) {
      setNewsSource(source);
    }
  };
  
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Laatste Muzieknieuws
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Blijf op de hoogte van het laatste muzieknieuws
          </p>
          
          <div className="flex justify-center gap-4">
            <Button 
              variant={newsSource === 'perplexity' ? 'default' : 'outline'} 
              onClick={() => handleSourceSwitch('perplexity')} 
              className="flex items-center gap-2"
            >
              <Newspaper className="w-4 h-4" />
              Muzieknieuws
            </Button>
            <Button 
              variant={newsSource === 'blog' ? 'default' : 'outline'} 
              onClick={() => handleSourceSwitch('blog')} 
              className="flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              Blog verhalen
            </Button>
          </div>
        </div>

        {loading && <LoadingSkeleton />}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">
              {typeof error === 'string' ? error : 'Er is een fout opgetreden bij het ophalen van de gegevens.'}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Opnieuw proberen
            </Button>
          </div>
        )}

        {!loading && !error && newsSource === 'perplexity' && (
          <div>
            {/* Initial 3 items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.slice(0, 3).map((post: BlogPost) => (
                <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {post.source} • {new Date(post.published_at).toLocaleDateString('nl-NL')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={post.image_url || getPlaceholderImage(post.id)} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-sm mb-4 line-clamp-3">{post.summary}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {post.category}
                      </span>
                      <Link 
                        to={`/nieuws/${post.slug}`}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm group-hover:gap-2 transition-all duration-200"
                      >
                        Lees meer <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Collapsible section for remaining items */}
            {blogPosts.length > 3 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {blogPosts.slice(3).map((post: BlogPost) => (
                      <Card key={post.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {post.source} • {new Date(post.published_at).toLocaleDateString('nl-NL')}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                            <img 
                              src={post.image_url || getPlaceholderImage(post.id)} 
                              alt={post.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-sm mb-4 line-clamp-3">{post.summary}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {post.category}
                            </span>
                            <Link 
                              to={`/nieuws/${post.slug}`}
                              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm group-hover:gap-2 transition-all duration-200"
                            >
                              Lees meer <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
                
                <div className="flex justify-center mt-8">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      {isExpanded ? (
                        <>
                          Toon minder <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Toon meer ({blogPosts.length - 3} meer) <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </Collapsible>
            )}
          </div>
        )}

        {!loading && !error && newsSource === 'blog' && (
          <div>
            {/* Initial 3 items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albumBlogs.slice(0, 3).map((blog: AlbumBlogPost) => (
                <Link key={blog.id} to={`/plaat-verhaal/${blog.slug}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1">
                        {blog.yaml_frontmatter?.title || blog.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {blog.artist} • {new Date(blog.published_at).toLocaleDateString('nl-NL')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {blog.album_cover_url && (
                        <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                          <img 
                            src={blog.album_cover_url} 
                            alt={blog.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <p className="text-sm mb-4 line-clamp-3">
                        {blog.yaml_frontmatter?.excerpt || `Een verhaal over ${blog.title} van ${blog.artist}`}
                      </p>
                      <div className="flex items-center justify-end">
                        <span className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm group-hover:gap-2 transition-all duration-200">
                          Lees meer <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Collapsible section for remaining items */}
            {albumBlogs.length > 3 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {albumBlogs.slice(3).map((blog: AlbumBlogPost) => (
                      <Link key={blog.id} to={`/plaat-verhaal/${blog.slug}`}>
                        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg line-clamp-1">
                              {blog.yaml_frontmatter?.title || blog.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {blog.artist} • {new Date(blog.published_at).toLocaleDateString('nl-NL')}
                            </p>
                          </CardHeader>
                          <CardContent>
                            {blog.album_cover_url && (
                              <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                                <img 
                                  src={blog.album_cover_url} 
                                  alt={blog.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <p className="text-sm mb-4 line-clamp-3">
                              {blog.yaml_frontmatter?.excerpt || `Een verhaal over ${blog.title} van ${blog.artist}`}
                            </p>
                            <div className="flex items-center justify-end">
                              <span className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm group-hover:gap-2 transition-all duration-200">
                                Lees meer <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
                
                <div className="flex justify-center mt-8">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      {isExpanded ? (
                        <>
                          Toon minder <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Toon meer ({albumBlogs.length - 3} meer) <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </Collapsible>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
