import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminShopOrder {
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
  shop_order_items?: any[];
  buyer?: {
    user_id: string;
    first_name: string;
    email: string;
    avatar_url?: string;
  };
  seller?: {
    user_id: string;
    first_name: string;
    email: string;
    avatar_url?: string;
  };
}

export const useAdminShopOrders = () => {
  return useQuery({
    queryKey: ['admin-shop-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-shop-orders');
      
      if (error) throw error;
      return data.orders as AdminShopOrder[];
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ orderId, status, paymentStatus }: { 
      orderId: string; 
      status?: string; 
      paymentStatus?: string;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (paymentStatus) updates.payment_status = paymentStatus;

      const { error } = await supabase
        .from('shop_orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shop-orders'] });
      toast({
        title: "Order bijgewerkt",
        description: "De order status is succesvol bijgewerkt",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useOrderStatistics = (orders?: AdminShopOrder[]) => {
  if (!orders) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalRevenue: orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + o.total_amount, 0),
    ordersToday: orders.filter(o => new Date(o.created_at) >= today).length,
  };
};
