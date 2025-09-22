import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Music, Disc3, Newspaper, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useDiscogsNews } from "@/hooks/useNewsCache";
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

export const NewsSection = () => {
  const [newsSource, setNewsSource] = useState<'discogs' | 'perplexity' | 'blog'>('discogs');
  const [isExpanded, setIsExpanded] = useState(false);

  // Use the cached hooks for different sources
  const { data: discogsReleases = [], isLoading: isLoadingDiscogs, error: discogsError } = useDiscogsNews();
  
  // Use the blog posts query for perplexity news
  const { data: blogPosts = [], isLoading: isLoadingBlogPosts, error: blogPostsError } = useQuery({
    queryKey: ["music-blog-posts"],
    queryFn: fetchBlogPosts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Use album blogs query for blog stories - using mock data for now
  const { data: albumBlogs = [], isLoading: isLoadingAlbumBlogs, error: albumBlogsError } = useQuery({
    queryKey: ["album-blogs-mock"],
    queryFn: async (): Promise<AlbumBlogPost[]> => {
      // Mock album blog data until we can properly connect to the blog_posts table
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
      return [
        {
          id: "1",
          slug: "pink-floyd-dark-side-moon",
          album_id: "album1",
          artist: "Pink Floyd",
          title: "The Dark Side of the Moon",
          published_at: "2024-09-20T12:00:00Z",
          album_cover_url: null,
          yaml_frontmatter: {}
        },
        {
          id: "2", 
          slug: "beatles-abbey-road",
          album_id: "album2",
          artist: "The Beatles",
          title: "Abbey Road",
          published_at: "2024-09-19T12:00:00Z",
          album_cover_url: null,
          yaml_frontmatter: {}
        },
        {
          id: "3",
          slug: "led-zeppelin-iv",
          album_id: "album3", 
          artist: "Led Zeppelin",
          title: "Led Zeppelin IV",
          published_at: "2024-09-18T12:00:00Z",
          album_cover_url: null,
          yaml_frontmatter: {}
        }
      ];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  const loading = newsSource === 'discogs' 
    ? isLoadingDiscogs 
    : newsSource === 'perplexity' 
    ? isLoadingBlogPosts 
    : isLoadingAlbumBlogs;
    
  const error = newsSource === 'discogs' 
    ? discogsError 
    : newsSource === 'perplexity' 
    ? blogPostsError 
    : albumBlogsError;

  const handleSourceSwitch = (source: 'discogs' | 'perplexity' | 'blog') => {
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
            Blijf op de hoogte van de nieuwste releases en muzieknieuws
          </p>
          
          <div className="flex justify-center gap-4">
            <Button 
              variant={newsSource === 'discogs' ? 'default' : 'outline'} 
              onClick={() => handleSourceSwitch('discogs')} 
              className="flex items-center gap-2"
            >
              <Disc3 className="w-4 h-4" />
              Nieuwe Releases
            </Button>
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

        {!loading && !error && newsSource === 'discogs' && (
          <div>
            {/* Initial 3 items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(discogsReleases as any[]).slice(0, 3).map((release: any) => (
                <Card key={release.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-1">{release.title || 'Onbekende titel'}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {release.artist || 'Onbekende artiest'} • {release.year || 'Jaar onbekend'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {(release.stored_image || release.thumb || release.artwork) && (
                      <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                        <img 
                          src={release.stored_image || release.thumb || release.artwork} 
                          alt={`${release.title} cover`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Fallback to original thumb if stored image fails
                            if (release.stored_image && e.currentTarget.src === release.stored_image) {
                              e.currentTarget.src = release.thumb || release.artwork || '';
                            }
                          }}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      {release.format && Array.isArray(release.format) && release.format.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Format: {release.format.join(', ')}
                        </p>
                      )}
                      {release.genre && Array.isArray(release.genre) && release.genre.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Genre: {release.genre.slice(0, 2).join(', ')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Collapsible section for remaining items */}
            {(discogsReleases as any[]).length > 3 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {(discogsReleases as any[]).slice(3).map((release: any) => (
                      <Card key={release.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg line-clamp-1">{release.title || 'Onbekende titel'}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {release.artist || 'Onbekende artiest'} • {release.year || 'Jaar onbekend'}
                          </p>
                        </CardHeader>
                        <CardContent>
                          {(release.stored_image || release.thumb || release.artwork) && (
                            <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                              <img 
                                src={release.stored_image || release.thumb || release.artwork} 
                                alt={`${release.title} cover`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  // Fallback to original thumb if stored image fails
                                  if (release.stored_image && e.currentTarget.src === release.stored_image) {
                                    e.currentTarget.src = release.thumb || release.artwork || '';
                                  }
                                }}
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            {release.format && Array.isArray(release.format) && release.format.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Format: {release.format.join(', ')}
                              </p>
                            )}
                            {release.genre && Array.isArray(release.genre) && release.genre.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Genre: {release.genre.slice(0, 2).join(', ')}
                              </p>
                            )}
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
                          Toon meer ({(discogsReleases as any[]).length - 3} meer) <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </Collapsible>
            )}
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
            {/* Album blog stories content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albumBlogs.slice(0, 3).map((blog: AlbumBlogPost) => (
                <Card key={blog.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-accent/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2 text-accent">{blog.artist} - {blog.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Album verhaal • {new Date(blog.published_at).toLocaleDateString('nl-NL')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={blog.album_cover_url || getPlaceholderImage(blog.id)} 
                        alt={`${blog.artist} - ${blog.title}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-sm mb-4 line-clamp-3">
                      Ontdek het verhaal achter "{blog.title}" van {blog.artist}. Een diepgaande blik op de muziek, de tijd en de betekenis van dit iconische album.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                        Album Verhaal
                      </span>
                      <Link 
                        to={`/plaat-verhaal/${blog.slug}`}
                        className="inline-flex items-center gap-1 text-accent hover:text-accent/80 text-sm group-hover:gap-2 transition-all duration-200"
                      >
                        Lees verhaal <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Collapsible section for remaining album stories */}
            {albumBlogs.length > 3 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {albumBlogs.slice(3).map((blog: AlbumBlogPost) => (
                      <Card key={blog.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-accent/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg line-clamp-2 text-accent">{blog.artist} - {blog.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Album verhaal • {new Date(blog.published_at).toLocaleDateString('nl-NL')}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                            <img 
                              src={blog.album_cover_url || getPlaceholderImage(blog.id)} 
                              alt={`${blog.artist} - ${blog.title}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-sm mb-4 line-clamp-3">
                            Ontdek het verhaal achter "{blog.title}" van {blog.artist}. Een diepgaande blik op de muziek, de tijd en de betekenis van dit iconische album.
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                              Album Verhaal
                            </span>
                            <Link 
                              to={`/plaat-verhaal/${blog.slug}`}
                              className="inline-flex items-center gap-1 text-accent hover:text-accent/80 text-sm group-hover:gap-2 transition-all duration-200"
                            >
                              Lees verhaal <ArrowRight className="w-3 h-3" />
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