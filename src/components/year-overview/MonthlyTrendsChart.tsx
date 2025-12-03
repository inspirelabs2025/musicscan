import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthlyData } from '@/hooks/useYearOverview';

interface MonthlyTrendsChartProps {
  data: MonthlyData[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({ data }) => {
  // Fill in missing months with 0 values
  const fullData = MONTH_NAMES.map((name, index) => {
    const monthData = data.find(d => d.month === index + 1);
    return {
      month: index + 1,
      month_name: name,
      scans: monthData?.scans || 0,
      avg_price: monthData?.avg_price || 0
    };
  });

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Maandelijkse Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Geen maandelijkse data beschikbaar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Maandelijkse Activiteit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={fullData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month_name" 
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'scans' ? value.toLocaleString() : `€${value.toFixed(2)}`,
                  name === 'scans' ? 'Scans' : 'Gem. Prijs'
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="scans" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorScans)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
