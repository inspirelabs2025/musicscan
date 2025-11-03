import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Tag, ExternalLink, ShoppingCart, Music, Disc3, Share2, Copy, Eye, Heart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSEO } from '@/hooks/useSEO';
import { ArticleStructuredData } from '@/components/SEO/StructuredData';
import { BreadcrumbNavigation } from '@/components/SEO/BreadcrumbNavigation';
import { useToast } from '@/hooks/use-toast';
import { ReviewsSection } from '@/components/blog/ReviewsSection';
import { CommentsSection } from '@/components/blog/CommentsSection';
import { RelatedArticles } from '@/components/SEO/RelatedArticles';
import { SpotifyAlbumLink } from '@/components/SpotifyAlbumLink';



interface BlogPost {
  id: string;
  album_id: string;
  album_type: 'cd' | 'vinyl';
  yaml_frontmatter: Record<string, any>;
  markdown_content: string;
  social_post?: string;
  product_card?: Record<string, any>;
  slug: string;
  is_published: boolean;
  views_count: number;
  created_at: string;
  published_at?: string;
  album_cover_url?: string;
}

export const PlaatVerhaal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  const frontmatter = blog?.yaml_frontmatter || {};
  const title = frontmatter.title || 'Plaat & Verhaal';
  const artist = frontmatter.artist || '';
  const album = frontmatter.album || '';
  const year = frontmatter.year || '';
  const genre = frontmatter.genre || '';
  const readingTime = frontmatter.reading_time || 5;
  const tags = frontmatter.tags || [];
  const price = frontmatter.price_eur || 0;

  // Enhanced SEO setup
  const seoDescription = blog?.social_post 
    ? blog.social_post.slice(0, 160)
    : frontmatter.meta_description || `Ontdek het verhaal achter ${artist} - ${album}. Een diepgaande AI-analyse van dit ${genre || 'muziek'} album uit ${year || 'de muziekgeschiedenis'}. Inclusief prijsanalyse en verzamelwaarde.`;
  
  const seoKeywords = [
    artist,
    album,
    genre,
    `${artist} ${album}`,
    `${album} recensie`,
    `${artist} album`,
    'vinyl verzameling',
    'cd collectie',
    'muziek analyse',
    'album verhaal',
    'discogs waarde',
    year && `${year} muziek`
  ].filter(Boolean).join(', ');

  useSEO({
    title: frontmatter.meta_title || `${artist} - ${album} | Plaat & Verhaal`,
    description: seoDescription,
    keywords: seoKeywords,
    image: blog?.album_cover_url || frontmatter.og_image || '/placeholder.svg',
    type: 'article',
    canonicalUrl: blog ? `https://www.musicscan.app/plaat-verhaal/${blog.slug}` : `https://www.musicscan.app/plaat-verhaal/${slug}`
  });

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;

      // Helper: parse base and year from slug pattern "<base>-<year|unknown>"
      const parseSlug = (s: string) => {
        const m = s.match(/^(.*)-((?:\d{4})|unknown)$/);
        if (m) {
          return { base: m[1], year: m[2] } as const;
        }
        return { base: s, year: null as string | null } as const;
      };

      const { base, year: yearPart } = parseSlug(slug);

      try {
        setLoading(true);

        // 1) Try exact slug first
        let { data: blogData, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (error) throw error;

        // 2) If not found, try the same base with -unknown (common legacy)
        if (!blogData && yearPart && yearPart !== 'unknown') {
          const altUnknown = `${base}-unknown`;
          const { data: unknownData, error: unknownErr } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', altUnknown)
            .maybeSingle();
          if (unknownErr) throw unknownErr;
          if (unknownData) {
            blogData = unknownData;
            // Normalize URL to the actual found slug
            setTimeout(() => navigate(`/plaat-verhaal/${unknownData.slug}`, { replace: true }), 0);
          }
        }

        // 3) If still not found, try any slug with the same base prefix (any year)
        if (!blogData) {
          const { data: prefixList, error: prefixErr } = await supabase
            .from('blog_posts')
            .select('*')
            .ilike('slug', `${base}-%`)
            .order('created_at', { ascending: false })
            .limit(1);
          if (prefixErr) throw prefixErr;
          if (prefixList && prefixList.length > 0) {
            blogData = prefixList[0];
            setTimeout(() => navigate(`/plaat-verhaal/${prefixList[0].slug}`, { replace: true }), 0);
          }
        }

        // 4) As a last resort, try the base without year (for very old records)
        if (!blogData) {
          const { data: baseData, error: baseErr } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', base)
            .maybeSingle();
          if (baseErr) throw baseErr;
          if (baseData) {
            blogData = baseData;
            setTimeout(() => navigate(`/plaat-verhaal/${baseData.slug}`, { replace: true }), 0);
          }
        }

        if (!blogData) {
          setNotFound(true);
          return;
        }

        setBlog(blogData as BlogPost);

        // Increment view count (best-effort)
        await supabase
          .from('blog_posts')
          .update({ views_count: (blogData.views_count || 0) + 1 })
          .eq('id', blogData.id);
      } catch (error) {
        console.error('Error fetching blog:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  const handleShare = async () => {
    const shareData = {
      title: `${artist} - ${album}`,
      text: blog?.social_post || `Check deze review van ${artist} - ${album}!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
      toast({
        title: "Link gekopieerd!",
        description: "De link is naar je klembord gekopieerd.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative container mx-auto px-4 py-8">
          <div className="animate-pulse max-w-4xl mx-auto">
            {/* Header Skeleton */}
            <div className="h-6 bg-muted rounded mb-4 w-32"></div>
            <div className="h-16 bg-gradient-to-r from-vinyl-gold/20 to-primary/20 rounded-xl mb-8"></div>
            
            {/* Content Skeleton */}
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="space-y-3 mt-8">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative text-center max-w-md mx-auto px-4">
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
            <Disc3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-spin [animation-duration:8s]" />
            <h1 className="text-2xl font-bold mb-4">Artikel niet gevonden</h1>
            <p className="text-muted-foreground mb-6">
              Het artikel dat je zoekt bestaat niet of is niet meer beschikbaar.
            </p>
            <Button onClick={() => navigate('/')} size="lg" className="group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Terug naar home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Muziek Nieuws', url: '/news' },
    { name: 'Album Verhalen', url: '/news?tab=verhalen' },
    { name: `${artist} - ${album}`, url: `/plaat-verhaal/${slug}` }
  ];

  // Robuuste schoonmaak van markdown: verwijder YAML/frontmatter (ook in codeblokken) en SOCIAL_POST
  const cleanMarkdown = (raw: string): string => {
    if (!raw) return '';
    let s = raw.trimStart();

    // 1) Verwijder vooraan een codefence met YAML-frontmatter
    s = s.replace(
      /^```(?:yaml|yml)?\s*\n(?:---\s*\n)?[\s\S]*?\n---\s*\n```(?:\s*\n)?/i,
      ''
    );

    // 2) Verwijder normale YAML frontmatter aan het begin
    s = s.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');

    // 3) Verwijder SOCIAL_POST blok en alles erna
    s = s.replace(/<!--\s*SOCIAL_POST\s*-->[\s\S]*$/i, '');

    // 4) Haal evt. omvattende markdown-codefence weg
    s = s.replace(/^```(?:markdown)?\s*\n([\s\S]*?)\n```$/i, '$1');

    return s.trim();
  };

  const cleanedMarkdown = cleanMarkdown(blog.markdown_content || '');

  return (
    <>
      <ArticleStructuredData
        title={title}
        description={frontmatter.meta_description || `Het verhaal achter ${artist} - ${album}`}
        publishDate={blog.published_at || blog.created_at}
        author="MusicScan AI"
        image={blog?.album_cover_url || frontmatter.og_image}
        artist={artist}
        album={album}
        genre={genre}
        price={price > 0 ? price : undefined}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* Floating Musical Notes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Music className="absolute top-20 left-[10%] w-6 h-6 text-vinyl-gold/20 animate-float" style={{ animationDelay: '0s' }} />
          <Music className="absolute top-40 right-[15%] w-4 h-4 text-primary/20 animate-float" style={{ animationDelay: '2s' }} />
          <Music className="absolute bottom-40 left-[20%] w-5 h-5 text-vinyl-gold/30 animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative container mx-auto px-4 py-8 max-w-4xl">
          <BreadcrumbNavigation items={breadcrumbs} />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-primary/10 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Terug
          </Button>

          {/* Hero Section */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-vinyl opacity-20 rounded-3xl blur-xl"></div>
            <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border border-border/50 p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Album Cover */}
                {blog.album_cover_url && (
                  <div className="lg:col-span-3 order-first lg:order-last">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-vinyl-gold/20 to-primary/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                      <img
                        src={blog.album_cover_url}
                        alt={`${artist} - ${album} album cover`}
                        className="relative w-full aspect-square object-cover rounded-2xl border border-border/30 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className={blog.album_cover_url ? "lg:col-span-9" : "lg:col-span-12"}>
                  {/* Header Badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge 
                      variant="secondary" 
                      className="bg-vinyl-gold/20 text-vinyl-gold border-vinyl-gold/30 hover:bg-vinyl-gold/30 transition-colors"
                    >
                      <Disc3 className="w-3 h-3 mr-1" />
                      {blog.album_type.toUpperCase()}
                    </Badge>
                    {genre && (
                      <Badge variant="outline" className="border-primary/30 hover:bg-primary/10 transition-colors">
                        <Tag className="w-3 h-3 mr-1" />
                        {genre}
                      </Badge>
                    )}
                    {year && (
                      <Badge variant="outline" className="border-muted-foreground/30">
                        <Calendar className="w-3 h-3 mr-1" />
                        {year}
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-muted-foreground/30">
                      <Clock className="w-3 h-3 mr-1" />
                      {readingTime} min leestijd
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30">
                      <Eye className="w-3 h-3 mr-1" />
                      {blog.views_count || 0} views
                    </Badge>
                  </div>

                  {/* Main Title */}
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {title}
                  </h1>
                  
                  {/* Artist & Album */}
                  <div className="text-xl md:text-2xl text-muted-foreground mb-8 font-medium">
                    <span className="text-primary">{artist}</span>
                    <span className="mx-3 text-vinyl-gold">•</span>
                    <span>{album}</span>
                    {year && <span className="text-muted-foreground/70 ml-2">({year})</span>}
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {tags.map((tag: string, index: number) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Gepubliceerd op {new Date(blog.published_at || blog.created_at).toLocaleDateString('nl-NL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleShare}
                      className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Delen
                    </Button>
                    {artist && album && (
                      <SpotifyAlbumLink
                        artist={artist}
                        album={album}
                        audioLinks={frontmatter.audio_links}
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-primary transition-colors"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <article className="relative">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 md:p-12">
              <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-foreground/80 prose-code:bg-muted prose-code:text-foreground prose-code:px-2 prose-code:py-1 prose-code:rounded">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold mt-12 mb-6 first:mt-0 bg-gradient-to-r from-primary to-vinyl-gold bg-clip-text text-transparent">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-semibold mt-10 mb-5 text-foreground flex items-center gap-3">
                        <Disc3 className="w-6 h-6 text-vinyl-gold flex-shrink-0" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-medium mt-8 mb-4 text-foreground">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-6 leading-relaxed text-foreground/90 text-lg">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-none pl-0 mb-6 space-y-2">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-3 text-foreground/90">
                        <span className="w-2 h-2 bg-vinyl-gold rounded-full mt-3 flex-shrink-0"></span>
                        <span>{children}</span>
                      </li>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 mb-6 space-y-2 text-foreground/90">
                        {children}
                      </ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary pl-6 my-8 italic text-lg text-foreground/80 bg-primary/5 py-4 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-muted px-3 py-1 rounded-md text-sm font-mono text-foreground border border-border/50">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {cleanedMarkdown}
                </ReactMarkdown>
              </div>
            </div>
          </article>

          {/* Product Card */}
          {blog.product_card && price > 0 && (
            <div className="mt-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-vinyl-gold/20 to-primary/20 rounded-2xl blur-xl"></div>
                <Card className="relative bg-card/80 backdrop-blur-sm border-vinyl-gold/30 hover:border-vinyl-gold/50 transition-colors">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3 text-foreground flex items-center gap-3">
                          <ShoppingCart className="w-6 h-6 text-vinyl-gold" />
                          Deze plaat kopen
                        </h3>
                        <p className="text-lg text-muted-foreground mb-4">
                          {artist} - {album}
                        </p>
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-3xl font-bold text-vinyl-gold">
                            €{price.toFixed(2)}
                          </span>
                          {frontmatter.condition_media && (
                            <Badge variant="outline" className="border-primary/30">
                              Staat: {frontmatter.condition_media}/{frontmatter.condition_sleeve}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button size="lg" className="bg-vinyl-gold hover:bg-vinyl-gold/90 text-black font-semibold px-8 group">
                          <ShoppingCart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                          In winkelwagen
                        </Button>
                        <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/10">
                          <Heart className="w-5 h-5 mr-2" />
                          Opslaan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Social Share */}
          {blog.social_post && (
            <div className="mt-8">
              <Card className="bg-muted/30 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Deel dit verhaal
                  </h4>
                  <p className="text-muted-foreground mb-4 italic">
                    "{blog.social_post}"
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="hover:bg-primary/10 border-primary/30"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Delen
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(window.location.href);
                        toast({
                          title: "Link gekopieerd!",
                          description: "De link is naar je klembord gekopieerd.",
                        });
                      }}
                      className="hover:bg-muted/50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Kopieer link
                    </Button>
                    {artist && album && (
                      <SpotifyAlbumLink
                        artist={artist}
                        album={album}
                        audioLinks={frontmatter.audio_links}
                        variant="outline"
                        size="sm"
                        className="hover:bg-green-50 border-green-200 dark:hover:bg-green-950 dark:border-green-800"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}



          {/* Related Albums - Internal Linking for SEO */}
          <RelatedArticles 
            currentSlug={blog.slug}
            artist={artist}
            genre={genre}
            maxResults={6}
          />

          {/* Reviews Section */}
          <div className="mt-12">
            <ReviewsSection blogPostId={blog.id} />
          </div>

          {/* Comments Section */}
          <div className="mt-12">
            <CommentsSection blogPostId={blog.id} />
          </div>
        </div>
      </div>
    </>
  );
};