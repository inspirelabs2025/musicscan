import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Clock, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

export function DailyChallengeBanner() {
  const { tr } = useLanguage();
  const q = tr.quizGameUI;

  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setUTCHours(24, 0, 0, 0);
  const hoursLeft = Math.floor((nextMidnight.getTime() - now.getTime()) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((nextMidnight.getTime() - now.getTime()) / (1000 * 60)) % 60;

  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(236,72,153,0.15),transparent_50%)]"></div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-pink-500 shadow-lg shadow-primary/25">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">{q.dailyChallenge}</h3>
                <Badge variant="secondary" className="bg-primary/20 text-primary">{q.newBadge}</Badge>
              </div>
              <p className="text-muted-foreground">{q.dailyChallengeDesc}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{q.endsIn}</span>
              </div>
              <p className="text-lg font-bold text-primary">{hoursLeft}u {minutesLeft}m</p>
            </div>
            <Link to="/quizzen/daily">
              <Button size="lg" className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-lg">
                {q.playNow}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
