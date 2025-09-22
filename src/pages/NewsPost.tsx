import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSEO } from "@/hooks/useSEO";

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
    .from('news_blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }

  // Increment views count
  if (data) {
    await supabase
      .from('news_blog_posts')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', data.id);
  }

  return data;
};

export const NewsPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchBlogPost(slug!),
    enabled: !!slug,
  });

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
    return <Navigate to="/news" replace />;
  }

  return (
    <article className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link to="/news">
            <Button variant="ghost" className="mb-6 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Terug naar nieuws
            </Button>
          </Link>

          {/* Article header */}
          <header>
            {post.image_url && (
              <div className="mb-6">
                <img 
                  src={post.image_url} 
                  alt={post.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
            
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.published_at).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views_count} weergaves
              </div>
            </div>

            <Badge variant="secondary" className="mb-8">
              {post.category}
            </Badge>
          </header>
        </div>

        {/* Article content */}
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mt-8 mb-4 first:mt-0">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-medium mt-6 mb-3">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-foreground">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 ml-6 space-y-1 list-disc">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 ml-6 space-y-1 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-6 my-6 italic">
                  {children}
                </blockquote>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Article footer */}
        <footer className="mt-12 pt-8 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Gepubliceerd op {new Date(post.published_at).toLocaleDateString('nl-NL')}
            </p>
            <Link to="/news">
              <Button variant="outline">
                Meer muzieklnieuws
              </Button>
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
};