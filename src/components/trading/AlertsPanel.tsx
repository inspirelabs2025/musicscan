import { useState } from 'react';
import { toast } from 'sonner';
import { BellRing, CheckCheck, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ALERT_TYPES, type AlertPrefs, type AlertType, type TradingAlert } from '@/lib/trading';
import { useMarkAlertsRead, useSaveAlertPrefs } from '@/hooks/useTradingDesk';
import { enablePush, pushMessages } from '@/lib/tradingPush';
import { playAlertSound } from '@/lib/tradingSound';

const typeLabel = (t: AlertType) => ALERT_TYPES.find((a) => a.type === t)?.label ?? t;
const typeTone: Record<AlertType, string> = {
  overpriced: 'text-trade-down', underpriced: 'text-vinyl-gold', market_listing: 'text-trade-muted',
  wishlist_match: 'text-trade-up', wantlist_available: 'text-trade-up', discogs_news: 'text-trade-panel-foreground',
};

function AlertLink({ a, children }: { a: TradingAlert; children: React.ReactNode }) {
  if (!a.link) return <>{children}</>;
  return a.link.startsWith('http')
    ? <a href={a.link} target="_blank" rel="noreferrer" className="block">{children}</a>
    : <Link to={a.link} className="block">{children}</Link>;
}

export function AlertsFeed({ alerts }: { alerts: TradingAlert[] }) {
  const markRead = useMarkAlertsRead();
  const [type, setType] = useState<AlertType | 'all'>('all');
  const list = alerts.filter((a) => type === 'all' || a.type === type);
  const unread = alerts.filter((a) => !a.is_read).length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', ...ALERT_TYPES.map((a) => a.type)] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={cn('rounded-full border px-3 py-1 text-xs', type === t ? 'border-vinyl-gold bg-vinyl-gold/15 text-vinyl-gold' : 'border-trade-grid text-trade-muted hover:text-trade-panel-foreground')}>
            {t === 'all' ? 'Alles' : typeLabel(t)}
          </button>
        ))}
        <Button size="sm" variant="ghost" className="ml-auto text-trade-muted" disabled={!unread} onClick={() => markRead.mutate(undefined)}>
          <CheckCheck className="mr-1 h-4 w-4" />Alles gelezen
        </Button>
      </div>
      {list.length === 0 ? <p className="py-10 text-center text-sm text-trade-muted">Nog geen meldingen.</p> : (
        <ul className="divide-y divide-trade-grid rounded-lg border border-trade-grid">
          {list.map((a) => (
            <li key={a.id} className={cn('p-3', !a.is_read && 'bg-trade-grid/30')} onClick={() => !a.is_read && markRead.mutate([a.id])}>
              <AlertLink a={a}>
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn('font-semibold uppercase tracking-wide', typeTone[a.type])}>{typeLabel(a.type)}</span>
                  <span className="text-trade-muted">{new Date(a.created_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  {!a.is_read && <span className="h-2 w-2 rounded-full bg-vinyl-gold" />}
                </div>
                <div className="mt-0.5 text-sm font-medium text-trade-panel-foreground">{a.title}</div>
                {a.body && <div className="text-xs text-trade-muted">{a.body}</div>}
              </AlertLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AlertSettings({ prefs }: { prefs: AlertPrefs }) {
  const save = useSaveAlertPrefs();
  const [threshold, setThreshold] = useState(prefs.threshold_pct);
  const [pushState, setPushState] = useState<string | null>(null);
  const update = (p: Partial<AlertPrefs>) => save.mutate(p, { onError: (e) => toast.error((e as Error).message) });
  const toggleType = (t: AlertType, on: boolean) =>
    update({ enabled_types: on ? [...new Set([...prefs.enabled_types, t])] : prefs.enabled_types.filter((x) => x !== t) });

  const turnOnPush = async () => {
    const r = await enablePush();
    setPushState(pushMessages[r.status]);
    if (r.status === 'registered') { update({ push_enabled: true }); toast.success(pushMessages.registered); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-trade-muted">Welke meldingen</h3>
        {ALERT_TYPES.map((a) => (
          <div key={a.type} className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor={`t-${a.type}`} className="text-trade-panel-foreground">{a.label}</Label>
              <p className="text-xs text-trade-muted">{a.description}</p>
            </div>
            <Switch id={`t-${a.type}`} checked={prefs.enabled_types.includes(a.type)} onCheckedChange={(v) => toggleType(a.type, v)} />
          </div>
        ))}
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-trade-muted">Wanneer is een prijs “te duur” of “te goedkoop”?</h3>
          <div className="flex items-center gap-4">
            <Slider min={3} max={50} step={1} value={[threshold]} onValueChange={(v) => setThreshold(v[0])} onValueCommit={(v) => update({ threshold_pct: v[0] })} className="flex-1" />
            <span className="w-12 text-right tabular-nums text-trade-panel-foreground">{threshold}%</span>
          </div>
          <p className="text-xs text-trade-muted">Afwijking van de marktprijs voor jouw conditie.</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="snd" className="text-trade-panel-foreground">Geluid bij nieuwe melding</Label>
            <p className="text-xs text-trade-muted">Een korte toon, ook op je telefoon als de site open staat.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-trade-muted" onClick={playAlertSound} aria-label="Geluid testen"><Volume2 className="h-4 w-4" /></Button>
            <Switch id="snd" checked={prefs.sound_enabled} onCheckedChange={(v) => update({ sound_enabled: v })} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="share" className="text-trade-panel-foreground">Match met andere verzamelaars</Label>
            <p className="text-xs text-trade-muted">Laat zien dat je een plaat zoekt of verkoopt, zodat jullie elkaar een bericht kunnen sturen.</p>
          </div>
          <Switch id="share" checked={prefs.share_wantlist} onCheckedChange={(v) => update({ share_wantlist: v })} />
        </div>
        <div className="space-y-2 rounded-lg border border-trade-grid p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="push" className="text-trade-panel-foreground">Pushmeldingen op dit apparaat</Label>
              <p className="text-xs text-trade-muted">Op pc en telefoon, ook als MusicScan niet open staat.</p>
            </div>
            <Switch id="push" checked={prefs.push_enabled} onCheckedChange={(v) => update({ push_enabled: v })} />
          </div>
          <Button size="sm" variant="outline" onClick={turnOnPush}><BellRing className="mr-1 h-4 w-4" />Meldingen toestaan</Button>
          {pushState && <p className="text-xs text-trade-muted">{pushState}</p>}
        </div>
      </div>
    </div>
  );
}
