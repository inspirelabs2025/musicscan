import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  AlertPrefs, AutoPriceRule, InventoryItem, PriceSnapshot, TradingAlert, WantlistItem,
} from '@/lib/trading';
import { ALERT_TYPES } from '@/lib/trading';

// New tables are not yet in the generated types; keep access in one place.
const db = supabase as any;

async function invoke(fn: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
    let msg = details;
    try { msg = JSON.parse(details).error ?? details; } catch { /* plain text */ }
    throw new Error(msg);
  }
  return data;
}

export const useDiscogsLinked = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trading', 'linked', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from('discogs_user_tokens').select('discogs_username').eq('user_id', user!.id).maybeSingle();
      return data?.discogs_username as string | undefined ?? null;
    },
  });
};

export const useTradingInventory = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trading', 'inventory', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await db.from('trading_inventory_items').select('*')
        .eq('user_id', user!.id).order('deviation_pct', { ascending: false, nullsFirst: false }).limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useTradingWantlist = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trading', 'wantlist', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WantlistItem[]> => {
      const { data, error } = await db.from('trading_wantlist_items').select('*')
        .eq('user_id', user!.id).order('num_for_sale', { ascending: false, nullsFirst: false }).limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const usePriceSnapshots = (releaseIds: number[], days = 30) => {
  const key = [...releaseIds].sort().join(',');
  return useQuery({
    queryKey: ['trading', 'snapshots', key, days],
    enabled: releaseIds.length > 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<PriceSnapshot[]> => {
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      const out: PriceSnapshot[] = [];
      for (let i = 0; i < releaseIds.length; i += 200) {
        const { data, error } = await db.from('trading_price_snapshots')
          .select('release_id, condition, suggested_price, lowest_price, num_for_sale, currency, captured_at')
          .in('release_id', releaseIds.slice(i, i + 200)).gte('captured_at', since)
          .order('captured_at', { ascending: true }).limit(5000);
        if (error) throw error;
        out.push(...(data ?? []));
      }
      return out;
    },
  });
};

export const useTradingAlerts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trading', 'alerts', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<TradingAlert[]> => {
      const { data, error } = await db.from('trading_alerts').select('*')
        .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useMarkAlertsRead = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      let q = db.from('trading_alerts').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false);
      if (ids?.length) q = q.in('id', ids);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trading', 'alerts'] }),
  });
};

export const defaultPrefs = (userId: string): AlertPrefs => ({
  user_id: userId,
  enabled_types: ALERT_TYPES.map((a) => a.type),
  sound_enabled: true,
  push_enabled: true,
  threshold_pct: 10,
  share_wantlist: true,
});

export const useAlertPrefs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trading', 'prefs', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AlertPrefs & { saved: boolean }> => {
      const { data } = await db.from('trading_alert_preferences').select('*').eq('user_id', user!.id).maybeSingle();
      return data ? { ...data, saved: true } : { ...defaultPrefs(user!.id), saved: false };
    },
  });
};

export const useSaveAlertPrefs = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<AlertPrefs>) => {
      const current = qc.getQueryData<AlertPrefs>(['trading', 'prefs', user?.id]) ?? defaultPrefs(user!.id);
      const row = { ...defaultPrefs(user!.id), ...current, ...p, user_id: user!.id };
      delete (row as any).saved; delete (row as any).created_at; delete (row as any).updated_at;
      const { error } = await db.from('trading_alert_preferences').upsert(row, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trading', 'prefs'] }),
  });
};

export const useAutoPriceRules = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trading', 'rules', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AutoPriceRule[]> => {
      const { data, error } = await db.from('trading_auto_price_rules').select('*').eq('user_id', user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useSaveAutoPriceRule = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Partial<AutoPriceRule> & { inventory_item_id: string; min_price: number }) => {
      if (!(r.min_price > 0)) throw new Error('Stel een minimumprijs in die hoger is dan 0');
      if (r.max_price != null && r.max_price < r.min_price) throw new Error('Maximumprijs moet hoger zijn dan de minimumprijs');
      const row = { ...r, user_id: user!.id };
      delete (row as any).id; delete (row as any).created_at; delete (row as any).updated_at; delete (row as any).last_applied_at;
      const { error } = await db.from('trading_auto_price_rules').upsert(row, { onConflict: 'inventory_item_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trading', 'rules'] }),
  });
};

