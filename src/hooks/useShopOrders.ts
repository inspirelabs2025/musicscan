import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ShopOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  shipping_cost: number;
  currency: string;
  status: string;
  payment_status: string;
  buyer_email: string;
  buyer_name: string;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  order_items?: ShopOrderItem[];
}

export interface ShopOrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_type: string;
  price: number;
  quantity: number;
  item_data: any;
  created_at: string;
}

export const useShopOrders = (type: 'purchases' | 'sales' = 'purchases') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shop-orders', type, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const column = type === 'purchases' ? 'buyer_id' : 'seller_id';
      
      const { data, error } = await supabase
        .from('shop_orders')
        .select(`
          *,
          shop_order_items (*)
        `)
        .eq(column, user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShopOrder[];
    },
    enabled: !!user?.id,
  });
};

export const useShopOrder = (orderId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shop-order', orderId],
    queryFn: async () => {
      if (!orderId || !user?.id) return null;

      const { data, error } = await supabase
        .from('shop_orders')
        .select(`
          *,
          shop_order_items (*)
        `)
        .eq('id', orderId)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .single();

      if (error) throw error;
      return data as ShopOrder;
    },
    enabled: !!orderId && !!user?.id,
  });
};