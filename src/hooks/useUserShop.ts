import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserShop {
  id: string;
  user_id: string;
  shop_name: string | null;
  shop_description: string | null;
  is_public: boolean;
  contact_info: string | null;
  shop_url_slug: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export const useUserShop = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: shop, isLoading } = useQuery({
    queryKey: ["user-shop", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_shops")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data as UserShop | null;
    },
    enabled: !!user?.id,
  });

  const updateShopMutation = useMutation({
    mutationFn: async (shopData: Partial<UserShop>) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (shop) {
        // Update existing shop
        const { data, error } = await supabase
          .from("user_shops")
          .update(shopData)
          .eq("id", shop.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new shop
        const { data, error } = await supabase
          .from("user_shops")
          .insert({ ...shopData, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-shop", user?.id] });
    },
  });

  return {
    shop,
    isLoading,
    updateShop: updateShopMutation.mutate,
    isUpdating: updateShopMutation.isPending,
  };
};