export const usePriceAdjustments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trading', 'adjustments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from('trading_price_adjustments_log').select('*')
        .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useAutoPriceAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { action: 'preview' | 'apply_now' | 'revert'; logId?: string }) => invoke('trading-auto-price', body),
    onSuccess: (_d, v) => { if (v.action !== 'preview') qc.invalidateQueries({ queryKey: ['trading'] }); },
  });
};

/** Pull fresh data from Discogs now: listings + wantlist, then market prices. */
export const useRefreshTrading = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const sync = await invoke('trading-sync');
      const market = await invoke('trading-market-check');
      return { sync, market };
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['trading'] }),
  });
};

export const useMatchProfiles = (userIds: string[]) => {
  const key = [...new Set(userIds)].sort().join(',');
  return useQuery({
    queryKey: ['trading', 'match-profiles', key],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await db.from('profiles').select('user_id, first_name, avatar_url').in('user_id', [...new Set(userIds)]);
      return new Map<string, { first_name: string | null; avatar_url: string | null }>((data ?? []).map((p: any) => [p.user_id, p]));
    },
  });
};

/** Find or start a 1-on-1 conversation with another user, optionally with a first message. */
export async function openConversationWith(myId: string, otherId: string, firstMessage?: string) {
  const { data: mine } = await db.from('conversation_participants').select('conversation_id').eq('user_id', myId);
  const myConvs = (mine ?? []).map((r: any) => r.conversation_id);
  if (myConvs.length) {
    const { data: shared } = await db.from('conversation_participants').select('conversation_id')
      .eq('user_id', otherId).in('conversation_id', myConvs);
    if (shared?.length) {
      const { data: conv } = await db.from('conversations').select('id, is_group').in('id', shared.map((s: any) => s.conversation_id)).eq('is_group', false).limit(1);
      if (conv?.[0]) {
        if (firstMessage) await db.from('messages').insert({ conversation_id: conv[0].id, sender_id: myId, content: firstMessage, message_type: 'text' });
        return conv[0].id as string;
      }
    }
  }
  const { data: conv, error } = await db.from('conversations').insert({ created_by: myId, is_group: false }).select().single();
  if (error) throw error;
  const { error: pErr } = await db.from('conversation_participants').insert([
    { conversation_id: conv.id, user_id: myId }, { conversation_id: conv.id, user_id: otherId },
  ]);
  if (pErr) throw pErr;
  if (firstMessage) await db.from('messages').insert({ conversation_id: conv.id, sender_id: myId, content: firstMessage, message_type: 'text' });
  return conv.id as string;
}

export interface CollectionItem {
  id: string; kind: 'vinyl' | 'cd'; release_id: number; artist: string | null; title: string | null;
  thumb: string | null; condition: string | null; value: number | null; lowest_price: number | null;
}

/** Scanned records (vinyl + cd) that have a Discogs release id, for collection price tracking. */
export const useTradingCollection = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trading-collection', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CollectionItem[]> => {
      const cols = 'id, discogs_id, artist, title, condition_grade, calculated_advice_price, median_price, lowest_price';
      const [v, c] = await Promise.all([
        db.from('vinyl2_scan').select(cols).eq('user_id', user!.id).not('discogs_id', 'is', null).limit(500),
        db.from('cd_scan').select(cols + ', front_image').eq('user_id', user!.id).not('discogs_id', 'is', null).limit(500),
      ]);
      const map = (kind: 'vinyl' | 'cd') => (r: any): CollectionItem => ({
        id: r.id, kind, release_id: Number(r.discogs_id), artist: r.artist, title: r.title, thumb: r.front_image ?? null,
        condition: r.condition_grade, value: r.calculated_advice_price ?? r.median_price ?? null, lowest_price: r.lowest_price ?? null,
      });
      return [...(v.data ?? []).map(map('vinyl')), ...(c.data ?? []).map(map('cd'))].filter((i) => i.release_id > 0);
    },
  });
};
