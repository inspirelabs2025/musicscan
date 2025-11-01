import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

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
    name: "Boxsets", 
    emoji: "📦", 
    slug: "boxset",
    description: "Luxe verzamelingen"
  },
  { 
    name: "Merchandise", 
    emoji: "🎁", 
    slug: "merchandise",
    description: "Posters & meer"
  },
  { 
    name: "Art", 
    emoji: "🎨", 
    slug: "art",
    description: "Kunstwerken"
  },
];

export function ShopByCategorySection() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <Link key={cat.slug} to={`/shop?category=${cat.slug}`}>
          <Card className="p-6 hover:shadow-lg transition-all hover:scale-105 cursor-pointer group">
            <div className="text-center space-y-2">
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                {cat.emoji}
              </div>
              <h3 className="font-bold text-lg">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
