import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  icon: React.ElementType;
  reward: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface NextGoalWidgetProps {
  totalItems: number;
  totalValue: number;
  totalScans: number;
}

export const NextGoalWidget = ({ 
  totalItems = 0, 
  totalValue = 0, 
  totalScans = 0 
}: NextGoalWidgetProps) => {
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const d = tr.dashboardUI;

  const milestones: Milestone[] = [
    { id: 'first_10', title: d.firstCollection, description: d.firstCollectionDesc, target: 10, icon: Target, reward: d.musicDiscovererBadge, rarity: 'bronze' },
    { id: 'quarter_century', title: d.quarterCentury, description: d.quarterCenturyDesc, target: 25, icon: Trophy, reward: d.collectorBadge, rarity: 'bronze' },
    { id: 'half_century', title: d.halfCentury, description: d.halfCenturyDesc, target: 50, icon: Target, reward: d.enthusiastStatus, rarity: 'silver' },
    { id: 'century_club', title: d.centuryClub, description: d.centuryClubDesc, target: 100, icon: Trophy, reward: d.expertStatus, rarity: 'gold' },
    { id: 'double_century', title: d.doubleCentury, description: d.doubleCenturyDesc, target: 200, icon: Target, reward: d.masterCollectorStatus, rarity: 'gold' },
    { id: 'half_millennium', title: d.halfMillennium, description: d.halfMillenniumDesc, target: 500, icon: Trophy, reward: d.legendaryStatus, rarity: 'platinum' },
  ];

  const getNextMilestone = () => milestones.find(milestone => totalItems < milestone.target);

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
    <Card className="border-2 hover:border-vinyl-purple/50 transition-all duration-300 bg-gradient-to-br from-background via-accent/5 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-vinyl-purple" />
            {d.nextGoal}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/prestaties')} className="text-vinyl-purple hover:text-vinyl-purple hover:bg-vinyl-purple/10">
            {d.allAchievements}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {nextMilestone ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <nextMilestone.icon className="w-5 h-5 text-vinyl-purple" />
                  <div>
                    <h4 className="font-semibold text-sm">{nextMilestone.title}</h4>
                    <p className="text-xs text-muted-foreground">{nextMilestone.description}</p>
                  </div>
                </div>
                <Badge className={`bg-gradient-to-r ${getRarityColor(nextMilestone.rarity)} text-white text-xs`}>
                  {nextMilestone.rarity}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{totalItems} / {nextMilestone.target}</span>
                  <span className="text-vinyl-purple font-medium">{remaining} {d.toGo}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="bg-accent/10 rounded-lg p-2 text-center">
                <p className="text-xs font-medium text-accent">🎁 {nextMilestone.reward}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <Trophy className="w-8 h-8 text-vinyl-gold mx-auto mb-2" />
            <h4 className="font-bold text-sm text-foreground mb-1">{d.allMilestonesReached}</h4>
            <p className="text-xs text-muted-foreground">{d.youAreCollectionMaster}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
