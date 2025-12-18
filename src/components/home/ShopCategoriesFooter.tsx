import { Link } from 'react-router-dom';
import { Image, Frame, Disc, Shirt, CircleDot, ShoppingBag } from 'lucide-react';

const SHOP_CATEGORIES = [
  { icon: Image, label: 'Art Prints', href: '/art-prints', description: 'Unieke album art posters' },
  { icon: Frame, label: 'Canvas Doeken', href: '/canvas', description: 'Premium canvas prints' },
  { icon: Disc, label: 'Metal Prints', href: '/metal-prints', description: 'Duurzame metal art' },
  { icon: Shirt, label: 'T-shirts', href: '/shirts', description: 'Album-inspired fashion' },
  { icon: CircleDot, label: 'Buttons', href: '/buttons', description: 'Collectible badges' },
  { icon: ShoppingBag, label: 'Alle Producten', href: '/shop', description: 'Bekijk alles' },
];

export const ShopCategoriesFooter = () => {
  return (
    <section className="py-12 md:py-16 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            MusicScan Shop
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ontdek onze collectie muziekproducten, van klassieke albumart tot moderne designs
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {SHOP_CATEGORIES.map((category) => (
            <Link
              key={category.href}
              to={category.href}
              className="group flex flex-col items-center text-center p-6 rounded-xl bg-background hover:bg-primary/5 border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <category.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {category.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                {category.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl hover:shadow-primary/20"
          >
            <ShoppingBag className="w-5 h-5" />
            Bekijk de volledige shop
          </Link>
        </div>
      </div>
    </section>
  );
};
