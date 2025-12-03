import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { GenreData } from '@/hooks/useYearOverview';

interface GenreDistributionChartProps {
  data: GenreData[];
  narrative?: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(40, 70%, 50%)',
  'hsl(160, 70%, 50%)',
  'hsl(200, 70%, 50%)',
  'hsl(260, 70%, 50%)',
  'hsl(320, 70%, 50%)',
  'hsl(80, 70%, 50%)',
];

export const GenreDistributionChart: React.FC<GenreDistributionChartProps> = ({ data, narrative }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎸 Genre Verdeling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Geen genre data beschikbaar</p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const chartData = data.map(item => ({
    ...item,
    percentage: ((item.count / total) * 100).toFixed(1)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎸 Genre Verdeling
        </CardTitle>
      </CardHeader>
      <CardContent>
        {narrative && (
          <p className="text-sm text-muted-foreground mb-4">{narrative}</p>
        )}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="genre"
                label={({ genre, percentage }) => `${genre} (${percentage}%)`}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
