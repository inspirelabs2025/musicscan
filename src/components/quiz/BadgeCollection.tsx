import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BadgeCollectionProps {
  earnedBadges: string[];
  totalQuizzes: number;
  bestScore: number;
  dailyStreak: number;
}

export function BadgeCollection({ earnedBadges, totalQuizzes, bestScore, dailyStreak }: BadgeCollectionProps) {
  const { tr } = useLanguage();
  const q = tr.quizGameUI;
  const props = { earnedBadges, totalQuizzes, bestScore, dailyStreak };

  const ALL_BADGES = [
    { id: 'quiz_beginner', emoji: '🎯', title: q.badgeQuizBeginner, description: q.badgeQuizBeginnerDesc, requirement: (p: typeof props) => p.totalQuizzes >= 1 },
    { id: 'quiz_enthusiast', emoji: '🎮', title: q.badgeEnthusiast, description: q.badgeEnthusiastDesc, requirement: (p: typeof props) => p.totalQuizzes >= 5 },
    { id: 'quiz_addict', emoji: '🎲', title: q.badgeAddict, description: q.badgeAddictDesc, requirement: (p: typeof props) => p.totalQuizzes >= 25 },
    { id: 'quiz_master', emoji: '👑', title: q.badgeMaster, description: q.badgeMasterDesc, requirement: (p: typeof props) => p.totalQuizzes >= 100 },
    { id: 'perfectionist', emoji: '💯', title: q.badgePerfectionist, description: q.badgePerfectionistDesc, requirement: (p: typeof props) => p.bestScore >= 100 },
    { id: 'expert', emoji: '🥇', title: q.badgeExpert, description: q.badgeExpertDesc, requirement: (p: typeof props) => p.bestScore >= 90 },
    { id: 'on_fire', emoji: '🔥', title: q.badgeOnFire, description: q.badgeOnFireDesc, requirement: (p: typeof props) => p.dailyStreak >= 7 },
    { id: 'unstoppable', emoji: '⚡', title: q.badgeUnstoppable, description: q.badgeUnstoppableDesc, requirement: (p: typeof props) => p.dailyStreak >= 30 },
    { id: 'dedicated', emoji: '💪', title: q.badgeDedicated, description: q.badgeDedicatedDesc, requirement: (p: typeof props) => p.dailyStreak >= 3 },
    { id: 'music_lover', emoji: '🎵', title: q.badgeMusicLover, description: q.badgeMusicLoverDesc, requirement: (p: typeof props) => p.totalQuizzes >= 10 },
    { id: 'scholar', emoji: '📚', title: q.badgeScholar, description: q.badgeScholarDesc, requirement: (p: typeof props) => p.totalQuizzes >= 50 },
    { id: 'legend', emoji: '🌟', title: q.badgeLegend, description: q.badgeLegendDesc, requirement: (p: typeof props) => p.totalQuizzes >= 200 },
  ];

  const earned = ALL_BADGES.filter(badge => badge.requirement(props));
  const locked = ALL_BADGES.filter(badge => !badge.requirement(props));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            {q.earnedBadges} ({earned.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earned.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{q.playToEarn}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {earned.map(badge => (
                <div key={badge.id} className="flex flex-col items-center p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
                  <span className="text-4xl mb-2">{badge.emoji}</span>
                  <p className="font-semibold text-sm text-center">{badge.title}</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {locked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {q.stillToEarn} ({locked.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {locked.map(badge => (
                <div key={badge.id} className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border border-border opacity-60">
                  <div className="relative">
                    <span className="text-4xl mb-2 grayscale">{badge.emoji}</span>
                    <Lock className="w-4 h-4 absolute -bottom-1 -right-1 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-sm text-center mt-2">{badge.title}</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
