import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Music2, Disc3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RelatedContentProps {
  artist?: string;
  genre?: string;
  year?: number | string;
  excludeId?: string;
  limit?: number;
}

export const RelatedContent: React.FC<RelatedContentProps> = ({
  artist,
  genre,
  year,
  excludeId,
  limit = 6
}) => {
  const { data: relatedReleases, isLoading } = useQuery({
    queryKey: ['related-content', artist, genre, year, excludeId],
    queryFn: async () => {
      if (!artist && !genre && !year) return [];

      let query = supabase
        .from('releases')
        .select('id, artist, title, year, genre, format, total_scans')
        .limit(limit);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      // Priority: same artist > same genre > similar year
      if (artist) {
        const { data } = await query
          .ilike('artist', `%${artist}%`)
          .limit(limit * 2);
        if (data && data.length > 0) {
          // Shuffle and take limit
          return data.sort(() => Math.random() - 0.5).slice(0, limit);
        }
      }

      if (genre) {
        const { data } = await query
          .ilike('genre', `%${genre}%`)
          .limit(limit * 2);
        if (data && data.length > 0) {
          return data.sort(() => Math.random() - 0.5).slice(0, limit);
        }
      }

      if (year) {
        const yearNum = typeof year === 'string' ? parseInt(year) : year;
        const { data } = await query
          .gte('year', yearNum - 2)
          .lte('year', yearNum + 2)
          .limit(limit * 2);
        if (data && data.length > 0) {
          return data.sort(() => Math.random() - 0.5).slice(0, limit);
        }
      }

      return [];
    },
    enabled: !!(artist || genre || year)
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5" />
            Gerelateerde Albums
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!relatedReleases || relatedReleases.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="h-5 w-5" />
          Gerelateerde Albums
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {relatedReleases.map((release) => (
          <Link
            key={release.id}
            to={`/release/${release.id}`}
            className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{release.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{release.artist}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {release.year && (
                    <Badge variant="outline" className="text-xs">{release.year}</Badge>
                  )}
                  {release.format && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Disc3 className="h-3 w-3" />
                      {release.format}
                    </Badge>
                  )}
                </div>
              </div>
              {release.total_scans > 0 && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {release.total_scans}x
                </Badge>
              )}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
