import { Link } from 'react-router-dom';
import { ArrowRight, Image, Shirt, Frame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PRODUCT_CATEGORIES = [
  { 
    icon: Image, 
    label: 'Posters', 
    href: '/posters',
    mediaType: 'art'
  },
  { 
    icon: Frame, 
    label: 'Canvas', 
    href: '/canvas',
    mediaType: 'canvas'
  },
  { 
    icon: Shirt, 
    label: 'T-shirts', 
    href: '/shirts',
    mediaType: 'tshirts'
  },
];

export const ProductBanner = () => {
  // Fetch a few featured products for preview
  const { data: products } = useQuery({
    queryKey: ['product-banner-preview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_products')
        .select('id,title,image_url')
        .eq('is_active', true)
        .limit(3);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <section className="py-8 md:py-10 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Text + CTA */}
          <div className="text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              Unieke Muziekproducten
            </h3>
            <p className="text-muted-foreground mb-4">
              Van albumart geïnspireerde posters, canvas en meer
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Bekijk Shop
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Center: Category Quick Links */}
          <div className="flex gap-4">
            {PRODUCT_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                to={cat.href}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-primary/10 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <cat.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
              </Link>
            ))}
          </div>

          {/* Right: Product Previews */}
          <div className="hidden lg:flex gap-2">
            {products?.slice(0, 3).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="w-16 h-16 rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
              >
                <img
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
