import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserCollectionStats } from "@/hooks/useUserCollectionStats";
import { Brain, Music, Calendar, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PersonalityInsightsProps {
  userId: string;
}

export const PersonalityInsights: React.FC<PersonalityInsightsProps> = ({ userId }) => {
  const { tr } = useLanguage();
  const p = tr.profile;
  const { data: stats, isLoading } = useUserCollectionStats(userId);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalItems === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {p.musicDNA}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {p.notEnoughData}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCollectionPersonality = () => {
    const cdPercentage = (stats.totalCDs / stats.totalItems) * 100;
    const vinylPercentage = (stats.totalVinyls / stats.totalItems) * 100;
    
    const topGenre = Object.entries(stats.genreCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || "Diverse";

    const ageSpan = (stats.newestYear || 2024) - (stats.oldestYear || 1970);
    
    if (vinylPercentage > 70) {
      return {
        type: p.vinylPurist,
        description: p.vinylPuristDesc.replace('{pct}', String(Math.round(vinylPercentage))),
        mood: p.analogSoul
      };
    } else if (cdPercentage > 70) {
      return {
        type: p.cdEnthusiast,
        description: p.cdEnthusiastDesc.replace('{pct}', String(Math.round(cdPercentage))),
        mood: p.digitalPioneer
      };
    } else if (ageSpan > 40) {
      return {
        type: p.timeTraveler,
        description: p.timeTravelerDesc.replace('{from}', String(stats.oldestYear)).replace('{to}', String(stats.newestYear)),
        mood: p.crossGenerational
      };
    } else {
      return {
        type: p.specialist.replace('{genre}', topGenre),
        description: p.specialistDesc.replace('{genre}', topGenre.toLowerCase()),
        mood: p.genreExpert
      };
    }
  };

  const personality = getCollectionPersonality();

  const decadeStats = Object.entries(stats.decadeAnalysis || {})
    .sort(([,a], [,b]) => (b as any).count - (a as any).count)
    .slice(0, 4);

  const formatPercentage = (count: number) => {
    return Math.round((count / stats.totalItems) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          {p.musicDNA}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" className="text-sm">
              {personality.type}
            </Badge>
            <span className="text-lg">{personality.mood}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {personality.description}
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Music className="h-4 w-4" />
            {p.formatPreference}
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Vinyl</span>
                <span>{Math.round((stats.totalVinyls / stats.totalItems) * 100)}%</span>
              </div>
              <Progress 
                value={(stats.totalVinyls / stats.totalItems) * 100} 
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CD</span>
                <span>{Math.round((stats.totalCDs / stats.totalItems) * 100)}%</span>
              </div>
              <Progress 
                value={(stats.totalCDs / stats.totalItems) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {decadeStats.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {p.eraPreference}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {decadeStats.map(([decade, data]) => (
                <div key={decade} className="text-center p-2 rounded-lg bg-muted/30">
                  <div className="font-medium text-sm">{decade}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercentage((data as any).count)}% ({(data as any).count})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {p.expertiseAreas}
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.genreCounts)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 4)
              .map(([genre, count]) => (
                <Badge key={genre} variant="outline" className="text-xs">
                  {genre} ({formatPercentage(count as number)}%)
                </Badge>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
