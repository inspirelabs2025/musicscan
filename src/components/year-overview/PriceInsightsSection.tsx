import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PriceInsights } from '@/hooks/useYearOverview';

interface PriceInsightsSectionProps {
  data: PriceInsights;
}

export const PriceInsightsSection: React.FC<PriceInsightsSectionProps> = ({ data }) => {
  const hasHighestValued = data.highest_valued && data.highest_valued.length > 0;
  const hasPriceRanges = data.price_ranges && data.price_ranges.length > 0;

  if (!hasHighestValued && !hasPriceRanges) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💰 Prijs Inzichten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Geen prijs data beschikbaar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="col-span-full grid md:grid-cols-2 gap-6">
      {/* Highest Valued Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💎 Hoogst Gewaardeerd
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasHighestValued ? (
            <div className="space-y-3">
              {data.highest_valued.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.artist}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.title}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    €{item.median_price?.toFixed(2) || '0.00'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Geen items beschikbaar</p>
          )}
        </CardContent>
      </Card>

      {/* Price Range Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Prijsklassen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasPriceRanges ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.price_ranges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="price_range" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Items']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(160, 70%, 50%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground">Geen prijsklassen beschikbaar</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
