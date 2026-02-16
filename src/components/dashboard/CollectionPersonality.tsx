import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Heart, Star, TrendingUp, Clock, Palette } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Genre {
  genre: string;
  count: number;
}

interface CollectionPersonalityProps {
  genres: Genre[];
  totalItems: number;
  totalValue: number;
  averageYear?: number;
}

export const CollectionPersonality = ({ 
  genres = [], 
  totalItems = 0, 
  totalValue = 0,
  averageYear 
}: CollectionPersonalityProps) => {
  const { tr } = useLanguage();
  const d = tr.dashboardUI;
  
  const getPersonalityType = (traits: any[], diversityScore: number, averageValue: number) => {
    if (diversityScore > 15) return d.theExplorer;
    if (averageValue > 50) return d.theExpert;
    if (traits.some(t => t.trait.includes(d.specialist))) return d.theSpecialist;
    return d.theCollector;
  };

  const personality = useMemo(() => {
    if (!genres.length) return null;

    const totalGenreItems = genres.reduce((sum, g) => sum + g.count, 0);
    const diversityScore = genres.length / Math.max(totalItems, 1) * 100;
    
    const traits = [];
    const primaryGenre = genres[0];
    const genrePercentage = (primaryGenre?.count || 0) / totalItems * 100;

    if (genrePercentage > 50) {
      traits.push({
        trait: `${primaryGenre.genre} ${d.specialist}`,
        description: d.trueLovers.replace('{genre}', primaryGenre.genre.toLowerCase()),
        strength: Math.min(genrePercentage, 100),
        icon: Heart,
        color: 'text-red-500'
      });
    } else if (diversityScore > 15) {
      traits.push({
        trait: d.musicalExplorer,
        description: d.diverseStyles,
        strength: Math.min(diversityScore * 5, 100),
        icon: Palette,
        color: 'text-purple-500'
      });
    } else {
      traits.push({
        trait: d.balancedCollector,
        description: d.balancedTaste,
        strength: 75,
        icon: Star,
        color: 'text-yellow-500'
      });
    }

    const averageValue = totalValue / Math.max(totalItems, 1);
    if (averageValue > 50) {
      traits.push({
        trait: d.qualitySeeker,
        description: d.valuableAlbums,
        strength: Math.min((averageValue / 100) * 100, 100),
        icon: TrendingUp,
        color: 'text-green-500'
      });
    } else if (averageValue > 20) {
      traits.push({
        trait: d.smartBuyer,
        description: d.goodDeals,
        strength: 70,
        icon: Brain,
        color: 'text-blue-500'
      });
    }

    if (averageYear) {
      const currentYear = new Date().getFullYear();
      const agePreference = currentYear - averageYear;
      
      if (agePreference > 40) {
        traits.push({
          trait: d.vintageLover,
          description: d.classicAlbums,
          strength: Math.min((agePreference / 50) * 100, 100),
          icon: Clock,
          color: 'text-amber-500'
        });
      } else if (agePreference < 15) {
        traits.push({
          trait: d.modernCollector,
          description: d.recentReleases,
          strength: 80,
          icon: TrendingUp,
          color: 'text-cyan-500'
        });
      }
    }

    if (totalItems > 100) {
      traits.push({
        trait: d.dedicatedCollector,
        description: d.impressiveCollection,
        strength: Math.min((totalItems / 500) * 100, 100),
        icon: Star,
        color: 'text-violet-500'
      });
    }

    return {
      traits: traits.slice(0, 3),
      diversityScore,
      dominantGenre: primaryGenre?.genre || d.unknown,
      averageValue,
      personalityType: getPersonalityType(traits, diversityScore, averageValue)
    };
  }, [genres, totalItems, totalValue, averageYear, d]);


  const getPersonalityDescription = (type: string) => {
    if (type === d.theExplorer) return d.explorerDesc;
    if (type === d.theExpert) return d.expertDesc;
    if (type === d.theSpecialist) return d.specialistDesc;
    return d.collectorDesc;
  };

  if (!personality) {
    return (
      <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-vinyl-purple" />
            🧠 {d.collectionPersonality}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{d.addMoreAlbums}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 bg-gradient-to-br from-background via-accent/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-vinyl-purple" />
          🧠 {d.collectionPersonality}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <Badge className="bg-gradient-to-r from-vinyl-purple to-vinyl-gold text-white text-lg px-4 py-2">
            {personality.personalityType}
          </Badge>
          <p className="text-sm text-muted-foreground italic">
            {getPersonalityDescription(personality.personalityType)}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground">✨ {d.yourTraits}</h4>
          {personality.traits.map((trait, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <trait.icon className={`w-4 h-4 ${trait.color}`} />
                  <span className="font-medium text-sm">{trait.trait}</span>
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(trait.strength)}%</span>
              </div>
              <Progress value={trait.strength} className="h-2" />
              <p className="text-xs text-muted-foreground">{trait.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-accent/20">
          <div className="text-center">
            <div className="text-lg font-bold text-vinyl-purple">{Math.round(personality.diversityScore)}%</div>
            <div className="text-xs text-muted-foreground">{d.diversity}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-vinyl-gold">{personality.dominantGenre}</div>
            <div className="text-xs text-muted-foreground">{d.topGenre}</div>
          </div>
        </div>

        <div className="bg-accent/10 rounded-lg p-3 text-center">
          <p className="text-sm">
            🎵 <span className="font-medium">{d.funFactLabel}</span> {d.personalityText.replace('{type}', personality.diversityScore > 15 ? d.veryDiverse : d.focused)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};