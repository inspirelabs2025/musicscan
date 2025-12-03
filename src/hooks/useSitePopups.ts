import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SitePopup {
  id: string;
  name: string;
  popup_type: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  image_url: string | null;
  trigger_type: 'time_on_page' | 'scroll_depth' | 'exit_intent' | 'page_visit';
  trigger_value: number | null;
  trigger_pages: string[] | null;
  exclude_pages: string[] | null;
  display_frequency: 'once_per_session' | 'once_per_day' | 'once_ever' | 'always';
  max_displays: number;
  priority: number;
  show_to_guests: boolean;
  show_to_users: boolean;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  views_count: number;
  clicks_count: number;
  dismissals_count: number;
  created_at: string;
  updated_at: string;
}

export function useSitePopups() {
  return useQuery({
    queryKey: ['site-popups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_popups')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as SitePopup[];
    },
  });
}

export function useActivePopups() {
  return useQuery({
    queryKey: ['active-popups'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('site_popups')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as SitePopup[];
    },
  });
}

export function useCreatePopup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (popup: Omit<SitePopup, 'id' | 'views_count' | 'clicks_count' | 'dismissals_count' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('site_popups')
        .insert(popup)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-popups'] });
      queryClient.invalidateQueries({ queryKey: ['active-popups'] });
    },
  });
}

export function useUpdatePopup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SitePopup> & { id: string }) => {
      const { data, error } = await supabase
        .from('site_popups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-popups'] });
      queryClient.invalidateQueries({ queryKey: ['active-popups'] });
    },
  });
}

export function useDeletePopup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('site_popups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-popups'] });
      queryClient.invalidateQueries({ queryKey: ['active-popups'] });
    },
  });
}

export function useIncrementPopupStat() {
  return useMutation({
    mutationFn: async ({ id, stat }: { id: string; stat: 'views_count' | 'clicks_count' | 'dismissals_count' }) => {
      const { error } = await supabase.rpc('increment_popup_stat', { 
        popup_id: id, 
        stat_name: stat 
      });
      
      // Fallback to manual increment if RPC doesn't exist
      if (error) {
        const { data: current } = await supabase
          .from('site_popups')
          .select(stat)
          .eq('id', id)
          .single();
        
        if (current) {
          await supabase
            .from('site_popups')
            .update({ [stat]: (current[stat] as number) + 1 })
            .eq('id', id);
        }
      }
    },
  });
}
