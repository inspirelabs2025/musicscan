import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GuestOrder {
  id: string;
  buyer_email: string;
  buyer_name: string;
  seller_id: string;
  total_amount: number;
  shipping_cost: number;
  currency: string;
  status: string;
  payment_status: string;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  order_items?: any[];
}

export const useGuestOrderTracking = () => {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trackOrder = async (orderId: string, email: string) => {
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const { data, error: queryError } = await supabase
        .from('shop_orders')
        .select(`
          *,
          shop_order_items (*)
        `)
        .eq('id', orderId)
        .eq('buyer_email', email)
        .is('buyer_id', null)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          setError('Bestelling niet gevonden. Controleer je bestelnummer en e-mailadres.');
        } else {
          setError('Er ging iets mis bij het ophalen van de bestelling.');
        }
        return null;
      }

      setOrder(data as GuestOrder);
      return data as GuestOrder;
    } catch (err) {
      console.error('Order tracking error:', err);
      setError('Er ging iets mis bij het ophalen van de bestelling.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    order,
    error,
    trackOrder
  };
};