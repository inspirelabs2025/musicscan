import { Link } from 'react-router-dom';
import { Image, Frame, Disc, Shirt, CircleDot, ArrowRight } from 'lucide-react';

const SHOP_CATEGORIES = [
  { icon: Image, label: 'Art Prints', href: '/art-prints' },
  { icon: Frame, label: 'Canvas', href: '/canvas' },
  { icon: Disc, label: 'Metal Prints', href: '/metal-prints' },
  { icon: Shirt, label: 'T-shirts', href: '/shirts' },
  { icon: CircleDot, label: 'Buttons', href: '/buttons' },
];

export const ShopCategoriesFooter = () => {
  return (
    <section className="bg-zinc-900 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
              Shop
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              MusicScan Producten
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold uppercase tracking-wide hover:bg-primary/90 transition-colors"
          >
            Bekijk Alles
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {SHOP_CATEGORIES.map((category) => (
            <Link
              key={category.href}
              to={category.href}
              className="group flex flex-col items-center text-center p-6 md:p-8 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                <category.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors">
                {category.label}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
