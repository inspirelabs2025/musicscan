import { usePlatformProducts } from "@/hooks/usePlatformProducts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

export function NewArrivalsSection() {
  const { data: products = [], isLoading } = usePlatformProducts({ 
    limit: 8 
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Binnenkort nieuwe producten!</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Link key={product.id} to={`/shop/product/${product.slug}`}>
          <Card className="overflow-hidden hover:shadow-lg transition-all group">
            <div className="relative aspect-square bg-muted">
              {product.primary_image ? (
                <img
                  src={product.primary_image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Geen afbeelding
                </div>
              )}
              
              {product.is_new && (
                <Badge className="absolute top-2 left-2 bg-primary">NIEUW</Badge>
              )}
              {product.is_on_sale && (
                <Badge className="absolute top-2 right-2 bg-destructive">SALE</Badge>
              )}
            </div>
            
            <div className="p-4 space-y-2">
              <div className="min-h-[2.5rem]">
                {product.artist && (
                  <p className="text-xs text-muted-foreground truncate">{product.artist}</p>
                )}
                <h3 className="font-semibold line-clamp-1">{product.title}</h3>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">{product.currency}{product.price}</span>
                  {product.compare_at_price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {product.currency}{product.compare_at_price}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">{product.media_type}</Badge>
              </div>

              <Button size="sm" className="w-full" variant="outline">
                <ShoppingCart className="h-3 w-3 mr-2" />
                Bekijk
              </Button>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
