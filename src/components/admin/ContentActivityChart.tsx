import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { nl } from "date-fns/locale";

const CONTENT_SOURCES = [
  { id: 'blog_posts', table: 'blog_posts', label: 'Blogs', color: 'hsl(220, 70%, 50%)' },
  { id: 'platform_products', table: 'platform_products', label: 'Products', color: 'hsl(150, 70%, 45%)' },
  { id: 'artist_stories', table: 'artist_stories', label: 'Artist Stories', color: 'hsl(280, 70%, 50%)' },
  { id: 'indexnow', table: 'indexnow_submissions', label: 'IndexNow', color: 'hsl(30, 80%, 50%)' },
  { id: 'album_socks', table: 'album_socks', label: 'Socks', color: 'hsl(340, 70%, 50%)' },
  { id: 'album_tshirts', table: 'album_tshirts', label: 'T-Shirts', color: 'hsl(180, 70%, 45%)' },
];

export function ContentActivityChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['content-activity-daily'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      // Fetch all sources in parallel
      const results = await Promise.all(
        CONTENT_SOURCES.map(async (source) => {
          const dateField = source.table === 'indexnow_submissions' ? 'submitted_at' : 'created_at';
          
          const { data, error } = await supabase
            .from(source.table)
            .select(dateField)
            .gte(dateField, thirtyDaysAgo.toISOString());

          if (error) {
            console.error(`Error fetching ${source.table}:`, error);
            return { source, data: [] };
          }
          
          return { source, data: data || [] };
        })
      );

      // Create a map of all days
      const days = eachDayOfInterval({
        start: thirtyDaysAgo,
        end: new Date()
      });

      const dailyData: Record<string, Record<string, number>> = {};
      
      days.forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        dailyData[key] = {};
        CONTENT_SOURCES.forEach(s => {
          dailyData[key][s.id] = 0;
        });
      });

      // Aggregate by day for each source
      results.forEach(({ source, data }) => {
        const dateField = source.table === 'indexnow_submissions' ? 'submitted_at' : 'created_at';
        data.forEach((item: any) => {
          const day = format(new Date(item[dateField]), 'yyyy-MM-dd');
          if (dailyData[day]) {
            dailyData[day][source.id] = (dailyData[day][source.id] || 0) + 1;
          }
        });
      });

      // Convert to array
      return Object.entries(dailyData)
        .map(([date, counts]) => ({
          date,
          ...counts
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = CONTENT_SOURCES.reduce((acc, source) => {
    acc[source.id] = { label: source.label, color: source.color };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Content Aanmaak per Dag</CardTitle>
        <CardDescription>
          Laatste 30 dagen - alle content types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: nl })}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} width={30} />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  labelFormatter={(value) => format(new Date(value), 'EEEE d MMMM', { locale: nl })}
                />
              }
            />
            <Legend />
            {CONTENT_SOURCES.map((source) => (
              <Bar
                key={source.id}
                dataKey={source.id}
                name={source.label}
                fill={source.color}
                stackId="content"
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
