import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Crown, Target, Music, Disc, Camera, MessageSquare, Sparkles } from 'lucide-react';
import { useCollectionStats } from '@/hooks/useCollectionStats';
import { useUnifiedScansStats } from '@/hooks/useUnifiedScansStats';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectionMilestones } from '@/components/dashboard/CollectionMilestones';

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

const Prestaties = () => {
  const { data: collectionStats } = useCollectionStats();
  const { data: scanStats } = useUnifiedScansStats();

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
      title: 'Muziek Enthusiast',
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
      description: '20 succesvolle scans uitgevoerd',
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

  const combinedStats = { ...collectionStats, ...scanStats };
  
  const unlockedAchievements = achievements.filter(achievement => 
    achievement.condition(combinedStats)
  );
  
  const totalPoints = unlockedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-slate-500/20 to-slate-600/20';
      case 'rare': return 'from-blue-500/20 to-blue-600/20';
      case 'epic': return 'from-purple-500/20 to-purple-600/20';
      case 'legendary': return 'from-yellow-400/20 to-yellow-600/20';
      default: return 'from-gray-500/20 to-gray-600/20';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-slate-500/30';
      case 'rare': return 'border-blue-500/30';
      case 'epic': return 'border-purple-500/30';
      case 'legendary': return 'border-yellow-500/50';
      default: return 'border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <Navigation />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
              <Trophy className="w-10 h-10 text-vinyl-gold" />
              🏆 Prestaties & Mijlpalen
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ontdek je vooruitgang, behaal prestaties en unlock speciale beloningen terwijl je je muziekcollectie uitbreidt.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-gradient-to-r from-vinyl-purple to-vinyl-gold text-white px-4 py-2 text-lg">
                {totalPoints} Punten Behaald
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                {unlockedAchievements.length}/{achievements.length} Prestaties
              </Badge>
            </div>
          </div>

          {/* Collection Milestones */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-vinyl-purple" />
              🎯 Collectie Mijlpalen
            </h2>
            <CollectionMilestones 
              totalItems={collectionStats?.totalItems || 0}
              totalValue={collectionStats?.totalValue || 0}
              totalScans={scanStats?.totalScans || 0}
            />
          </section>

          {/* Achievements Grid */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-vinyl-gold" />
              ✨ Alle Prestaties
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => {
                const isUnlocked = achievement.condition(combinedStats);
                const progress = achievement.progressCondition?.(combinedStats);
                const progressPercentage = progress ? Math.min(100, (progress.current / progress.target) * 100) : 0;
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: achievements.indexOf(achievement) * 0.1 }}
                  >
                    <Card className={`h-full transition-all duration-300 ${
                      isUnlocked 
                        ? `bg-gradient-to-br ${getRarityGradient(achievement.rarity)} border-2 ${getRarityBorder(achievement.rarity)} hover:shadow-lg` 
                        : 'bg-muted/30 border-muted/50 opacity-70'
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className={`p-3 rounded-lg ${
                            isUnlocked ? `bg-gradient-to-br ${getRarityGradient(achievement.rarity)}` : 'bg-muted/50'
                          }`}>
                            <achievement.icon className={`w-6 h-6 ${
                              isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="flex items-center gap-2">
                            {isUnlocked && (
                              <div className="text-vinyl-gold text-xl">✨</div>
                            )}
                            <Badge 
                              className={`text-xs ${
                                achievement.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' :
                                achievement.rarity === 'epic' ? 'bg-purple-500 text-white' :
                                achievement.rarity === 'rare' ? 'bg-blue-500 text-white' :
                                'bg-slate-500 text-white'
                              }`}
                            >
                              {achievement.rarity}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className={`font-bold text-lg ${
                            isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {achievement.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                        
                        {progress && !isUnlocked && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>{progress.current}</span>
                              <span>{progress.target}</span>
                            </div>
                            <Progress value={progressPercentage} className="h-3" />
                            <p className="text-sm text-muted-foreground text-center">
                              {Math.round(progressPercentage)}% voltooid
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t border-muted/30">
                          <span className={`font-semibold ${
                            isUnlocked ? 'text-vinyl-gold' : 'text-muted-foreground'
                          }`}>
                            {achievement.points} punten
                          </span>
                          {isUnlocked && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              ✓ Behaald
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Prestaties;