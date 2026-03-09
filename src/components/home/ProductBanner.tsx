import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { optimizeImageUrl, generateArtworkAlt } from '@/lib/image-utils';

export const ProductBanner = () => {
  const { tr } = useLanguage();
  const h = tr.homeUI;

  const { data: products } = useQuery({
    queryKey: ['product-banner-preview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_products')
        .select('id,title,primary_image,artist,price,slug')
        .eq('status', 'active')
        .not('primary_image', 'is', null)
        .order('created_at', { ascending: false })
        .limit(4);
      return (data || []).filter((p) => !!p.primary_image);
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <section className="bg-primary py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left flex-shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70 mb-1 block">
              MusicScan Shop
            </span>
            <h3 className="text-xl md:text-2xl font-black text-primary-foreground">
              {h.uniqueProducts}
            </h3>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
            {products?.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug || product.id}`}
                className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden ring-2 ring-primary-foreground/20 hover:ring-primary-foreground/60 transition-all hover:scale-105"
              >
                <img
                  src={optimizeImageUrl(product.primary_image!, { width: 96, height: 96 })}
                  alt={generateArtworkAlt(product.artist || '', product.title, 'product')}
                  loading="lazy"
                  decoding="async"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </Link>
            ))}
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-foreground text-primary font-bold uppercase tracking-wide text-sm hover:bg-primary-foreground/90 transition-colors rounded-lg"
          >
            {h.viewShop}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
