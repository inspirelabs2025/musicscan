import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceTrendBadgeProps {
  trend: 'up' | 'down' | 'stable';
  changePercent?: number;
  className?: string;
}

export const PriceTrendBadge: React.FC<PriceTrendBadgeProps> = ({
  trend,
  changePercent,
  className
}) => {
  const getTrendConfig = () => {
    switch (trend) {
      case 'up':
        return {
          icon: TrendingUp,
          label: changePercent ? `↑ ${changePercent.toFixed(1)}%` : '↑ Stijgend',
          variant: 'default' as const,
          colorClass: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
        };
      case 'down':
        return {
          icon: TrendingDown,
          label: changePercent ? `↓ ${Math.abs(changePercent).toFixed(1)}%` : '↓ Dalend',
          variant: 'destructive' as const,
          colorClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
        };
      default:
        return {
          icon: Minus,
          label: 'Stabiel',
          variant: 'secondary' as const,
          colorClass: 'bg-muted text-muted-foreground'
        };
    }
  };

  const config = getTrendConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'flex items-center gap-1 font-medium',
        config.colorClass,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

interface LastUpdatedBadgeProps {
  lastUpdate: string | Date;
  className?: string;
}

export const LastUpdatedBadge: React.FC<LastUpdatedBadgeProps> = ({
  lastUpdate,
  className
}) => {
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Vandaag bijgewerkt';
    if (diffDays === 1) return 'Gisteren bijgewerkt';
    if (diffDays < 7) return `${diffDays} dagen geleden bijgewerkt`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden bijgewerkt`;
    return `${Math.floor(diffDays / 30)} maanden geleden bijgewerkt`;
  };

  return (
    <Badge variant="outline" className={cn('text-xs', className)}>
      🕒 {formatDate(lastUpdate)}
    </Badge>
  );
};
