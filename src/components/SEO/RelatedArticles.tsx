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

  // Normalize artist names for better matching
  const normalizeArtist = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/^the\s+/i, '') // Remove "The" prefix
      .replace(/\s+(group|band|orchestra|ensemble)$/i, ''); // Remove suffixes
  };

  // Build multiple search terms from artist name for fuzzy matching
  const buildSearchTerms = (artistName?: string): string[] => {
    if (!artistName) return [];
    
    const normalized = normalizeArtist(artistName);
    const terms = new Set<string>();
    
    // Add original artist name
    terms.add(artistName);
    
    // Add normalized version if different
    if (normalized && normalized !== artistName.toLowerCase()) {
      terms.add(normalized);
    }
    
    // Filter and validate terms
    return Array.from(terms)
      .map(s => s.trim())
      .filter(s => s.length >= 3);
  };

  // Check if two artist names are related (variations of same artist)
  const isRelatedArtist = (articleArtist: string, targetArtist: string) => {
    const normalizedArticle = normalizeArtist(articleArtist);
    const normalizedTarget = normalizeArtist(targetArtist);
    
    // Exact match after normalization
    if (normalizedArticle === normalizedTarget) return true;
    
    // Check if one contains the other (e.g., "patti smith" in "patti smith group")
    if (normalizedArticle.includes(normalizedTarget) || 
        normalizedTarget.includes(normalizedArticle)) {
      // But exclude if it's a different artist that happens to contain the name
      const words = normalizedTarget.split(' ');
      const firstWord = words[0];
      
      // If searching for multi-word artist, need substantial overlap
      if (words.length > 1) {
        return normalizedArticle.includes(normalizedTarget) || 
               normalizedTarget.includes(normalizedArticle);
      }
      
      // For single word, must be at start or full match
      return normalizedArticle === firstWord || 
             normalizedArticle.startsWith(firstWord + ' ');
    }
    
    return false;
  };

  // Check if artist name indicates compilation/multi-artist
  const isCompilation = (artistName: string) => {
    const lower = artistName.toLowerCase();
    return lower.includes('various') ||
           lower.includes('diverse') ||
           lower.includes('&') ||
           lower.includes(' and ') ||
           lower.includes('feat.') ||
           lower.includes('vs') ||
           lower.includes('tribute') ||
           artistName.includes(',');
  };

  React.useEffect(() => {
    const fetchRelatedArticles = async () => {
      if (!genre && !artist) return;
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        setLoading(true);
        console.log(`[RelatedArticles] Fetching related articles for:`, { currentSlug, artist, genre });

        let articles: any[] = [];

        // Strategy 1: Try fuzzy artist match first with multiple search terms
        if (artist) {
          const searchTerms = buildSearchTerms(artist);
          console.log(`[RelatedArticles] Artist: "${artist}"`);
          console.log(`[RelatedArticles] Search terms:`, searchTerms);
          
          if (searchTerms.length > 0) {
            // Build OR filter with wildcards for all search terms
            const orFilter = searchTerms
              .map(term => `yaml_frontmatter->>artist.ilike.%${term}%`)
              .join(',');
            
            console.log(`[RelatedArticles] OR filter: ${orFilter}`);
            
            const { data: artistMatches, error: artistError } = await supabase
              .from('blog_posts')
              .select('id, slug, yaml_frontmatter, views_count, published_at, album_cover_url')
              .eq('is_published', true)
              .neq('slug', currentSlug)
              .or(orFilter)
              .order('views_count', { ascending: false })
              .limit(maxResults * 5); // Get more to filter

            console.log(`[RelatedArticles] Raw artistMatches:`, artistMatches?.length);

            if (artistError) {
              console.error('[RelatedArticles] Error fetching by artist:', artistError);
            } else if (artistMatches && artistMatches.length > 0) {
              
              // Client-side smart filtering
              const validMatches = artistMatches.filter(article => {
                const frontmatter = article.yaml_frontmatter as any || {};
                const articleArtist = String(frontmatter.artist || '');
                if (!articleArtist) return false;
                
                // Skip compilations
                if (isCompilation(articleArtist)) {
                  console.log(`[RelatedArticles] Filtered out compilation: "${articleArtist}"`);
                  return false;
                }
                
                // Check if artists are related
                const isMatch = isRelatedArtist(articleArtist, artist);
                
                if (!isMatch) {
                  console.log(`[RelatedArticles] Filtered out: "${articleArtist}" (not related to "${artist}")`);
                } else {
                  console.log(`[RelatedArticles] Valid match: "${articleArtist}" matches "${artist}"`);
                }
                
                return isMatch;
              }).slice(0, maxResults);
              
              articles = validMatches;
              console.log(`[RelatedArticles] Valid matches after filtering: ${articles.length}`);
            }
          }
        }

        // Strategy 2: If no artist matches, try genre-based matching
        if (articles.length === 0 && genre) {
          console.log(`[RelatedArticles] No artist matches, trying genre match for: ${genre}`);
          
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
          } else if (genreData && genreData.length > 0) {
            console.log(`[RelatedArticles] Found ${genreData.length} genre matches, filtering compilations`);
            
            // Filter out compilations
            const filteredByGenre = genreData.filter(article => {
              const frontmatter = article.yaml_frontmatter as any || {};
              const articleArtist = String(frontmatter.artist || '');
              if (!articleArtist) return false;
              
              if (isCompilation(articleArtist)) {
                console.log(`[RelatedArticles] Filtered out compilation: "${articleArtist}"`);
                return false;
              }
              
              return true;
            }).slice(0, maxResults);
            
            articles = filteredByGenre;
            console.log(`[RelatedArticles] After compilation filtering: ${articles.length} matches`);
          }
        }

        console.log(`[RelatedArticles] Final result: ${articles.length} related articles`);
        setRelatedArticles(articles);
      } catch (error) {
        console.error('[RelatedArticles] Unexpected error:', error);
        setRelatedArticles([]);
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