import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Heart, Star, TrendingUp, Clock, Palette } from 'lucide-react';

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
  
  const personality = useMemo(() => {
    if (!genres.length) return null;

    // Calculate personality traits based on collection
    const totalGenreItems = genres.reduce((sum, g) => sum + g.count, 0);
    const diversityScore = genres.length / Math.max(totalItems, 1) * 100;
    const averageAlbumsPerGenre = totalGenreItems / genres.length;
    
    // Determine dominant traits
    const traits = [];
    const primaryGenre = genres[0];
    const genrePercentage = (primaryGenre?.count || 0) / totalItems * 100;

    // Genre-based personality
    if (genrePercentage > 50) {
      traits.push({
        trait: `${primaryGenre.genre} Specialist`,
        description: `Je bent een echte ${primaryGenre.genre.toLowerCase()} liefhebber`,
        strength: Math.min(genrePercentage, 100),
        icon: Heart,
        color: 'text-red-500'
      });
    } else if (diversityScore > 15) {
      traits.push({
        trait: 'Muzikale Ontdekkingsreiziger',
        description: 'Je houdt van diverse muziekstijlen',
        strength: Math.min(diversityScore * 5, 100),
        icon: Palette,
        color: 'text-purple-500'
      });
    } else {
      traits.push({
        trait: 'Gebalanceerde Verzamelaar',
        description: 'Je hebt een evenwichtige smaak',
        strength: 75,
        icon: Star,
        color: 'text-yellow-500'
      });
    }

    // Value-based traits
    const averageValue = totalValue / Math.max(totalItems, 1);
    if (averageValue > 50) {
      traits.push({
        trait: 'Kwaliteit Zoeker',
        description: 'Je kiest voor waardevolle albums',
        strength: Math.min((averageValue / 100) * 100, 100),
        icon: TrendingUp,
        color: 'text-green-500'
      });
    } else if (averageValue > 20) {
      traits.push({
        trait: 'Slimme Koper',
        description: 'Je vindt goede deals',
        strength: 70,
        icon: Brain,
        color: 'text-blue-500'
      });
    }

    // Era-based traits
    if (averageYear) {
      const currentYear = new Date().getFullYear();
      const agePreference = currentYear - averageYear;
      
      if (agePreference > 40) {
        traits.push({
          trait: 'Vintage Liefhebber',
          description: 'Je prefereert klassieke albums',
          strength: Math.min((agePreference / 50) * 100, 100),
          icon: Clock,
          color: 'text-amber-500'
        });
      } else if (agePreference < 15) {
        traits.push({
          trait: 'Moderne Verzamelaar',
          description: 'Je houdt van recente releases',
          strength: 80,
          icon: TrendingUp,
          color: 'text-cyan-500'
        });
      }
    }

    // Collection size traits
    if (totalItems > 100) {
      traits.push({
        trait: 'Toegewijde Verzamelaar',
        description: 'Je hebt een indrukwekkende collectie',
        strength: Math.min((totalItems / 500) * 100, 100),
        icon: Star,
        color: 'text-violet-500'
      });
    }

    return {
      traits: traits.slice(0, 3), // Keep top 3 traits
      diversityScore,
      dominantGenre: primaryGenre?.genre || 'Onbekend',
      averageValue,
      personalityType: getPersonalityType(traits, diversityScore, averageValue)
    };
  }, [genres, totalItems, totalValue, averageYear]);

  const getPersonalityType = (traits: any[], diversityScore: number, averageValue: number) => {
    if (diversityScore > 15) return 'De Ontdekker';
    if (averageValue > 50) return 'De Kenner';
    if (traits.some(t => t.trait.includes('Specialist'))) return 'De Specialist';
    return 'De Verzamelaar';
  };

  const getPersonalityDescription = (type: string) => {
    switch (type) {
      case 'De Ontdekker':
        return 'Je hebt een brede muzikale smaak en bent altijd op zoek naar nieuwe genres en artiesten.';
      case 'De Kenner':
        return 'Je weet kwaliteit te herkennen en investeert in waardevolle, bijzondere albums.';
      case 'De Specialist':
        return 'Je hebt een diepe passie voor specifieke genres en kent alle ins en outs.';
      default:
        return 'Je bouwt gestaag aan een mooie, gevarieerde collectie met oog voor detail.';
    }
  };

  if (!personality) {
    return (
      <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-vinyl-purple" />
            🧠 Je Collectie Persoonlijkheid
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Voeg meer albums toe om je unieke collectie persoonlijkheid te ontdekken!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 bg-gradient-to-br from-background via-accent/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-vinyl-purple" />
          🧠 Je Collectie Persoonlijkheid
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personality Type */}
        <div className="text-center space-y-2">
          <Badge className="bg-gradient-to-r from-vinyl-purple to-vinyl-gold text-white text-lg px-4 py-2">
            {personality.personalityType}
          </Badge>
          <p className="text-sm text-muted-foreground italic">
            {getPersonalityDescription(personality.personalityType)}
          </p>
        </div>

        {/* Personality Traits */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground">
            ✨ Jouw Kenmerken
          </h4>
          {personality.traits.map((trait, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <trait.icon className={`w-4 h-4 ${trait.color}`} />
                  <span className="font-medium text-sm">{trait.trait}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(trait.strength)}%
                </span>
              </div>
              <Progress value={trait.strength} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {trait.description}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-accent/20">
          <div className="text-center">
            <div className="text-lg font-bold text-vinyl-purple">
              {Math.round(personality.diversityScore)}%
            </div>
            <div className="text-xs text-muted-foreground">Diversiteit</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-vinyl-gold">
              {personality.dominantGenre}
            </div>
            <div className="text-xs text-muted-foreground">Top Genre</div>
          </div>
        </div>

        {/* Fun Insight */}
        <div className="bg-accent/10 rounded-lg p-3 text-center">
          <p className="text-sm">
            🎵 <span className="font-medium">Fun fact:</span> Je collectie heeft een 
            <span className="text-vinyl-purple font-medium"> 
              {personality.diversityScore > 15 ? ' zeer diverse' : ' gefocuste'}
            </span> persoonlijkheid!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};