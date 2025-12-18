import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const ProductBanner = () => {
  const { data: products } = useQuery({
    queryKey: ['product-banner-preview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_products')
        .select('id,title,image_url,artist,price')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <section className="bg-primary py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Text + CTA */}
          <div className="text-center md:text-left flex-shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1 block">
              MusicScan Shop
            </span>
            <h3 className="text-xl md:text-2xl font-black text-white">
              Unieke Muziekproducten
            </h3>
          </div>

          {/* Center: Product Previews */}
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
            {products?.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded overflow-hidden ring-2 ring-white/20 hover:ring-white/60 transition-all hover:scale-105"
              >
                <img
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </Link>
            ))}
          </div>

          {/* Right: CTA Button */}
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold uppercase tracking-wide text-sm hover:bg-white/90 transition-colors"
          >
            Bekijk Shop
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
