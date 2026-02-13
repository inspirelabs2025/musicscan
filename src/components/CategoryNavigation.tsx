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
    <div>
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          
          if (category.active) {
            return (
              <Card
                key={category.id}
                className="p-2.5 md:p-6 border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl cursor-default h-full"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="hidden md:block p-2 rounded-lg bg-primary/20">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs md:text-lg leading-tight">{category.name}</h3>
                    <p className="hidden md:block text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <p className="text-[10px] md:text-sm text-vinyl-gold font-semibold mt-0.5">
                      vanaf €{category.minPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          }
          
          return (
            <Link key={category.id} to={category.url} className="h-full">
              <Card className="p-2.5 md:p-6 border-2 border-border hover:border-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group h-full">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="hidden md:block p-2 rounded-lg bg-muted group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs md:text-lg leading-tight group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="hidden md:block text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <p className="text-[10px] md:text-sm text-vinyl-gold font-semibold mt-0.5">
                      vanaf €{category.minPrice.toFixed(2)}
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
