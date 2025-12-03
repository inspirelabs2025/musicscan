import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageviewStats, usePageviewTotals } from "@/hooks/usePageviewStats";
import { Eye, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function PageviewStatsWidget() {
  const { data: stats, isLoading: statsLoading } = usePageviewStats({ days: 7 });
  const { data: totalViews, isLoading: totalsLoading } = usePageviewTotals(7);

  const isLoading = statsLoading || totalsLoading;

  const topPages = stats?.slice(0, 5) || [];
  const totalUniqueSessions = stats?.reduce((acc, s) => acc + Number(s.unique_sessions), 0) || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Pageviews (7 dagen)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{totalViews?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Totaal views</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{totalUniqueSessions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Unieke sessies</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Top pagina's</p>
              {topPages.map((page, index) => (
                <div key={page.path} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[200px]" title={page.path}>
                    {index + 1}. {page.path === '/' ? 'Homepage' : page.path}
                  </span>
                  <span className="font-medium">{Number(page.view_count).toLocaleString()}</span>
                </div>
              ))}
              {topPages.length === 0 && (
                <p className="text-sm text-muted-foreground">Nog geen data</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
