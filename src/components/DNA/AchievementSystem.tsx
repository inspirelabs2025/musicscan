
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Target, Globe, Music, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AchievementSystemProps {
  stats: any;
  analysis: any;
  unlockedAchievements: string[];
  onAchievementUnlock: (achievement: string) => void;
}

export function AchievementSystem({ 
  stats, 
  analysis, 
  unlockedAchievements, 
  onAchievementUnlock 
}: AchievementSystemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [achievements] = useState([
    {
      id: 'first_collection',
      title: 'Collector Initiate',
      description: 'Your first 10 albums',
      condition: () => stats.totalItems >= 10,
      icon: Music,
      rarity: 'common'
    },
    {
      id: 'genre_explorer',
      title: 'Genre Explorer',
      description: '5+ different genres',
      condition: () => stats.genres?.length >= 5,
      icon: Globe,
      rarity: 'common'
    },
    {
      id: 'diverse_collector',
      title: 'Musical Diversity',
      description: '10+ different genres',
      condition: () => stats.genres?.length >= 10,
      icon: Target,
      rarity: 'rare'
    },
    {
      id: 'artist_lover',
      title: 'Artist Devotee',
      description: '5+ albums from same artist',
      condition: () => stats.topArtists?.[0]?.albums >= 5,
      icon: Users,
      rarity: 'uncommon'
    },
    {
      id: 'vintage_collector',
      title: 'Vintage Hunter',
      description: 'Album from before 1980',
      condition: () => stats.years?.some((year: number) => year < 1980),
      icon: Star,
      rarity: 'rare'
    },
    {
      id: 'completionist',
      title: 'The Completionist',
      description: '100+ albums in collection',
      condition: () => stats.totalItems >= 100,
      icon: Trophy,
      rarity: 'legendary'
    }
  ]);

  useEffect(() => {
    achievements.forEach(achievement => {
      if (!unlockedAchievements.includes(achievement.id) && achievement.condition()) {
        onAchievementUnlock(achievement.title);
      }
    });
  }, [stats, achievements, unlockedAchievements, onAchievementUnlock]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/20 text-gray-200 border-gray-500/30';
      case 'uncommon': return 'bg-green-500/20 text-green-200 border-green-500/30';
      case 'rare': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
      case 'legendary': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
      default: return 'bg-white/20 text-white border-white/30';
    }
  };

  const unlockedCount = achievements.filter(a => a.condition()).length;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`bg-white/10 backdrop-blur-lg border-white/20 transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-auto'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Achievements
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30 text-xs">
                {unlockedCount}/{achievements.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
              >
                {isExpanded ? <X className="h-4 w-4" /> : <Target className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {achievements.map(achievement => {
                const isUnlocked = achievement.condition();
                const Icon = achievement.icon;
                
                return (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isUnlocked 
                        ? 'bg-white/10 border border-white/20 shadow-sm' 
                        : 'bg-white/5 opacity-50 border border-white/10'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                      <Icon className={`h-5 w-5 ${isUnlocked ? 'text-yellow-400' : 'text-white/40'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${isUnlocked ? 'text-white' : 'text-white/60'}`}>
                          {achievement.title}
                        </h4>
                        <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p className={`text-xs ${isUnlocked ? 'text-white/70' : 'text-white/40'}`}>
                        {achievement.description}
                      </p>
                    </div>
                    {isUnlocked && (
                      <div className="text-green-400 text-lg">✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
