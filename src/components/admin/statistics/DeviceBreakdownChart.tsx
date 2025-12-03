import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeviceBreakdown } from '@/hooks/useDetailedAnalytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface DeviceBreakdownChartProps {
  days: number;
}

const COLORS = {
  Desktop: '#3b82f6',
  Mobile: '#22c55e',
  Tablet: '#eab308',
};

const ICONS = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
};

export function DeviceBreakdownChart({ days }: DeviceBreakdownChartProps) {
  const { data, isLoading } = useDeviceBreakdown(days);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Verdeling</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.map((device) => ({
    name: device.device_type,
    value: Number(device.view_count),
    percentage: device.percentage,
    fill: COLORS[device.device_type as keyof typeof COLORS] || '#6b7280',
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Verdeling</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Views']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-6">
            {data?.map((device) => {
              const Icon = ICONS[device.device_type as keyof typeof ICONS] || Monitor;
              const color = COLORS[device.device_type as keyof typeof COLORS] || '#6b7280';
              return (
                <div key={device.device_type} className="flex items-center gap-4">
                  <div 
                    className="p-3 rounded-lg" 
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{device.device_type}</span>
                      <span className="text-muted-foreground">{device.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${device.percentage}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Number(device.view_count).toLocaleString()} views
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
