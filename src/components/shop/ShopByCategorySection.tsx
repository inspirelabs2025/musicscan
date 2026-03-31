import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

export function ShopByCategorySection() {
  const isMobile = useIsMobile();
  const { tr } = useLanguage();
  const sp = tr.shopPageUI;

  const categories = [
    { name: sp.catVinyl, emoji: "🎧", slug: "vinyl", description: sp.catVinylDesc },
    { name: sp.catCds, emoji: "💿", slug: "cd", description: sp.catCdsDesc },
    { name: sp.catArt, emoji: "🎨", slug: "art", description: sp.catArtDesc },
  ];

  if (isMobile) {
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <Link key={cat.slug} to={cat.slug === 'art' ? '/shop/art-prints' : cat.slug === 'merchandise' ? '/shop/merchandise' : cat.slug === 'buttons' ? '/shop/buttons' : `/shop?category=${cat.slug}`}>
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
        <Link key={cat.slug} to={cat.slug === 'art' ? '/shop/art-prints' : cat.slug === 'merchandise' ? '/shop/merchandise' : cat.slug === 'buttons' ? '/shop/buttons' : `/shop?category=${cat.slug}`}>
          <Card className="p-8 hover:shadow-2xl transition-all hover:scale-105 cursor-pointer group border-2 hover:border-primary h-full">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                {cat.emoji}
              </div>
              <h3 className="font-bold text-xl">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
              <div className="pt-2">
                <p className="text-lg font-bold text-vinyl-gold">{sp.fromPrice} €{cat.slug === 'art' ? '29,95' : cat.slug === 'merchandise' ? '24,95' : cat.slug === 'buttons' ? '4,50' : cat.slug === 'vinyl' ? '15' : '5'}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
