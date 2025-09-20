import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { usePublicCollection } from "@/hooks/usePublicCollection";
import { useUserCollectionStats } from "@/hooks/useUserCollectionStats";
import { Disc3, Music2, Euro, TrendingUp, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface CollectionSummaryWidgetProps {
  userId: string;
}

export const CollectionSummaryWidget: React.FC<CollectionSummaryWidgetProps> = ({ userId }) => {
  const { items, isLoading } = usePublicCollection(userId);
  const { data: stats, isLoading: statsLoading } = useUserCollectionStats(userId);

  if (isLoading || statsLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5" />
            Collectie Overzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Geen openbare collectie-items gevonden.
          </p>
        </CardContent>
      </Card>
    );
  }

  const topGenres = Object.entries(stats.genreCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5" />
            Collectie Overzicht
          </CardTitle>
          <Link to={`/collection/${userId}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Bekijk Volledig
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Totaal Items"
            value={stats.totalItems}
            icon={Disc3}
            subtitle={`${stats.totalCDs} CDs • ${stats.totalVinyls} Vinyl`}
          />
          {stats.totalValue > 0 && (
            <StatCard
              title="Geschatte Waarde"
              value={formatCurrency(stats.totalValue)}
              icon={Euro}
              subtitle={`Ø ${formatCurrency(stats.averageValue)}`}
            />
          )}
        </div>

        {/* Top Genres */}
        {topGenres.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Favoriete Genres
            </h4>
            <div className="flex flex-wrap gap-2">
              {topGenres.map(([genre, count]) => (
                <Badge key={genre} variant="secondary" className="text-xs">
                  {genre} ({count as number})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Collection Highlights */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium mb-2">Collectie Highlights</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>📅 Oudste item: {stats.oldestYear || "Onbekend"}</div>
            <div>🆕 Nieuwste item: {stats.newestYear || "Onbekend"}</div>
            {stats.mostValuableItem && (
              <div>💎 Waardevolste: {stats.mostValuableItem.artist} - {stats.mostValuableItem.title}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};