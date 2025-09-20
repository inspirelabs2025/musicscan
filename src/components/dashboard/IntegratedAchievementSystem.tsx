import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Zap, Crown, Target, Music, Disc, Camera, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (stats: any) => boolean;
  points: number;
  progressCondition?: (stats: any) => { current: number; target: number };
}

interface AchievementSystemProps {
  collectionStats: any;
  scanStats: any;
  unlockedAchievements?: string[];
  onAchievementUnlock?: (achievementId: string) => void;
}

export const IntegratedAchievementSystem = ({ 
  collectionStats, 
  scanStats, 
  unlockedAchievements = [],
  onAchievementUnlock 
}: AchievementSystemProps) => {
  const [expandedAchievement, setExpandedAchievement] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const previousUnlockedRef = useRef<string[]>(unlockedAchievements);
  const lastNotificationRef = useRef<number>(0);
  const NOTIFICATION_COOLDOWN = 5000; // 5 seconds

  const achievements: Achievement[] = [
    {
      id: 'first_album',
      title: 'Eerste Album',
      description: 'Je eerste album toegevoegd aan de collectie',
      icon: Music,
      rarity: 'common',
      condition: (stats) => (stats?.totalItems || 0) >= 1,
      points: 10,
      progressCondition: (stats) => ({ current: stats?.totalItems || 0, target: 1 })
    },
    {
      id: 'collector_novice',
      title: 'Verzamelaar Novice',
      description: '10 albums in je collectie',
      icon: Disc,
      rarity: 'common',
      condition: (stats) => (stats?.totalItems || 0) >= 10,
      points: 25,
      progressCondition: (stats) => ({ current: stats?.totalItems || 0, target: 10 })
    },
    {
      id: 'collector_enthusiast',
      title: 'Muziek Enthousiasteling',
      description: '50 albums verzameld',
      icon: Star,
      rarity: 'rare',
      condition: (stats) => (stats?.totalItems || 0) >= 50,
      points: 100,
      progressCondition: (stats) => ({ current: stats?.totalItems || 0, target: 50 })
    },
    {
      id: 'collector_expert',
      title: 'Collectie Expert',
      description: '100 albums in je bezit',
      icon: Trophy,
      rarity: 'epic',
      condition: (stats) => (stats?.totalItems || 0) >= 100,
      points: 250,
      progressCondition: (stats) => ({ current: stats?.totalItems || 0, target: 100 })
    },
    {
      id: 'collector_master',
      title: 'Verzamel Meester',
      description: '500 albums verzameld',
      icon: Crown,
      rarity: 'legendary',
      condition: (stats) => (stats?.totalItems || 0) >= 500,
      points: 1000,
      progressCondition: (stats) => ({ current: stats?.totalItems || 0, target: 500 })
    },
    {
      id: 'scanner_streak',
      title: 'Scan Specialist',
      description: '20 succesvolle scans',
      icon: Camera,
      rarity: 'rare',
      condition: (stats) => (stats?.totalScans || 0) >= 20,
      points: 75,
      progressCondition: (stats) => ({ current: stats?.totalScans || 0, target: 20 })
    },
    {
      id: 'valuable_collection',
      title: 'Waardevolle Collectie',
      description: 'Collectie ter waarde van €1000+',
      icon: Target,
      rarity: 'epic',
      condition: (stats) => (stats?.totalValue || 0) >= 1000,
      points: 300,
      progressCondition: (stats) => ({ current: stats?.totalValue || 0, target: 1000 })
    },
    {
      id: 'scanner_pro',
      title: 'Scan Professional',
      description: '95%+ success rate behalen',
      icon: Zap,
      rarity: 'epic',
      condition: (stats) => (stats?.successRate || 0) >= 95,
      points: 200,
      progressCondition: (stats) => ({ current: stats?.successRate || 0, target: 95 })
    }
  ];

  // Memoize calculations to prevent unnecessary re-renders
  const combinedStats = useMemo(() => ({ ...collectionStats, ...scanStats }), [collectionStats, scanStats]);
  
  const currentlyUnlocked = useMemo(() => {
    if (!collectionStats || !scanStats) return [];
    return achievements.filter(achievement => achievement.condition(combinedStats)).map(a => a.id);
  }, [combinedStats, achievements]);

  // Check for newly unlocked achievements with proper dependency management
  useEffect(() => {
    // Skip if data is not ready or cooldown is active
    if (!collectionStats || !scanStats || Date.now() - lastNotificationRef.current < NOTIFICATION_COOLDOWN) return;

    // Get stored achievements to prevent duplicate notifications
    const storedAchievements = JSON.parse(localStorage.getItem('shownAchievements') || '[]');
    
    const newUnlocks = currentlyUnlocked.filter(id => 
      !previousUnlockedRef.current.includes(id) && !storedAchievements.includes(id)
    );

    if (newUnlocks.length > 0) {
      setNewlyUnlocked(newUnlocks);
      lastNotificationRef.current = Date.now();
      
      // Store shown achievements to prevent duplicates
      const updatedShownAchievements = [...storedAchievements, ...newUnlocks];
      localStorage.setItem('shownAchievements', JSON.stringify(updatedShownAchievements));
      
      // Show toast notification for new achievements (max 1 to avoid spam)
      const firstAchievement = achievements.find(a => a.id === newUnlocks[0]);
      if (firstAchievement) {
        toast({
          title: "🏆 Nieuwe Prestatie Behaald!",
          description: newUnlocks.length > 1 
            ? `${firstAchievement.title} en ${newUnlocks.length - 1} andere!`
            : `${firstAchievement.title} - ${firstAchievement.points} punten!`,
        });
      }
      
      // Call callback for each achievement
      newUnlocks.forEach(id => onAchievementUnlock?.(id));
      
      // Clear newly unlocked after animation
      setTimeout(() => setNewlyUnlocked([]), 3000);
    }

    // Update previous reference
    previousUnlockedRef.current = [...unlockedAchievements, ...currentlyUnlocked];
  }, [collectionStats, scanStats, currentlyUnlocked, unlockedAchievements, onAchievementUnlock]);

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-muted/20 to-muted/10';
      case 'rare': return 'from-primary/20 to-primary/10';
      case 'epic': return 'from-accent/20 to-accent/10';
      case 'legendary': return 'from-vinyl-gold/20 to-vinyl-purple/20';
      default: return 'from-muted/20 to-muted/10';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-muted/30';
      case 'rare': return 'border-primary/30';
      case 'epic': return 'border-accent/30';
      case 'legendary': return 'border-vinyl-gold/50';
      default: return 'border-muted/30';
    }
  };

  // Memoize expensive calculations
  const { totalUnlocked, totalPoints, nextAchievement } = useMemo(() => {
    if (!collectionStats || !scanStats) {
      return { totalUnlocked: 0, totalPoints: 0, nextAchievement: achievements[0] };
    }

    const unlockedAchievements = achievements.filter(achievement => 
      achievement.condition(combinedStats)
    );

    const totalUnlocked = unlockedAchievements.length;
    const totalPoints = unlockedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);
    const nextAchievement = achievements.find(achievement => !achievement.condition(combinedStats));

    return { totalUnlocked, totalPoints, nextAchievement };
  }, [combinedStats, achievements]);

  // Don't render if data is not ready
  if (!collectionStats || !scanStats) {
    return (
      <section className="animate-fade-in delay-500">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-vinyl-gold" />
            🏆 Prestaties & Voortgang
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48 animate-pulse bg-muted/30" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-in delay-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-vinyl-gold" />
          🏆 Prestaties & Voortgang
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {totalUnlocked}/{achievements.length} behaald
          </Badge>
          <Badge className="bg-gradient-to-r from-vinyl-purple to-vinyl-gold text-white text-sm px-3 py-1">
            {totalPoints} punten
          </Badge>
        </div>
      </div>

      {/* Next Achievement Spotlight */}
      {nextAchievement && (
        <Card className="mb-6 border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary animate-pulse" />
              🎯 Volgende Doel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <nextAchievement.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{nextAchievement.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{nextAchievement.description}</p>
                {nextAchievement.progressCondition && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{nextAchievement.progressCondition(combinedStats).current}</span>
                      <span>{nextAchievement.progressCondition(combinedStats).target}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (nextAchievement.progressCondition(combinedStats).current / nextAchievement.progressCondition(combinedStats).target) * 100)} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
              <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                {nextAchievement.points} pts
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {achievements.map((achievement) => {
            const isUnlocked = achievement.condition(combinedStats);
            const isNew = newlyUnlocked.includes(achievement.id);
            const progress = achievement.progressCondition?.(combinedStats);
            const progressPercentage = progress ? Math.min(100, (progress.current / progress.target) * 100) : 0;
            
            return (
              <motion.div
                key={achievement.id}
                initial={isNew ? { scale: 0.8, opacity: 0 } : false}
                animate={isNew ? { 
                  scale: [0.8, 1.1, 1], 
                  opacity: 1,
                  boxShadow: ['0 0 0 rgba(255, 215, 0, 0)', '0 0 20px rgba(255, 215, 0, 0.6)', '0 0 0 rgba(255, 215, 0, 0)']
                } : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`relative`}
              >
                <Card 
                  className={`h-full transition-all duration-300 cursor-pointer ${
                    isUnlocked 
                      ? `bg-gradient-to-br ${getRarityGradient(achievement.rarity)} border-2 ${getRarityBorder(achievement.rarity)} hover:shadow-lg` 
                      : 'bg-muted/30 border-muted/50 opacity-70 hover:opacity-90'
                  } ${isNew ? 'ring-2 ring-vinyl-gold ring-opacity-60' : ''}`}
                  onClick={() => setExpandedAchievement(expandedAchievement === achievement.id ? null : achievement.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${
                        isUnlocked ? `bg-gradient-to-br ${getRarityGradient(achievement.rarity)}` : 'bg-muted/50'
                      }`}>
                        <achievement.icon className={`w-5 h-5 ${
                          isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex items-center gap-2">
                        {isUnlocked && (
                          <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: isNew ? [0, 360] : 0 }}
                            className="text-vinyl-gold"
                          >
                            ✨
                          </motion.div>
                        )}
                        {isNew && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2"
                          >
                            <Badge className="bg-vinyl-gold text-black text-xs px-2 py-1 animate-pulse">
                              NEW!
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className={`font-semibold ${
                        isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                    
                    {progress && !isUnlocked && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.current}</span>
                          <span>{progress.target}</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">
                          {Math.round(progressPercentage)}% voltooid
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <Badge 
                        variant={isUnlocked ? "default" : "secondary"}
                        className={`text-xs ${
                          achievement.rarity === 'legendary' ? 'bg-gradient-to-r from-vinyl-gold to-vinyl-purple text-white' :
                          achievement.rarity === 'epic' ? 'bg-accent text-accent-foreground' :
                          achievement.rarity === 'rare' ? 'bg-primary text-primary-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {achievement.rarity}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {achievement.points} pts
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          expandedAchievement === achievement.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                    
                    {expandedAchievement === achievement.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-muted/30"
                      >
                        <p className="text-xs text-muted-foreground">
                          {isUnlocked 
                            ? "🎉 Gefeliciteerd! Je hebt deze prestatie behaald." 
                            : `💡 Tip: ${achievement.description.toLowerCase()}`
                          }
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
};