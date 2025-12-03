import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TopArtist } from '@/hooks/useYearOverview';

interface TopArtistsChartProps {
  data: TopArtist[];
}

export const TopArtistsChart: React.FC<TopArtistsChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌟 Top 10 Artiesten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Geen artiest data beschikbaar</p>
        </CardContent>
      </Card>
    );
  }

  // Truncate long artist names
  const chartData = data.map(item => ({
    ...item,
    displayName: item.artist.length > 20 ? item.artist.substring(0, 18) + '...' : item.artist
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌟 Top 10 Artiesten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis 
                type="category" 
                dataKey="displayName" 
                stroke="hsl(var(--muted-foreground))"
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'count' ? value.toLocaleString() : `€${value.toFixed(2)}`,
                  name === 'count' ? 'Scans' : 'Gem. Waarde'
                ]}
                labelFormatter={(label) => chartData.find(d => d.displayName === label)?.artist || label}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="hsl(var(--primary))" 
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
