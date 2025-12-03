import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { GenreData } from '@/hooks/useYearOverview';

interface GenreTrendsSectionProps {
  narrative: string;
  risingGenres?: (string | GenreData)[];
  popularGenres: GenreData[];
  decliningGenres?: string[];
  fusionTrends?: string[];
}

export const GenreTrendsSection: React.FC<GenreTrendsSectionProps> = ({ 
  narrative, 
  risingGenres,
  popularGenres,
  decliningGenres,
  fusionTrends
}) => {
  if (!narrative && (!popularGenres || popularGenres.length === 0)) return null;

  const maxCount = Math.max(...(popularGenres || []).map(g => g.count || g.percentage || 0));

  const getRisingGenreDisplay = (genre: string | GenreData): string => {
    if (typeof genre === 'string') return genre;
    return `${genre.genre}${genre.growth_percentage ? ` (+${genre.growth_percentage}%)` : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          📈 Genre Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {narrative && (
          <p className="text-muted-foreground">{narrative}</p>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Popular Genres Chart */}
          {popularGenres && popularGenres.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                🎵 Populaire Genres
              </h3>
              <div className="space-y-2">
                {popularGenres.slice(0, 8).map((genre, index) => {
                  const value = genre.count || genre.percentage || 0;
                  const width = maxCount > 0 ? (value / maxCount) * 100 : 0;
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center gap-3">
                        <div className="w-24 text-sm truncate">{genre.genre}</div>
                        <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-muted-foreground text-right">
                          {genre.percentage ? `${genre.percentage}%` : value}
                        </div>
                      </div>
                      {genre.top_songs && genre.top_songs.length > 0 && (
                        <div className="ml-24 pl-3 text-xs text-muted-foreground mt-1">
                          Top: {genre.top_songs.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Rising Genres */}
            {risingGenres && risingGenres.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Opkomende Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {risingGenres.map((genre, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 text-sm bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1"
                    >
                      <TrendingUp className="h-3 w-3" />
                      {getRisingGenreDisplay(genre)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Declining Genres */}
            {decliningGenres && decliningGenres.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Dalende Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {decliningGenres.map((genre, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 text-sm bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center gap-1"
                    >
                      <TrendingDown className="h-3 w-3" />
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fusion Trends */}
            {fusionTrends && fusionTrends.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  🔀 Genre Fusies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {fusionTrends.map((trend, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 text-sm bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full"
                    >
                      {trend}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
