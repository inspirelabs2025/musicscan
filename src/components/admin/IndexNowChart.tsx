import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";

interface DailySubmission {
  date: string;
  count: number;
  urls: number;
}

export function IndexNowChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['indexnow-daily-stats'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data: submissions, error } = await supabase
        .from('indexnow_submissions')
        .select('submitted_at, urls')
        .gte('submitted_at', thirtyDaysAgo.toISOString())
        .order('submitted_at', { ascending: true });

      if (error) throw error;

      // Create a map of all days in the range
      const days = eachDayOfInterval({
        start: thirtyDaysAgo,
        end: new Date()
      });

      const dailyMap = new Map<string, { count: number; urls: number }>();
      
      // Initialize all days with 0
      days.forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        dailyMap.set(key, { count: 0, urls: 0 });
      });

      // Aggregate submissions by day
      submissions?.forEach(sub => {
        const day = format(new Date(sub.submitted_at), 'yyyy-MM-dd');
        const current = dailyMap.get(day) || { count: 0, urls: 0 };
        dailyMap.set(day, {
          count: current.count + 1,
          urls: current.urls + (sub.urls?.length || 0)
        });
      });

      // Convert to array
      const result: DailySubmission[] = [];
      dailyMap.forEach((value, key) => {
        result.push({
          date: key,
          count: value.count,
          urls: value.urls
        });
      });

      return result.sort((a, b) => a.date.localeCompare(b.date));
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
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    urls: {
      label: "URLs",
      color: "hsl(var(--primary))",
    },
  };

  const totalUrls = data?.reduce((sum, d) => sum + d.urls, 0) || 0;
  const totalSubmissions = data?.reduce((sum, d) => sum + d.count, 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📡 IndexNow Submissions
        </CardTitle>
        <CardDescription>
          Laatste 30 dagen: {totalUrls.toLocaleString()} URLs in {totalSubmissions} submissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: nl })}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              width={40}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  labelFormatter={(value) => format(new Date(value), 'EEEE d MMMM', { locale: nl })}
                />
              }
            />
            <Bar 
              dataKey="urls" 
              fill="hsl(var(--primary))" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
