import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TimeMachineProduct {
  id: string;
  title: string;
  slug: string;
  artist: string;
  price: number;
  primary_image: string;
  media_type: string;
  stock_quantity: number;
  metadata: any;
}

export const useTimeMachineProducts = (eventId?: string) => {
  return useQuery({
    queryKey: ['time-machine-products', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('platform_products')
        .select('*')
        .contains('metadata', { time_machine_event_id: eventId })
        .eq('status', 'active')
        .order('price', { ascending: true });

      if (error) throw error;
      return data as TimeMachineProduct[];
    },
    enabled: !!eventId,
  });
};
