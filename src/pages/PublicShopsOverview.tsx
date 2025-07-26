import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Store, Users, Package, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface PublicShop {
  id: string;
  shop_name: string;
  shop_description: string;
  shop_url_slug: string;
  view_count: number;
  item_count: number;
  cd_count: number;
  vinyl_count: number;
}

const PublicShopsOverview = () => {
  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["public-shops-overview"],
    queryFn: async () => {
      // Get all public shops
      const { data: shopsData, error: shopsError } = await supabase
        .from("user_shops")
        .select("id, shop_name, shop_description, shop_url_slug, view_count, user_id")
        .eq("is_public", true);

      if (shopsError) throw shopsError;

      // Get item counts for each shop
      const shopsWithCounts: PublicShop[] = await Promise.all(
        (shopsData || []).map(async (shop) => {
          const [cdResult, vinylResult] = await Promise.all([
            supabase
              .from("cd_scan")
              .select("id", { count: "exact" })
              .eq("user_id", shop.user_id)
              .eq("is_public", true)
              .eq("is_for_sale", true),
            supabase
              .from("vinyl2_scan")
              .select("id", { count: "exact" })
              .eq("user_id", shop.user_id)
              .eq("is_public", true)
              .eq("is_for_sale", true)
          ]);

          const cd_count = cdResult.count || 0;
          const vinyl_count = vinylResult.count || 0;

          return {
            ...shop,
            cd_count,
            vinyl_count,
            item_count: cd_count + vinyl_count,
          };
        })
      );

      // Sort by item count, then by view count
      return shopsWithCounts
        .filter(shop => shop.item_count > 0)
        .sort((a, b) => b.item_count - a.item_count || b.view_count - a.view_count);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Openbare Winkels</h1>
          <p className="text-muted-foreground">
            Ontdek muziekwinkels en hun collecties
          </p>
          <div className="flex gap-4 mt-4">
            <Badge variant="secondary">
              {shops.length} winkels
            </Badge>
            <Badge variant="outline">
              {shops.reduce((total, shop) => total + shop.item_count, 0)} items te koop
            </Badge>
          </div>
        </div>

        {/* Shop Grid */}
        {shops.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nog geen openbare winkels beschikbaar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Card key={shop.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {shop.shop_name || 'Naamloze Winkel'}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {shop.shop_description || 'Geen beschrijving beschikbaar'}
                      </CardDescription>
                    </div>
                    <Store className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {shop.item_count} items
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {shop.view_count} bezoekers
                      </span>
                    </div>
                  </div>

                  {/* Format breakdown */}
                  <div className="flex gap-2">
                    {shop.cd_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {shop.cd_count} CD's
                      </Badge>
                    )}
                    {shop.vinyl_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {shop.vinyl_count} LP's
                      </Badge>
                    )}
                  </div>

                  {/* Visit button */}
                  <Button asChild className="w-full">
                    <Link to={`/shop/${shop.shop_url_slug}`}>
                      Bezoek Winkel
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicShopsOverview;