import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Disc, Users, Music, Euro, FileText, ShoppingBag } from 'lucide-react';
import type { YearOverviewStats } from '@/hooks/useYearOverview';

interface GlobalStatsCardsProps {
  stats: YearOverviewStats;
}

export const GlobalStatsCards: React.FC<GlobalStatsCardsProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Totaal Scans',
      value: stats.total_scans?.toLocaleString() || '0',
      icon: Disc,
      color: 'text-primary'
    },
    {
      label: 'Unieke Artiesten',
      value: stats.unique_artists?.toLocaleString() || '0',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      label: 'Vinyl %',
      value: `${stats.vinyl_percentage || 0}%`,
      icon: Music,
      color: 'text-purple-500'
    },
    {
      label: 'Gem. Prijs',
      value: `€${stats.avg_median_price || 0}`,
      icon: Euro,
      color: 'text-green-500'
    },
    {
      label: 'Verhalen',
      value: stats.total_stories?.toLocaleString() || '0',
      icon: FileText,
      color: 'text-orange-500'
    },
    {
      label: 'Producten',
      value: stats.total_products?.toLocaleString() || '0',
      icon: ShoppingBag,
      color: 'text-pink-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {statItems.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
