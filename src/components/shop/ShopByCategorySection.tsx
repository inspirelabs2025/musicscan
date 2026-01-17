import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const categories = [
  { 
    name: "Vinyl", 
    emoji: "🎧", 
    slug: "vinyl",
    description: "LP's en singles"
  },
  { 
    name: "CD's", 
    emoji: "💿", 
    slug: "cd",
    description: "Albums en boxsets"
  },
  { 
    name: "Merchandise", 
    emoji: "🎁", 
    slug: "merchandise",
    description: "T-shirts"
  },
  { 
    name: "Art", 
    emoji: "🎨", 
    slug: "art",
    description: "Kunstwerken"
  },
];

export function ShopByCategorySection() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <Link key={cat.slug} to={cat.slug === 'art' ? '/art-shop' : cat.slug === 'merchandise' ? '/merchandise' : cat.slug === 'buttons' ? '/buttons' : `/shop?category=${cat.slug}`}>
            <Card className="px-4 py-2 hover:shadow-md transition-all hover:scale-105 cursor-pointer group border hover:border-primary">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.emoji}</span>
                <span className="font-medium text-sm">{cat.name}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {categories.map((cat) => (
        <Link key={cat.slug} to={cat.slug === 'art' ? '/art-shop' : cat.slug === 'merchandise' ? '/merchandise' : cat.slug === 'buttons' ? '/buttons' : `/shop?category=${cat.slug}`}>
          <Card className="p-8 hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group border-2 hover:border-primary h-full">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                {cat.emoji}
              </div>
              <h3 className="font-bold text-xl">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
              <div className="pt-2">
                <p className="text-lg font-bold text-vinyl-gold">Vanaf €{cat.slug === 'art' ? '29,95' : cat.slug === 'merchandise' ? '24,95' : cat.slug === 'buttons' ? '4,50' : cat.slug === 'vinyl' ? '15' : '5'}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
