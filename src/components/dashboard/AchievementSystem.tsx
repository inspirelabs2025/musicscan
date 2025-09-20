import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Zap, Crown, Target, Music, Disc, Camera, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (stats: any) => boolean;
  points: number;
}

interface AchievementSystemProps {
  collectionStats: any;
  scanStats: any;
  unlockedAchievements?: string[];
  onAchievementUnlock?: (achievementId: string) => void;
}

export const AchievementSystem = ({ 
  collectionStats, 
  scanStats, 
  unlockedAchievements = [],
  onAchievementUnlock 
}: AchievementSystemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  const achievements: Achievement[] = [
    {
      id: 'first_album',
      title: 'Eerste Album',
      description: 'Je eerste album toegevoegd aan de collectie',
      icon: Music,
      rarity: 'common',
      condition: (stats) => (stats?.totalItems || 0) >= 1,
      points: 10
    },
    {
      id: 'collector_novice',
      title: 'Verzamelaar Novice',
      description: '10 albums in je collectie',
      icon: Disc,
      rarity: 'common',
      condition: (stats) => (stats?.totalItems || 0) >= 10,
      points: 25
    },
    {
      id: 'collector_enthusiast',
      title: 'Muziek Enthousiasteling',
      description: '50 albums verzameld',
      icon: Star,
      rarity: 'rare',
      condition: (stats) => (stats?.totalItems || 0) >= 50,
      points: 100
    },
    {
      id: 'collector_expert',
      title: 'Collectie Expert',
      description: '100 albums in je bezit',
      icon: Trophy,
      rarity: 'epic',
      condition: (stats) => (stats?.totalItems || 0) >= 100,
      points: 250
    },
    {
      id: 'collector_master',
      title: 'Verzamel Meester',
      description: '500 albums verzameld',
      icon: Crown,
      rarity: 'legendary',
      condition: (stats) => (stats?.totalItems || 0) >= 500,
      points: 1000
    },
    {
      id: 'scanner_streak',
      title: 'Scan Specialist',
      description: '20 succesvolle scans',
      icon: Camera,
      rarity: 'rare',
      condition: (stats) => (stats?.totalScans || 0) >= 20,
      points: 75
    },
    {
      id: 'valuable_collection',
      title: 'Waardevolle Collectie',
      description: 'Collectie ter waarde van €1000+',
      icon: Target,
      rarity: 'epic',
      condition: (stats) => (stats?.totalValue || 0) >= 1000,
      points: 300
    },
    {
      id: 'chat_explorer',
      title: 'Collectie Ontdekker',
      description: 'Chat feature gebruikt',
      icon: MessageSquare,
      rarity: 'common',
      condition: () => true, // This would be tracked separately
      points: 15
    }
  ];

  // Check for newly unlocked achievements
  useEffect(() => {
    if (!collectionStats) return;

    const currentlyUnlocked = achievements.filter(achievement => 
      achievement.condition({ ...collectionStats, ...scanStats })
    ).map(a => a.id);

    const newUnlocks = currentlyUnlocked.filter(id => 
      !unlockedAchievements.includes(id) && !newlyUnlocked.includes(id)
    );

    if (newUnlocks.length > 0) {
      setNewlyUnlocked(prev => [...prev, ...newUnlocks]);
      newUnlocks.forEach(id => {
        onAchievementUnlock?.(id);
      });
      
      // Auto-expand to show new achievements
      setIsExpanded(true);
      
      // Clear newly unlocked after 5 seconds
      setTimeout(() => {
        setNewlyUnlocked([]);
      }, 5000);
    }
  }, [collectionStats, scanStats, unlockedAchievements, newlyUnlocked, onAchievementUnlock]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'shadow-yellow-200/50 shadow-lg';
      case 'epic': return 'shadow-purple-200/50 shadow-md';
      case 'rare': return 'shadow-blue-200/50 shadow-sm';
      default: return '';
    }
  };

  const totalUnlocked = achievements.filter(achievement => 
    unlockedAchievements.includes(achievement.id) || 
    achievement.condition({ ...collectionStats, ...scanStats })
  ).length;

  const totalPoints = achievements
    .filter(achievement => 
      unlockedAchievements.includes(achievement.id) || 
      achievement.condition({ ...collectionStats, ...scanStats })
    )
    .reduce((sum, achievement) => sum + achievement.points, 0);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4"
          >
            <Card className="w-80 max-h-96 overflow-y-auto">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="w-5 h-5 text-vinyl-gold" />
                  🏆 Prestaties
                  <Badge variant="secondary" className="ml-auto">
                    {totalPoints} punten
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.map((achievement) => {
                  const isUnlocked = unlockedAchievements.includes(achievement.id) || 
                    achievement.condition({ ...collectionStats, ...scanStats });
                  const isNew = newlyUnlocked.includes(achievement.id);
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={isNew ? { scale: 0.8, opacity: 0 } : false}
                      animate={isNew ? { scale: 1, opacity: 1 } : false}
                      className={`p-3 rounded-lg border transition-all ${
                        isUnlocked 
                          ? `bg-accent/10 border-accent/30 ${getRarityGlow(achievement.rarity)}` 
                          : 'bg-muted/30 border-muted opacity-60'
                      } ${isNew ? 'ring-2 ring-vinyl-gold animate-pulse' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          isUnlocked ? 'bg-accent/20' : 'bg-muted/50'
                        }`}>
                          <achievement.icon className={`w-4 h-4 ${
                            isUnlocked ? 'text-accent' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium text-sm ${
                              isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {achievement.title}
                            </h4>
                            {isUnlocked && (
                              <div className="text-vinyl-gold">✨</div>
                            )}
                            {isNew && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                NEW!
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getRarityColor(achievement.rarity)}`}
                            >
                              {achievement.rarity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {achievement.points} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="rounded-full w-16 h-16 bg-gradient-to-r from-vinyl-purple to-vinyl-gold hover:shadow-lg relative"
      >
        <div className="flex flex-col items-center">
          <Trophy className="w-6 h-6" />
          <span className="text-xs font-bold">{totalUnlocked}/{achievements.length}</span>
        </div>
        {newlyUnlocked.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{newlyUnlocked.length}</span>
          </div>
        )}
      </Button>
    </div>
  );
};