import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PublicShop from "./PublicShop";

// Route guard that resolves ambiguous /shop/:slug
// If :slug is a platform product slug, redirect to /product/:slug
// Else render the PublicShop page (user shop)
export default function ShopOrProductRouter() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      if (!shopSlug) return;
      // First, check if this slug matches a platform product
      const { data: product } = await supabase
        .from('platform_products')
        .select('id, slug')
        .eq('slug', shopSlug)
        .single();

      if (!isMounted) return;

      if (product?.slug) {
        navigate(`/product/${product.slug}`, { replace: true });
      }
      // else: keep rendering the PublicShop below
    };
    check();
    return () => { isMounted = false; };
  }, [shopSlug, navigate]);

  return <PublicShop />;
}
