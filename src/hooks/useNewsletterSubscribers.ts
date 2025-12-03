import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  source: string | null;
  source_page: string | null;
  is_confirmed: boolean;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  welcome_email_sent: boolean;
  welcome_email_sent_at: string | null;
  created_at: string;
}

export function useNewsletterSubscribers() {
  const queryClient = useQueryClient();

  const { data: subscribers, isLoading, error } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      
      if (error) throw error;
      return data as NewsletterSubscriber[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['newsletter-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('subscribed_at, source, unsubscribed_at');
      
      if (error) throw error;
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const total = data?.length || 0;
      const active = data?.filter(s => !s.unsubscribed_at).length || 0;
      const thisWeek = data?.filter(s => new Date(s.subscribed_at) >= weekAgo).length || 0;
      const thisMonth = data?.filter(s => new Date(s.subscribed_at) >= monthAgo).length || 0;
      
      // Group by source
      const bySource = data?.reduce((acc, s) => {
        const source = s.source || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return { total, active, thisWeek, thisMonth, bySource };
    },
  });

  const deleteSubscriber = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] });
    },
  });

  const unsubscribe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] });
    },
  });

  const exportToCsv = () => {
    if (!subscribers?.length) return;
    
    const headers = ['Email', 'Ingeschreven op', 'Bron', 'Pagina', 'Status'];
    const rows = subscribers.map(s => [
      s.email,
      new Date(s.subscribed_at).toLocaleDateString('nl-NL'),
      s.source || '',
      s.source_page || '',
      s.unsubscribed_at ? 'Uitgeschreven' : 'Actief'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return {
    subscribers,
    stats,
    isLoading,
    error,
    deleteSubscriber,
    unsubscribe,
    exportToCsv,
  };
}
