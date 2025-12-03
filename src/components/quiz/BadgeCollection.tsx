import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface BadgeCollectionProps {
  earnedBadges: string[];
  totalQuizzes: number;
  bestScore: number;
  dailyStreak: number;
}

interface BadgeDefinition {
  id: string;
  emoji: string;
  title: string;
  description: string;
  requirement: (props: BadgeCollectionProps) => boolean;
}

const ALL_BADGES: BadgeDefinition[] = [
  {
    id: 'quiz_beginner',
    emoji: '🎯',
    title: 'Quiz Beginner',
    description: 'Speel je eerste quiz',
    requirement: (p) => p.totalQuizzes >= 1,
  },
  {
    id: 'quiz_enthusiast',
    emoji: '🎮',
    title: 'Quiz Enthousiast',
    description: 'Speel 5 quizzen',
    requirement: (p) => p.totalQuizzes >= 5,
  },
  {
    id: 'quiz_addict',
    emoji: '🎲',
    title: 'Quiz Verslaafd',
    description: 'Speel 25 quizzen',
    requirement: (p) => p.totalQuizzes >= 25,
  },
  {
    id: 'quiz_master',
    emoji: '👑',
    title: 'Quiz Master',
    description: 'Speel 100 quizzen',
    requirement: (p) => p.totalQuizzes >= 100,
  },
  {
    id: 'perfectionist',
    emoji: '💯',
    title: 'Perfectionist',
    description: 'Behaal een 100% score',
    requirement: (p) => p.bestScore >= 100,
  },
  {
    id: 'expert',
    emoji: '🥇',
    title: 'Expert',
    description: 'Behaal minimaal 90% score',
    requirement: (p) => p.bestScore >= 90,
  },
  {
    id: 'on_fire',
    emoji: '🔥',
    title: 'On Fire',
    description: '7 dagen streak',
    requirement: (p) => p.dailyStreak >= 7,
  },
  {
    id: 'unstoppable',
    emoji: '⚡',
    title: 'Onstopbaar',
    description: '30 dagen streak',
    requirement: (p) => p.dailyStreak >= 30,
  },
  {
    id: 'dedicated',
    emoji: '💪',
    title: 'Toegewijd',
    description: '3 dagen streak',
    requirement: (p) => p.dailyStreak >= 3,
  },
  {
    id: 'music_lover',
    emoji: '🎵',
    title: 'Muziekliefhebber',
    description: 'Speel 10 quizzen',
    requirement: (p) => p.totalQuizzes >= 10,
  },
  {
    id: 'scholar',
    emoji: '📚',
    title: 'Muziek Geleerde',
    description: 'Speel 50 quizzen',
    requirement: (p) => p.totalQuizzes >= 50,
  },
  {
    id: 'legend',
    emoji: '🌟',
    title: 'Legende',
    description: 'Speel 200 quizzen',
    requirement: (p) => p.totalQuizzes >= 200,
  },
];

export function BadgeCollection({ earnedBadges, totalQuizzes, bestScore, dailyStreak }: BadgeCollectionProps) {
  const props = { earnedBadges, totalQuizzes, bestScore, dailyStreak };
  
  const earned = ALL_BADGES.filter(badge => badge.requirement(props));
  const locked = ALL_BADGES.filter(badge => !badge.requirement(props));

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            Verdiende Badges ({earned.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earned.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Speel quizzen om badges te verdienen!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {earned.map(badge => (
                <div 
                  key={badge.id}
                  className="flex flex-col items-center p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg border border-primary/20"
                >
                  <span className="text-4xl mb-2">{badge.emoji}</span>
                  <p className="font-semibold text-sm text-center">{badge.title}</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {badge.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Locked Badges */}
      {locked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Nog te Verdienen ({locked.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {locked.map(badge => (
                <div 
                  key={badge.id}
                  className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border border-border opacity-60"
                >
                  <div className="relative">
                    <span className="text-4xl mb-2 grayscale">{badge.emoji}</span>
                    <Lock className="w-4 h-4 absolute -bottom-1 -right-1 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-sm text-center mt-2">{badge.title}</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {badge.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
