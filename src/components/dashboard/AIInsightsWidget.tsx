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
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          {d.musicInsights}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">{uniqueGenres}</div>
            <div className="text-[11px] text-muted-foreground">{d.genresDiscovered}</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-foreground">{uniqueArtists}</div>
            <div className="text-[11px] text-muted-foreground">{d.artists}</div>
          </div>
        </div>

        {totalItems > 0 && (
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {topGenre && <p>🎨 {d.topGenreLabel} <strong className="text-foreground">{topGenre.genre}</strong> ({topGenre.count})</p>}
            {topArtist && <p>🎤 {d.topArtistLabel} <strong className="text-foreground">{topArtist.artist}</strong> ({topArtist.count})</p>}
            {timeSpan > 0 && <p>⏰ <strong className="text-foreground">{timeSpan}</strong> {d.yearsOfMusicHistory}</p>}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" className="flex-1">
            <Link to="/collection-overview?tab=dna">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {d.musicDNA}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to="/quiz">
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              {d.quizStart}
            </Link>
          </Button>
        </div>

        {totalItems === 0 && (
          <div className="text-center py-4">
            <Brain className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">{d.addAlbumsForInsights}</p>
            <Button asChild size="sm">
              <Link to="/scanner"><ArrowRight className="w-3.5 h-3.5 mr-1.5" />{d.startScanningShort}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
