import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';
import { GenreData } from '@/hooks/useYearOverview';

interface GenreTrendsSectionProps {
  narrative: string;
  risingGenres?: string[];
  popularGenres: GenreData[];
}

export const GenreTrendsSection: React.FC<GenreTrendsSectionProps> = ({ 
  narrative, 
  risingGenres,
  popularGenres 
}) => {
  if (!narrative && (!popularGenres || popularGenres.length === 0)) return null;

  // Calculate max for percentage bar width
  const maxCount = Math.max(...(popularGenres || []).map(g => g.count || g.percentage || 0));

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
                    <div key={index} className="flex items-center gap-3">
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
                  );
                })}
              </div>
            </div>
          )}
          
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
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
