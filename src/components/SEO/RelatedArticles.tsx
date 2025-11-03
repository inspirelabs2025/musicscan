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
      if (!genre && !artist) return;
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        let articles: any[] = [];

        // STRATEGY 1: Exact artist match using database ILIKE
        if (artist) {
          console.log(`[RelatedArticles] Searching for exact artist: "${artist}"`);
          
          const { data: exactMatch, error: exactError } = await supabase
            .from('blog_posts')
            .select('id, slug, yaml_frontmatter, views_count, published_at, album_cover_url')
            .eq('is_published', true)
            .neq('slug', currentSlug)
            .ilike('yaml_frontmatter->>artist', artist)
            .order('views_count', { ascending: false })
            .limit(maxResults);

          if (exactError) {
            console.error('[RelatedArticles] Error fetching by artist:', exactError);
          } else if (exactMatch && exactMatch.length > 0) {
            console.log(`[RelatedArticles] Found ${exactMatch.length} database matches`);
            
            // Strict client-side validation: exact match only
            articles = exactMatch.filter(article => {
              const frontmatter = article.yaml_frontmatter as any || {};
              const articleArtist = String(frontmatter.artist || '').toLowerCase().trim();
              const targetArtist = artist.toLowerCase().trim();
              const match = 
                articleArtist === targetArtist || 
                articleArtist === `the ${targetArtist}` ||
                `the ${articleArtist}` === targetArtist;
              
              if (!match) {
                console.log(`[RelatedArticles] Filtered out: "${frontmatter.artist}" (not exact match)`);
              }
              return match;
            });

            console.log(`[RelatedArticles] After strict filtering: ${articles.length} articles`);
          }
        }

        // STRATEGY 2: If not enough results, get by same genre (exclude compilations)
        if (articles.length < 3 && genre) {
          console.log(`[RelatedArticles] Not enough artist matches, searching by genre: "${genre}"`);
          
          const { data: genreData, error: genreError } = await supabase
            .from('blog_posts')
            .select('id, slug, yaml_frontmatter, views_count, published_at, album_cover_url')
            .eq('is_published', true)
            .neq('slug', currentSlug)
            .ilike('yaml_frontmatter->>genre', `%${genre}%`)
            .order('views_count', { ascending: false })
            .limit(maxResults * 2);

          if (genreError) {
            console.error('[RelatedArticles] Error fetching by genre:', genreError);
          } else if (genreData) {
            console.log(`[RelatedArticles] Found ${genreData.length} genre matches`);
            
            const existingIds = new Set(articles.map(a => a.id));
            const genreArticles = genreData.filter(article => {
              if (existingIds.has(article.id)) return false;
              
              const frontmatter = article.yaml_frontmatter as any || {};
              const articleArtist = String(frontmatter.artist || '').toLowerCase();
              
              // Exclude multi-artist compilations
              const isCompilation = 
                articleArtist.includes('diverse') ||
                articleArtist.includes('various') ||
                articleArtist.includes('&') ||
                articleArtist.includes(',');
              
              if (isCompilation) {
                console.log(`[RelatedArticles] Filtered out compilation: "${frontmatter.artist}"`);
              }
              return !isCompilation;
            });

            articles = [...articles, ...genreArticles].slice(0, maxResults);
          }
        }

        console.log(`[RelatedArticles] Final result: ${articles.length} articles`);
        setRelatedArticles(articles);
      } catch (error) {
        console.error('[RelatedArticles] Error:', error);
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
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img 
                        src={article.album_cover_url || "/placeholder.svg"} 
                        alt={`Album cover van ${frontmatter.album || ''} door ${frontmatter.artist || ''}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    
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