import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Tag, ExternalLink, ShoppingCart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSEO } from '@/hooks/useSEO';
import { ArticleStructuredData } from '@/components/SEO/StructuredData';
import { BreadcrumbNavigation } from '@/components/SEO/BreadcrumbNavigation';

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
}

export const PlaatVerhaal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const frontmatter = blog?.yaml_frontmatter || {};
  const title = frontmatter.title || 'Plaat & Verhaal';
  const artist = frontmatter.artist || '';
  const album = frontmatter.album || '';
  const year = frontmatter.year || '';
  const genre = frontmatter.genre || '';
  const readingTime = frontmatter.reading_time || 5;
  const tags = frontmatter.tags || [];
  const price = frontmatter.price_eur || 0;

  // SEO setup
  useSEO({
    title: frontmatter.meta_title || `${artist} - ${album} | Plaat & Verhaal`,
    description: frontmatter.meta_description || `Het verhaal achter ${artist} - ${album} (${year}). Alles over deze ${genre} plaat.`,
    keywords: [`${artist}`, `${album}`, genre, `${year}`, 'vinyl', 'cd', 'muziek', 'review'].filter(Boolean).join(', '),
    image: frontmatter.og_image || '/placeholder.svg'
  });

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        
        // Fetch blog post by slug
        const { data: blogData, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();

        if (error) throw error;

        if (!blogData) {
          setNotFound(true);
          return;
        }

        setBlog(blogData as BlogPost);

        // Increment view count
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4 w-1/3"></div>
          <div className="h-12 bg-muted rounded mb-6 w-2/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Artikel niet gevonden</h1>
        <p className="text-muted-foreground mb-6">
          Het artikel dat je zoekt bestaat niet of is niet meer beschikbaar.
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar home
        </Button>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Plaat & Verhaal', url: '/plaat-verhaal' },
    { name: `${artist} - ${album}`, url: `/plaat-verhaal/${slug}` }
  ];

  return (
    <>
      <ArticleStructuredData
        title={title}
        description={frontmatter.meta_description || `Het verhaal achter ${artist} - ${album}`}
        publishDate={blog.published_at || blog.created_at}
        author="VinylVault"
        image={frontmatter.og_image}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BreadcrumbNavigation items={breadcrumbs} />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug
        </Button>

        <article className="prose prose-lg max-w-none">
          {/* Header */}
          <header className="mb-8 not-prose">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className="uppercase">
                {blog.album_type}
              </Badge>
              {genre && (
                <Badge variant="secondary">
                  <Tag className="w-3 h-3 mr-1" />
                  {genre}
                </Badge>
              )}
              {year && (
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {year}
                </Badge>
              )}
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {readingTime} min
              </Badge>
            </div>

            <h1 className="text-4xl font-bold leading-tight mb-4">
              {title}
            </h1>
            
            <div className="text-lg text-muted-foreground mb-6">
              {artist} - {album} {year && `(${year})`}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="text-sm text-muted-foreground flex items-center gap-4">
              <span>
                Gepubliceerd op {new Date(blog.published_at || blog.created_at).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span>
                {blog.views_count || 0} views
              </span>
            </div>
          </header>

          {/* Content */}
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-medium mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {blog.markdown_content}
            </ReactMarkdown>
          </div>
        </article>

        {/* Product Card */}
        {blog.product_card && price > 0 && (
          <Card className="mt-8 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    <ShoppingCart className="w-5 h-5 inline mr-2" />
                    Deze plaat kopen
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    {artist} - {album}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    €{price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <Button size="lg" className="mb-2">
                    In winkelwagen
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Staat: {frontmatter.condition_media}/{frontmatter.condition_sleeve}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Share */}
        {blog.social_post && (
          <Card className="mt-6 bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Delen op social media:</h4>
              <p className="text-sm text-muted-foreground">
                {blog.social_post}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title,
                      text: blog.social_post,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(`${blog.social_post}\n\n${window.location.href}`);
                  }
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Delen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};