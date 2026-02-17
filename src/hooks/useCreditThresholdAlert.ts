import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useCallback, useRef } from 'react';

/**
 * Shows user-facing toast warnings when credits drop below 25%, 10%, or 0%.
 * Also logs admin alerts for visibility in the admin dashboard.
 * Deduplicates per session so each threshold is only shown once.
 */
export function useCreditThresholdAlert() {
  const { user } = useAuth();
  const { toast } = useToast();
  const shownThresholds = useRef<Set<number>>(new Set());

  const checkAndAlert = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) return;

      const { balance, total_earned } = data;
      if (total_earned <= 0) return;

      const percentage = (balance / total_earned) * 100;

      // Check thresholds from lowest to highest
      const thresholds = [
        { pct: 0, label: 'Op', variant: 'destructive' as const, emoji: '🚨', msg: 'Je scan credits zijn op! Koop nieuwe credits om verder te scannen.' },
        { pct: 10, label: '10%', variant: 'destructive' as const, emoji: '⚠️', msg: 'Je hebt nog maar 10% van je credits over. Overweeg om bij te kopen.' },
        { pct: 25, label: '25%', variant: 'default' as const, emoji: '📊', msg: `Je hebt nog ${balance} credits over (25%). Tijd om bij te vullen?` },
      ];

      for (const t of thresholds) {
        if (percentage <= t.pct && !shownThresholds.current.has(t.pct)) {
          shownThresholds.current.add(t.pct);

          toast({
            title: `${t.emoji} Credits: ${balance} resterend`,
            description: t.msg,
            variant: t.variant === 'destructive' ? 'destructive' : undefined,
            duration: t.pct === 0 ? 10000 : 6000,
          });

          // Log admin alert (fire-and-forget)
          const alertType = t.pct === 0 ? 'credit_depleted' : 'credit_low';
          try {
            await supabase.rpc('insert_admin_alert_if_new', {
              p_alert_type: alertType,
              p_source_function: 'client-credit-check',
              p_message: `Credits alert: gebruiker heeft nog ${balance} credits (${Math.round(percentage)}%). Drempel: ${t.label}.`,
              p_metadata: { user_id: user.id, balance, total_earned, threshold: t.pct },
            });
          } catch (_) { /* ignore */ }

          break; // Only show the most critical threshold
        }
      }
    } catch (err) {
      console.error('[credit-threshold] Check failed:', err);
    }
  }, [user, toast]);

  return { checkAndAlert };
}
