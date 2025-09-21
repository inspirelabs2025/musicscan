import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Sparkles, Gift, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistentMilestones } from '@/hooks/usePersistentMilestones';

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  icon: React.ElementType;
  reward: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface CollectionMilestonesProps {
  totalItems: number;
  totalValue: number;
  totalScans: number;
  onMilestoneReached?: (milestone: Milestone) => void;
}

export const CollectionMilestones = ({ 
  totalItems = 0, 
  totalValue = 0, 
  totalScans = 0,
  onMilestoneReached 
}: CollectionMilestonesProps) => {
  const [showCelebration, setShowCelebration] = useState<Milestone | null>(null);
  
  const { 
    reachedMilestones, 
    addMultipleMilestones, 
    isMilestoneReached,
    isInitialized 
  } = usePersistentMilestones();

  const milestones: Milestone[] = [
    {
      id: 'first_10',
      title: 'Eerste Collectie',
      description: '10 albums verzameld',
      target: 10,
      icon: Target,
      reward: '🎵 Muziek Ontdekker Badge',
      rarity: 'bronze'
    },
    {
      id: 'quarter_century',
      title: 'Kwart Eeuw',
      description: '25 albums in bezit',
      target: 25,
      icon: Trophy,
      reward: '🏆 Verzamelaar Badge',
      rarity: 'bronze'
    },
    {
      id: 'half_century',
      title: 'Halve Eeuw',
      description: '50 albums verzameld',
      target: 50,
      icon: Sparkles,
      reward: '⭐ Enthusiast Status',
      rarity: 'silver'
    },
    {
      id: 'century_club',
      title: 'Century Club',
      description: '100 albums collectie',
      target: 100,
      icon: Crown,
      reward: '👑 Expert Status',
      rarity: 'gold'
    },
    {
      id: 'double_century',
      title: 'Dubbele Eeuw',
      description: '200 albums sterk',
      target: 200,
      icon: Gift,
      reward: '🎁 Master Collector Status',
      rarity: 'gold'
    },
    {
      id: 'half_millennium',
      title: 'Halve Millennium',
      description: '500 albums verzameld',
      target: 500,
      icon: Crown,
      reward: '💎 Legendary Status',
      rarity: 'platinum'
    }
  ];

  // Check for newly reached milestones
  useEffect(() => {
    // Wait for initialization before checking milestones
    if (!isInitialized) return;

    const newlyReached = milestones.filter(milestone => 
      totalItems >= milestone.target && !isMilestoneReached(milestone.id)
    );

    if (newlyReached.length > 0) {
      // Show celebration for the highest milestone reached
      const highestMilestone = newlyReached.reduce((prev, current) => 
        current.target > prev.target ? current : prev
      );
      
      setShowCelebration(highestMilestone);
      addMultipleMilestones(newlyReached.map(m => m.id));
      onMilestoneReached?.(highestMilestone);

      // Hide celebration after 3 seconds (reduced from 5)
      setTimeout(() => {
        setShowCelebration(null);
      }, 3000);
    }
  }, [totalItems, isInitialized, isMilestoneReached, addMultipleMilestones, onMilestoneReached]);

  const getNextMilestone = () => {
    return milestones.find(milestone => totalItems < milestone.target);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze': return 'from-amber-600 to-amber-800';
      case 'silver': return 'from-slate-400 to-slate-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const nextMilestone = getNextMilestone();
  const progress = nextMilestone ? (totalItems / nextMilestone.target) * 100 : 100;
  const remaining = nextMilestone ? nextMilestone.target - totalItems : 0;

  return (
    <>
      {/* Main Milestone Card */}
      <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 bg-gradient-to-br from-background via-accent/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-vinyl-purple" />
            🎯 Collectie Mijlpalen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {nextMilestone ? (
            <>
              {/* Current Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <nextMilestone.icon className="w-5 h-5 text-vinyl-purple" />
                    <div>
                      <h4 className="font-semibold">{nextMilestone.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {nextMilestone.description}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={`bg-gradient-to-r ${getRarityColor(nextMilestone.rarity)} text-white`}
                  >
                    {nextMilestone.rarity}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{totalItems} / {nextMilestone.target} albums</span>
                    <span className="text-vinyl-purple font-medium">
                      {remaining} te gaan!
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="bg-accent/10 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-accent">
                    🎁 Beloning: {nextMilestone.reward}
                  </p>
                </div>
              </div>

              {/* Motivation */}
              <div className="text-center pt-2 border-t border-accent/20">
                <p className="text-xs text-muted-foreground">
                  {remaining <= 5 ? 
                    `🔥 Bijna daar! Nog ${remaining} albums te gaan!` :
                    remaining <= 10 ?
                    `⚡ Je bent er bijna! Nog ${remaining} albums!` :
                    `🌟 Blijf verzamelen! ${Math.round(progress)}% voltooid`
                  }
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Crown className="w-12 h-12 text-vinyl-gold mx-auto mb-3" />
              <h4 className="font-bold text-lg text-foreground mb-2">
                🏆 Alle Mijlpalen Behaald!
              </h4>
              <p className="text-sm text-muted-foreground">
                Je hebt alle collectie mijlpalen voltooid. Je bent een ware verzamelmeester!
              </p>
              <Badge className="mt-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white">
                💎 Legendary Collector
              </Badge>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-accent/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-vinyl-purple">{totalItems}</div>
              <div className="text-xs text-muted-foreground">Albums</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-vinyl-gold">€{Math.round(totalValue)}</div>
              <div className="text-xs text-muted-foreground">Waarde</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{totalScans}</div>
              <div className="text-xs text-muted-foreground">Scans</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCelebration(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background rounded-lg p-8 max-w-md mx-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <showCelebration.icon className="w-16 h-16 text-vinyl-gold mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  🎉 Mijlpaal Behaald!
                </h2>
                <h3 className="text-xl font-semibold text-vinyl-purple mb-2">
                  {showCelebration.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {showCelebration.description}
                </p>
                <Badge 
                  className={`bg-gradient-to-r ${getRarityColor(showCelebration.rarity)} text-white mb-4`}
                >
                  {showCelebration.reward}
                </Badge>
              </div>
              
              <Button 
                onClick={() => setShowCelebration(null)}
                className="bg-gradient-to-r from-vinyl-purple to-vinyl-gold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Geweldig!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};