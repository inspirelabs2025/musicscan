import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Heart, Share2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialProofStatsProps {
  views: number;
  readingTime?: number;
  likes?: number;
  shares?: number;
  compact?: boolean;
  className?: string;
}

export const SocialProofStats: React.FC<SocialProofStatsProps> = ({
  views,
  readingTime,
  likes,
  shares,
  compact = false,
  className
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const stats = [
    { icon: Eye, value: views, label: 'weergaven', show: true },
    { icon: Clock, value: readingTime, label: 'min leestijd', show: !!readingTime },
    { icon: Heart, value: likes, label: 'likes', show: !!likes },
    { icon: Share2, value: shares, label: 'shares', show: !!shares },
  ].filter(stat => stat.show);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-4 text-sm text-muted-foreground', className)}>
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <stat.icon className="h-4 w-4" />
            <span className="font-medium">{formatNumber(stat.value!)}</span>
            <span className="hidden sm:inline">{stat.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className={cn('bg-card/50 backdrop-blur-sm', className)}>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(stat.value!)}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface PopularityBadgeProps {
  views: number;
  threshold?: {
    hot: number;
    trending: number;
  };
  className?: string;
}

export const PopularityBadge: React.FC<PopularityBadgeProps> = ({
  views,
  threshold = { hot: 1000, trending: 500 },
  className
}) => {
  if (views >= threshold.hot) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        'bg-gradient-to-r from-orange-500 to-red-500 text-white',
        className
      )}>
        🔥 Hot
      </span>
    );
  }

  if (views >= threshold.trending) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        className
      )}>
        📈 Trending
      </span>
    );
  }

  return null;
};
