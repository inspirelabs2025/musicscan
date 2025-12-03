import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilteredPageviews } from '@/hooks/useDetailedAnalytics';
import { ExternalLink, Facebook, Search, MousePointer } from 'lucide-react';

interface TopPagesTableProps {
  days: number;
  filterSource?: 'facebook' | 'google' | 'direct';
  title?: string;
  limit?: number;
}

export function TopPagesTable({ days, filterSource, title, limit = 15 }: TopPagesTableProps) {
  const { data, isLoading } = useFilteredPageviews(days);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || 'Top Pagina\'s'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  let filteredData = data || [];
  
  if (filterSource === 'facebook') {
    filteredData = filteredData
      .filter(p => Number(p.from_facebook) > 0)
      .sort((a, b) => Number(b.from_facebook) - Number(a.from_facebook));
  } else if (filterSource === 'google') {
    filteredData = filteredData
      .filter(p => Number(p.from_google) > 0)
      .sort((a, b) => Number(b.from_google) - Number(a.from_google));
  } else if (filterSource === 'direct') {
    filteredData = filteredData
      .filter(p => Number(p.from_direct) > 0)
      .sort((a, b) => Number(b.from_direct) - Number(a.from_direct));
  }

  filteredData = filteredData.slice(0, limit);

  const getPageLabel = (path: string, pageTitle: string | null) => {
    if (path === '/') return 'Homepage';
    if (pageTitle) return pageTitle.replace(' | MusicScan', '').substring(0, 50);
    return path.substring(0, 50);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {filterSource === 'facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
          {filterSource === 'google' && <Search className="h-4 w-4 text-yellow-500" />}
          {filterSource === 'direct' && <MousePointer className="h-4 w-4 text-purple-500" />}
          {title || 'Top Pagina\'s'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredData.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Geen data beschikbaar</p>
          ) : (
            filteredData.map((page, index) => (
              <div 
                key={page.path} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getPageLabel(page.path, page.page_title)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{page.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {filterSource === 'facebook' ? (
                    <span className="font-medium text-blue-600">
                      {Number(page.from_facebook).toLocaleString()}
                    </span>
                  ) : filterSource === 'google' ? (
                    <span className="font-medium text-yellow-600">
                      {Number(page.from_google).toLocaleString()}
                    </span>
                  ) : filterSource === 'direct' ? (
                    <span className="font-medium text-purple-600">
                      {Number(page.from_direct).toLocaleString()}
                    </span>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Facebook className="h-3 w-3" />
                        <span>{Number(page.from_facebook)}</span>
                      </div>
                      <span className="font-medium">
                        {Number(page.view_count).toLocaleString()}
                      </span>
                    </>
                  )}
                  <a
                    href={page.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
