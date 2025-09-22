import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useShopViewCounter = () => {
  const incrementViewCount = useMutation({
    mutationFn: async (shopSlug: string) => {
      const { error } = await supabase.rpc('increment_shop_view_count', {
        shop_slug: shopSlug
      });
      
      if (error) throw error;
    },
  });

  return {
    incrementViewCount: incrementViewCount.mutate,
  };
};