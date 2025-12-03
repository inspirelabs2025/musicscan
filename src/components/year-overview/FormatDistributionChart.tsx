import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { YearOverviewStats } from '@/hooks/useYearOverview';

interface FormatDistributionChartProps {
  stats: YearOverviewStats;
  narrative?: string;
}

export const FormatDistributionChart: React.FC<FormatDistributionChartProps> = ({ stats, narrative }) => {
  const data = [
    { name: 'Vinyl', value: stats.vinyl_count || 0, color: 'hsl(var(--primary))' },
    { name: 'CD', value: stats.cd_count || 0, color: 'hsl(220, 70%, 50%)' },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💿 Vinyl vs CD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Geen format data beschikbaar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💿 Vinyl vs CD
        </CardTitle>
      </CardHeader>
      <CardContent>
        {narrative && (
          <p className="text-sm text-muted-foreground mb-4">{narrative}</p>
        )}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), 'Scans']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center">
          <span className="text-2xl font-bold text-primary">{stats.vinyl_percentage}%</span>
          <span className="text-muted-foreground ml-2">vinyl</span>
        </div>
      </CardContent>
    </Card>
  );
};
