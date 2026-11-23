import { useMemo, useState } from 'react';
import { MessageCircle, ExternalLink, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MessagingInterface from '@/components/social/MessagingInterface';
import { useAuth } from '@/contexts/AuthContext';
import { openConversationWith } from '@/hooks/useTradingDesk';
import { money, type TradingAlert } from '@/lib/trading';

const timeAgo = (d: string) => {
  const m = Math.round((Date.now() - Date.parse(d)) / 60000);
  if (m < 60) return `${m} min geleden`;
  if (m < 1440) return `${Math.round(m / 60)} uur geleden`;
  return `${Math.round(m / 1440)} dagen geleden`;
};

export function MatchesPanel({ alerts }: { alerts: TradingAlert[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const matches = useMemo(() => alerts.filter((a) => a.related_user_id && (a.type === 'wishlist_match' || a.type === 'wantlist_available')), [alerts]);
  const [compose, setCompose] = useState<TradingAlert | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [openConv, setOpenConv] = useState<string | null>(null);

  const startCompose = (a: TradingAlert) => {
    const label = a.data?.label ?? 'deze plaat';
    setText(a.data?.role === 'seller'
      ? `Hoi ${a.data?.other_name ?? ''}! Ik zag dat ${label} op je wantlist staat. Ik verkoop hem op Discogs voor ${money(a.data?.price, a.data?.currency)}. Interesse?`
      : `Hoi ${a.data?.other_name ?? ''}! Ik zoek ${label} en zag dat jij hem verkoopt. Is hij nog beschikbaar?`);
    setCompose(a);
  };

  const send = async () => {
    if (!user || !compose?.related_user_id || !text.trim()) return;
    setSending(true);
    try {
      const id = await openConversationWith(user.id, compose.related_user_id, text.trim().slice(0, 2000));
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setCompose(null);
      setOpenConv(id);
      toast.success('Bericht verstuurd');
    } catch (e) {
      toast.error('Versturen lukte niet', { description: (e as Error).message });
    } finally {
      setSending(false);
    }
  };

  if (!matches.length) {
    return (
      <div className="py-10 text-center text-sm text-trade-muted space-y-2">
        <Handshake className="mx-auto h-8 w-8 opacity-60" />
        <p>Nog geen matches. Zodra een plaat die jij verkoopt op de wantlist van een andere MusicScan-gebruiker staat (of andersom), zie je dat hier en kun je meteen een bericht sturen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((a) => (
        <div key={a.id} className="flex flex-col gap-3 rounded-lg border border-trade-grid p-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {a.data?.thumb ? <img src={a.data.thumb} alt="" className="h-12 w-12 rounded object-cover" loading="lazy" /> : <div className="h-12 w-12 rounded bg-trade-grid" />}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={a.data?.role === 'seller' ? 'text-xs font-semibold text-trade-up' : 'text-xs font-semibold text-vinyl-gold'}>
                  {a.data?.role === 'seller' ? 'KOPER' : 'VERKOPER'}
                </span>
                {!a.is_read && <span className="h-2 w-2 rounded-full bg-vinyl-gold" aria-label="Nieuw" />}
                <span className="text-xs text-trade-muted">{timeAgo(a.created_at)}</span>
              </div>
              <div className="truncate text-sm font-medium text-trade-panel-foreground">{a.title}</div>
              <div className="text-xs text-trade-muted line-clamp-2">{a.body}</div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {a.data?.listing_uri && (
              <Button asChild size="sm" variant="outline"><a href={a.data.listing_uri} target="_blank" rel="noreferrer">Listing <ExternalLink className="ml-1 h-3 w-3" /></a></Button>
            )}
            <Button size="sm" onClick={() => startCompose(a)}><MessageCircle className="mr-1 h-4 w-4" />Stuur bericht</Button>
          </div>
        </div>
      ))}

      <Dialog open={!!compose} onOpenChange={(o) => !o && setCompose(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bericht aan {compose?.data?.other_name ?? 'verzamelaar'}</DialogTitle>
            <DialogDescription>{compose?.data?.label}</DialogDescription>
          </DialogHeader>
          <Textarea rows={5} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompose(null)}>Annuleren</Button>
            <Button onClick={send} disabled={sending || !text.trim()}>{sending ? 'Versturen…' : 'Versturen'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openConv} onOpenChange={(o) => !o && setOpenConv(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="sr-only"><DialogTitle>Berichten</DialogTitle></DialogHeader>
          {openConv && <MessagingInterface selectedConversationId={openConv} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
