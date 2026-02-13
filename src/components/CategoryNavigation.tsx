import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Palette, Frame } from "lucide-react";

interface CategoryNavigationProps {
  currentCategory: 'metal' | 'poster' | 'canvas';
  metalPrintsCount: number;
  postersCount: number;
  canvasCount?: number;
  metalPrintsMinPrice: number;
  postersMinPrice: number;
  canvasMinPrice?: number;
}

export const CategoryNavigation = ({
  currentCategory,
  metalPrintsCount,
  postersCount,
  canvasCount = 0,
  metalPrintsMinPrice,
  postersMinPrice,
  canvasMinPrice = 0
}: CategoryNavigationProps) => {
  const categories = [
    {
      id: 'metal',
      name: 'Metaalprints',
      description: 'Premium prints op aluminium',
      icon: Sparkles,
      count: metalPrintsCount,
      minPrice: metalPrintsMinPrice,
      url: '/art-shop',
      active: currentCategory === 'metal'
    },
    {
      id: 'poster',
      name: 'Posters',
      description: 'Unieke kunst posters',
      icon: Palette,
      count: postersCount,
      minPrice: postersMinPrice,
      url: '/posters',
      active: currentCategory === 'poster'
    },
    {
      id: 'canvas',
      name: 'Canvas Doeken',
      description: 'Warm grayscale canvas',
      icon: Frame,
      count: canvasCount,
      minPrice: canvasMinPrice,
      url: '/canvas',
      active: currentCategory === 'canvas'
    }
  ].filter(cat => cat.id === currentCategory || cat.count > 0);

  return (
    <div className="mb-0">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Kies je kunststijl</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          
          if (category.active) {
            return (
              <Card
                key={category.id}
                className="p-4 md:p-6 border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl cursor-default"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg">{category.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {category.description} · <span className="text-vinyl-gold font-semibold">vanaf €{category.minPrice.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          }
          
          return (
            <Link key={category.id} to={category.url}>
              <Card className="p-4 md:p-6 border-2 border-border hover:border-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {category.description} · <span className="text-vinyl-gold font-semibold">vanaf €{category.minPrice.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
