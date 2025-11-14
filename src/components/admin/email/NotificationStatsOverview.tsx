import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const NotificationStatsOverview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_stats')
        .select('*');

      if (error) throw error;
      return data;
    },
  });

  const totalNotifications = stats?.reduce((sum, stat) => sum + stat.total_count, 0) || 0;
  const totalUnread = stats?.reduce((sum, stat) => sum + stat.unread_count, 0) || 0;
  const todayCount = stats?.reduce((sum, stat) => sum + stat.today_count, 0) || 0;
  const weekCount = stats?.reduce((sum, stat) => sum + stat.this_week_count, 0) || 0;

  const chartData = stats?.map(stat => ({
    name: stat.type,
    value: stat.total_count
  })) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Totaal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalNotifications}</p>
            <p className="text-xs text-muted-foreground">Alle notificaties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Ongelezen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">{totalUnread}</p>
            <p className="text-xs text-muted-foreground">Nog niet gelezen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Vandaag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-500">{todayCount}</p>
            <p className="text-xs text-muted-foreground">Vandaag aangemaakt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Deze Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{weekCount}</p>
            <p className="text-xs text-muted-foreground">Afgelopen 7 dagen</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaties per Type</CardTitle>
          <CardDescription>Verdeling van alle notificatie types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gedetailleerde Statistieken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-right p-2">Totaal</th>
                  <th className="text-right p-2">Gelezen</th>
                  <th className="text-right p-2">Ongelezen</th>
                  <th className="text-right p-2">Vandaag</th>
                  <th className="text-right p-2">Deze Week</th>
                </tr>
              </thead>
              <tbody>
                {stats?.map((stat) => (
                  <tr key={stat.type} className="border-b">
                    <td className="p-2 font-medium">{stat.type}</td>
                    <td className="text-right p-2">{stat.total_count}</td>
                    <td className="text-right p-2 text-green-600">{stat.read_count}</td>
                    <td className="text-right p-2 text-orange-600">{stat.unread_count}</td>
                    <td className="text-right p-2">{stat.today_count}</td>
                    <td className="text-right p-2">{stat.this_week_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
