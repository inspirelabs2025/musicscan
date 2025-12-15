import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Eye, Sparkles, Share2, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSEO } from "@/hooks/useSEO";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  published_at: string;
  category: string;
  author: string;
  views_count: number;
  image_url?: string;
}

const fetchBlogPost = async (slug: string): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('album_type', 'news')
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }

  if (!data) return null;

  // Increment views count
  await supabase
    .from('blog_posts')
    .update({ views_count: (data.views_count || 0) + 1 })
    .eq('id', data.id);

  // Transform to expected format
  const frontmatter = data.yaml_frontmatter || {};
  return {
    id: data.id,
    title: frontmatter.title || '',
    content: data.markdown_content || '',
    summary: frontmatter.description || frontmatter.excerpt || '',
    source: frontmatter.source || 'MusicScan',
    published_at: data.published_at || data.created_at,
    category: frontmatter.category || 'Nieuws',
    author: frontmatter.author || 'MusicScan AI',
    views_count: data.views_count || 0,
    image_url: data.album_cover_url || frontmatter.cover_image
  };
};

export const NewsPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchBlogPost(slug!),
    enabled: !!slug,
  });

  // Fetch related articles
  const { data: relatedArticles = [] } = useQuery({
    queryKey: ["related-articles", post?.category],
    queryFn: async () => {
      if (!post) return [];
      
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('album_type', 'news')
        .eq('is_published', true)
        .neq('id', post.id)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (!data) return [];
      
      // Transform related articles
      return data
        .filter((article: any) => {
          const frontmatter = article.yaml_frontmatter || {};
          return frontmatter.category === post.category;
        })
        .map((article: any) => {
          const frontmatter = article.yaml_frontmatter || {};
          return {
            id: article.id,
            slug: article.slug,
            title: frontmatter.title || '',
            summary: frontmatter.description || frontmatter.excerpt || '',
            image_url: article.album_cover_url || frontmatter.cover_image,
          };
        });
    },
    enabled: !!post,
  });

  const handleShare = async () => {
    const url = window.location.href;
    const title = post?.title;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link gekopieerd naar klembord!");
    }
  };

  // SEO optimization
  useSEO({
    title: post ? `${post.title} | Muzieknieuws` : 'Muzieknieuws',
    description: post?.summary || 'Lees het laatste muzieknieuws',
    keywords: post ? `muziek, ${post.category.toLowerCase()}, ${post.title}` : 'muziek, nieuws',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return <Navigate to="/nieuws" replace />;
  }

  return (
    <article className="min-h-screen bg-background">
      {/* Hero Section with Image */}
      {post.image_url && (
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 relative">
        {/* Back Button */}
        <div className={post.image_url ? "-mt-20 relative z-10 mb-8" : "py-8"}>
          <Link to="/nieuws">
            <Button variant="ghost" size="sm" className="mb-6 backdrop-blur-sm bg-background/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar nieuws
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-12 ${post.image_url ? 'relative z-10 -mt-12' : ''}`}
        >
          <div className="flex items-center gap-2 mb-6">
            {post.category && (
              <Badge variant="secondary">
                {post.category}
              </Badge>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
            {post.author && (
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {post.author.charAt(0).toUpperCase()}
                </div>
                {post.author}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at).toLocaleDateString('nl-NL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {post.views_count || 0} weergaves
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Delen
            </Button>
          </div>
        </motion.header>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-lg max-w-none mb-16"
        >
          <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg mb-8">
            <p className="text-lg font-medium text-foreground leading-relaxed italic">
              {post.summary}
            </p>
          </div>

          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mt-12 mb-6 first:mt-0 text-foreground">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-medium mt-8 mb-3 text-foreground">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-6 leading-relaxed text-foreground/90 text-lg">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-6 ml-6 space-y-2 list-disc marker:text-primary">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-6 ml-6 space-y-2 list-decimal marker:text-primary">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed text-foreground/90">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary bg-primary/5 pl-6 py-4 my-8 italic rounded-r-lg">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </motion.div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Gerelateerde Artikelen</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((article: any) => (
                <Link key={article.id} to={`/nieuws/${article.slug}`}>
                  <Card className="group h-full hover:shadow-lg transition-all duration-300 cursor-pointer border hover:border-primary/30">
                    {article.image_url && (
                      <div className="relative h-40 overflow-hidden">
                        <img 
                          src={article.image_url} 
                          alt={article.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.summary}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Article Footer */}
        <footer className="py-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Bron: {post.source || 'MusicScan'}
              </p>
              <p className="text-xs text-muted-foreground">
                Laatste update: {new Date(post.published_at).toLocaleDateString('nl-NL')}
              </p>
            </div>
            <Link to="/nieuws">
              <Button>
                Meer Nieuws
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
};