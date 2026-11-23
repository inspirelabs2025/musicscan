import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { playAlertSound } from '@/lib/tradingSound';

/**
 * Listens for new Trading Desk alerts while the site is open: shows a toast,
 * plays the chime (if enabled) and a system notification when the tab is in
 * the background.
 */
export function TradingAlertListener() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const soundRef = useRef(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (supabase as any).from('trading_alert_preferences').select('sound_enabled').eq('user_id', user.id).maybeSingle()
      .then(({ data }: any) => { if (!cancelled) soundRef.current = data?.sound_enabled ?? true; });

    const channel = supabase
      .channel(`trading-alerts-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trading_alerts', filter: `user_id=eq.${user.id}` }, (payload) => {
        const a = payload.new as { title: string; body?: string; link?: string };
        qc.invalidateQueries({ queryKey: ['trading', 'alerts'] });
        if (soundRef.current) playAlertSound();
        const go = () => {
          if (!a.link) return;
          if (a.link.startsWith('http')) window.open(a.link, '_blank', 'noopener');
          else navigate(a.link);
        };
        toast(a.title, { description: a.body, action: a.link ? { label: 'Bekijk', onClick: go } : undefined });
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const n = new Notification(a.title, { body: a.body, icon: '/favicon-32x32.png', tag: a.title });
            n.onclick = () => { window.focus(); go(); n.close(); };
          } catch { /* some mobile browsers only allow notifications via a service worker */ }
        }
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user, qc, navigate]);

  return null;
}
