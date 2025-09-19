import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Eye, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RelatedArticle {
  id: string;
  slug: string;  
  yaml_frontmatter: any; // Using any for JSON data from Supabase
  views_count: number;
  published_at: string;
}

interface RelatedArticlesProps {
  currentSlug: string;
  genre?: string;
  artist?: string;
  maxResults?: number;
}

export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  currentSlug,
  genre,
  artist,
  maxResults = 3
}) => {
  const [relatedArticles, setRelatedArticles] = React.useState<RelatedArticle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Build query conditions for related content
        let query = supabase
          .from('blog_posts')
          .select('id, slug, yaml_frontmatter, views_count, published_at')
          .eq('is_published', true)
          .neq('slug', currentSlug)
          .order('published_at', { ascending: false })
          .limit(maxResults + 3); // Get more to filter better matches

        const { data: articles, error } = await query;

        if (error) {
          console.error('Error fetching related articles:', error);
          return;
        }

        if (!articles) return;

        // Score articles based on relevance
        const scoredArticles = articles
          .map(article => {
            let score = 0;
            const frontmatter = article.yaml_frontmatter as any || {};
            
            // Same artist gets high score
            if (artist && frontmatter.artist && String(frontmatter.artist).toLowerCase().includes(artist.toLowerCase())) {
              score += 10;
            }
            
            // Same genre gets medium score
            if (genre && frontmatter.genre && String(frontmatter.genre).toLowerCase().includes(genre.toLowerCase())) {
              score += 5;
            }
            
            // Similar year gets small score
            if (frontmatter.year && Math.abs(Number(frontmatter.year) - new Date().getFullYear()) < 10) {
              score += 1;
            }
            
            // Popular articles get small boost
            score += Math.min(article.views_count || 0, 100) / 100;
            
            return { ...article, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, maxResults);

        setRelatedArticles(scoredArticles);
      } catch (error) {
        console.error('Error fetching related articles:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentSlug) {
      fetchRelatedArticles();
    }
  }, [currentSlug, genre, artist, maxResults]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerelateerde Verhalen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gerelateerde Verhalen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relatedArticles.map((article) => {
            const frontmatter = (article.yaml_frontmatter as any) || {};
            return (
              <div key={article.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-3">
                  {frontmatter.og_image && (
                    <img 
                      src={String(frontmatter.og_image)} 
                      alt={`${frontmatter.artist || ''} - ${frontmatter.album || ''}`}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {frontmatter.title || `${frontmatter.artist || ''} - ${frontmatter.album || ''}`}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{frontmatter.artist || ''}</span>
                      {frontmatter.year && (
                        <>
                          <span>•</span>
                          <span>{frontmatter.year}</span>
                        </>
                      )}
                      {frontmatter.reading_time && (
                        <>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{frontmatter.reading_time} min</span>
                        </>
                      )}
                      <span>•</span>
                      <Eye className="h-3 w-3" />
                      <span>{article.views_count || 0}</span>
                    </div>
                    {frontmatter.genre && (
                      <Badge variant="secondary" className="text-xs">
                        {String(frontmatter.genre)}
                      </Badge>
                    )}
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Link to={`/plaat-verhaal/${article.slug}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};