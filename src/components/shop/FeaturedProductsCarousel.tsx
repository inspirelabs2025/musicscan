import { usePlatformProducts } from "@/hooks/usePlatformProducts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function FeaturedProductsCarousel() {
  const { data: products = [], isLoading } = usePlatformProducts({ 
    featured: true,
    limit: 8 
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
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
    return null;
  }

  return (
    <div className="relative">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-1 md:-ml-4">
          {products.map((product) => (
            <CarouselItem key={product.id} className="pl-1 md:pl-4 basis-[45%] md:basis-1/3 lg:basis-1/4">
              <Link to={`/product/${product.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all group">
                  <div className="relative aspect-square bg-muted">
                    {product.primary_image ? (
                      <img
                        src={product.primary_image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        Geen afbeelding
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-1 left-1 md:top-2 md:left-2 flex flex-col gap-1">
                      {product.is_new && (
                        <Badge className="bg-primary text-xs">NIEUW</Badge>
                      )}
                      {product.is_on_sale && (
                        <Badge className="bg-destructive text-xs">SALE</Badge>
                      )}
                    </div>

                    {product.stock_quantity <= 3 && (
                      <Badge className="absolute bottom-1 left-1 md:bottom-2 md:left-2 bg-orange-500 text-xs">
                        Laatste {product.stock_quantity}!
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-2 md:p-4 space-y-1 md:space-y-2">
                    <div className="min-h-[2rem] md:min-h-[2.5rem]">
                      {product.artist && (
                        <p className="text-xs text-muted-foreground truncate">{product.artist}</p>
                      )}
                      <h3 className="font-semibold line-clamp-1 text-xs md:text-sm">{product.title}</h3>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1 md:gap-2">
                        <span className="text-sm md:text-lg font-bold">{product.currency}{product.price}</span>
                        {product.compare_at_price && (
                          <span className="text-xs text-muted-foreground line-through">
                            {product.currency}{product.compare_at_price}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button size="sm" className="w-full text-xs" variant="outline">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Bekijk
                    </Button>
                  </div>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
}
