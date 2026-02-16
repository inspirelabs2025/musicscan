import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { useCollectionAIAnalysis } from '@/hooks/useCollectionAIAnalysis';
import { useCollectionStats } from '@/hooks/useCollectionStats';
import { useLanguage } from '@/contexts/LanguageContext';

export const AIInsightsWidget = () => {
  const { data: aiData, isLoading: aiLoading } = useCollectionAIAnalysis();
  const { data: stats, isLoading: statsLoading } = useCollectionStats();
  const { tr } = useLanguage();
  const d = tr.dashboardUI;

  if (aiLoading || statsLoading) {
    return (
      <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300">
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-vinyl-purple" />
          {d.musicInsights}
        </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const topGenre = stats?.genres?.[0];
  const topArtist = stats?.artists?.[0];
  const totalItems = stats?.totalItems || 0;
  const uniqueGenres = stats?.genres?.length || 0;
  const uniqueArtists = stats?.artists?.length || 0;
  
  let timeSpan = 0;
  if (stats?.years && stats.years.length > 0) {
    const years = stats.years.map(y => y.year).filter(y => y > 0);
    if (years.length > 0) {
      timeSpan = Math.max(...years) - Math.min(...years);
    }
  }

  return (
    <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-vinyl-purple animate-pulse" />
          {d.musicInsights}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-vinyl-purple/10 rounded-lg">
            <div className="text-2xl font-bold text-vinyl-purple">{uniqueGenres}</div>
            <div className="text-xs text-muted-foreground">{d.genresDiscovered}</div>
          </div>
          <div className="text-center p-3 bg-vinyl-gold/10 rounded-lg">
            <div className="text-2xl font-bold text-vinyl-gold">{uniqueArtists}</div>
            <div className="text-xs text-muted-foreground">{d.artists}</div>
          </div>
        </div>

        {totalItems > 0 && (
          <div className="space-y-2">
            {topGenre && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-vinyl-purple">🎨</span>
                <span>{d.topGenreLabel} <strong>{topGenre.genre}</strong> ({topGenre.count} {d.albumsCount})</span>
              </div>
            )}
            {topArtist && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-vinyl-gold">🎤</span>
                <span>{d.topArtistLabel} <strong>{topArtist.artist}</strong> ({topArtist.count} {d.albumsCount})</span>
              </div>
            )}
            {timeSpan && timeSpan > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-accent">⏰</span>
                <span>{d.timeSpanLabel} <strong>{timeSpan} {d.yearsOfMusicHistory}</strong></span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1 bg-gradient-to-r from-vinyl-purple to-vinyl-purple/80">
            <Link to="/collection-overview?tab=dna">
              <Sparkles className="w-4 h-4 mr-2" />
              {d.musicDNA}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1 hover:bg-vinyl-gold/10">
            <Link to="/quiz">
              <Trophy className="w-4 h-4 mr-2" />
              {d.quizStart}
            </Link>
          </Button>
        </div>

        {totalItems === 0 && (
          <div className="text-center py-4">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">
              {d.addAlbumsForInsights}
            </p>
            <Button asChild size="sm">
              <Link to="/scanner">
                <ArrowRight className="w-4 h-4 mr-2" />
                {d.startScanningShort}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
