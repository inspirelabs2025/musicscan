import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Eye, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RelatedArticle {
  id: string;
  slug: string;  
  yaml_frontmatter: any;
  views_count: number;
  published_at: string;
  album_cover_url?: string;
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
        
        // STRATEGY 1: Try to find albums by the same artist first
        let articles = [];
        
        if (artist) {
          const { data: sameArtistArticles, error: artistError } = await supabase
            .from('blog_posts')
            .select('id, slug, yaml_frontmatter, views_count, published_at, album_cover_url')
            .eq('is_published', true)
            .neq('slug', currentSlug)
            .order('views_count', { ascending: false })
            .limit(maxResults * 2);

          if (!artistError && sameArtistArticles) {
            // Filter for same artist (case-insensitive)
            articles = sameArtistArticles.filter(article => {
              const frontmatter = article.yaml_frontmatter as any || {};
              const articleArtist = String(frontmatter.artist || '').toLowerCase();
              return articleArtist.includes(artist.toLowerCase()) || 
                     artist.toLowerCase().includes(articleArtist);
            });
          }
        }

        // STRATEGY 2: If not enough same-artist albums, add same-genre albums
        if (articles.length < maxResults && genre) {
          const { data: sameGenreArticles, error: genreError } = await supabase
            .from('blog_posts')
            .select('id, slug, yaml_frontmatter, views_count, published_at, album_cover_url')
            .eq('is_published', true)
            .neq('slug', currentSlug)
            .order('views_count', { ascending: false })
            .limit(maxResults * 2);

          if (!genreError && sameGenreArticles) {
            // Filter for same genre but not already included
            const existingIds = new Set(articles.map(a => a.id));
            const genreArticles = sameGenreArticles.filter(article => {
              if (existingIds.has(article.id)) return false;
              const frontmatter = article.yaml_frontmatter as any || {};
              const articleGenre = String(frontmatter.genre || '').toLowerCase();
              const articleArtist = String(frontmatter.artist || '').toLowerCase();
              
              // Don't mix artists unless same genre
              return articleGenre.includes(genre.toLowerCase()) || 
                     genre.toLowerCase().includes(articleGenre);
            });
            
            articles = [...articles, ...genreArticles];
          }
        }

        // Take only the top results
        setRelatedArticles(articles.slice(0, maxResults));
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
    <div className="mt-12">
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <ExternalLink className="w-6 h-6 text-primary" />
            Meer Albums van Deze Artiest
          </CardTitle>
          <p className="text-muted-foreground">
            Ontdek gerelateerde albums en verhalen
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((article) => {
              const frontmatter = (article.yaml_frontmatter as any) || {};
              return (
                <Link 
                  key={article.id}
                  to={`/plaat-verhaal/${article.slug}`}
                  className="group block"
                >
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 overflow-hidden">
                    {/* Album Cover */}
                    {(frontmatter.og_image || article.album_cover_url) && (
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img 
                          src={String(frontmatter.og_image || article.album_cover_url)} 
                          alt={`${frontmatter.artist || ''} - ${frontmatter.album || ''} album cover`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <CardContent className="p-4">
                      <h4 className="font-bold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {frontmatter.artist || ''}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {frontmatter.album || frontmatter.title || ''}
                      </p>
                      
                      <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                        {frontmatter.year && (
                          <Badge variant="outline" className="text-xs">
                            {frontmatter.year}
                          </Badge>
                        )}
                        {frontmatter.genre && (
                          <Badge variant="secondary" className="text-xs">
                            {String(frontmatter.genre)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          {frontmatter.reading_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {frontmatter.reading_time} min
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {article.views_count || 0}
                          </span>
                        </div>
                        <ExternalLink className="h-3 w-3 group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};