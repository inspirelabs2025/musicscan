import { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, Cell, ReferenceLine, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { money } from '@/lib/trading';
import type { PriceSnapshot } from '@/lib/trading';

const up = 'hsl(var(--trade-up))';
const down = 'hsl(var(--trade-down))';
const grid = 'hsl(var(--trade-grid))';
const muted = 'hsl(var(--trade-muted))';
const gold = 'hsl(var(--vinyl-gold))';

const tooltipStyle = {
  background: 'hsl(var(--trade-panel))',
  border: '1px solid hsl(var(--trade-grid))',
  borderRadius: 8,
  color: 'hsl(var(--trade-panel-foreground))',
  fontSize: 12,
};

const shortDate = (d: string) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
const dateTime = (d: string) => new Date(d).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function Sparkline({ values, positive }: { values: number[]; positive?: boolean }) {
  if (values.length < 2) return <div className="h-8 w-24 text-xs text-trade-muted flex items-center">—</div>;
  const data = values.map((v, i) => ({ i, v }));
  const color = positive === undefined ? (values.slice(-1)[0]! >= values[0] ? up : down) : positive ? up : down;
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PortfolioChart({ data, currency }: { data: { day: string; value: number; asking: number }[]; currency?: string }) {
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-sm text-trade-muted">Nog geen prijsgeschiedenis. De eerste meetpunten verschijnen na de volgende marktcheck.</div>;
  }
  const rising = data.length > 1 && data.slice(-1)[0]!.value >= data[0].value;
  const color = rising ? up : down;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tickFormatter={shortDate} stroke={muted} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis domain={['auto', 'auto']} stroke={muted} fontSize={11} tickLine={false} axisLine={false} width={64} tickFormatter={(v) => money(v, currency).replace(/,00$/, '')} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={shortDate} formatter={(v: number, n: string) => [money(v, currency), n === 'value' ? 'Marktwaarde' : 'Jouw vraagprijs']} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#pf)" />
          <Line type="monotone" dataKey="asking" stroke={gold} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriceHistoryChart({ snaps, condition, myPrice, currency }: {
  snaps: PriceSnapshot[]; condition?: string | null; myPrice?: number | null; currency?: string | null;
}) {
  const exact = condition ? snaps.filter((s) => s.condition === condition) : [];
  const series = (exact.length ? exact : snaps.filter((s) => s.condition === 'all')).map((s) => ({
    t: s.captured_at,
    market: s.suggested_price != null ? Number(s.suggested_price) : null,
    lowest: s.lowest_price != null ? Number(s.lowest_price) : null,
    supply: s.num_for_sale,
    mine: myPrice ?? null,
  }));
  if (!series.length) {
    return <div className="h-72 flex items-center justify-center text-sm text-trade-muted">Nog geen meetpunten voor deze plaat.</div>;
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tickFormatter={shortDate} stroke={muted} fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis yAxisId="p" domain={['auto', 'auto']} stroke={muted} fontSize={11} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => money(v, currency).replace(/,00$/, '')} />
          <YAxis yAxisId="s" orientation="right" stroke={muted} fontSize={11} tickLine={false} axisLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={dateTime} formatter={(v: number, n: string) => {
            const names: Record<string, string> = { market: 'Marktprijs', lowest: 'Laagste prijs', supply: 'Aantal te koop', mine: 'Jouw prijs' };
            return [n === 'supply' ? v : money(v, currency), names[n] ?? n];
          }} />
          <Bar yAxisId="s" dataKey="supply" fill={grid} barSize={6} radius={[2, 2, 0, 0]} />
          <Line yAxisId="p" type="stepAfter" dataKey="lowest" stroke={down} strokeWidth={1.75} dot={false} connectNulls />
          <Line yAxisId="p" type="monotone" dataKey="market" stroke={up} strokeWidth={2} dot={false} connectNulls />
          {myPrice != null && <Line yAxisId="p" dataKey="mine" stroke={gold} strokeDasharray="5 4" strokeWidth={1.5} dot={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const FRAMES = [
  { key: '1D', label: '1D', ms: 864e5 },
  { key: '1W', label: '1W', ms: 7 * 864e5 },
  { key: '1M', label: '1M', ms: 30 * 864e5 },
  { key: 'ALL', label: 'Alles', ms: Infinity },
] as const;

/** Trading-app style quote: price header, timeframe tabs, area chart with reference line, tick list and volume. */
export function QuoteChart({ snaps, condition, myPrice, currency }: {
  snaps: PriceSnapshot[]; condition?: string | null; myPrice?: number | null; currency?: string | null;
}) {
  const [frame, setFrame] = useState<(typeof FRAMES)[number]['key']>('1M');
  const exact = condition ? snaps.filter((s) => s.condition === condition) : [];
  const base = (exact.length ? exact : snaps.filter((s) => s.condition === 'all'))
    .slice().sort((a, b) => a.captured_at.localeCompare(b.captured_at));
  const ms = FRAMES.find((f) => f.key === frame)!.ms;
  const now = Date.now();
  const series = base
    .filter((s) => now - new Date(s.captured_at).getTime() <= ms)
    .map((s) => ({
      t: s.captured_at,
      p: s.lowest_price != null ? Number(s.lowest_price) : s.suggested_price != null ? Number(s.suggested_price) : null,
      supply: s.num_for_sale ?? 0,
    }))
    .filter((d): d is { t: string; p: number; supply: number } => d.p != null);

  const fmt = (v: number | null | undefined) => money(v ?? null, currency);
  const last = series[series.length - 1]?.p ?? null;
  const open = series[0]?.p ?? null;
  const prev = series.length > 1 ? series[series.length - 2].p : open;
  const change = last != null && open != null ? last - open : 0;
  const pct = open ? (change / open) * 100 : 0;
  const isUp = change >= 0;
  const color = isUp ? up : down;
  const prices = series.map((d) => d.p);
  const high = prices.length ? Math.max(...prices) : null;
  const low = prices.length ? Math.min(...prices) : null;
  const supplyNow = series[series.length - 1]?.supply ?? null;
  const ticks = series.slice(-9).reverse();

  return (
    <div className="rounded-lg border border-trade-grid overflow-hidden">
      <div className="grid grid-cols-3 gap-x-4 gap-y-1 p-3 text-xs">
        <div className="row-span-2">
          <div className={`text-2xl font-bold tabular-nums ${isUp ? 'text-trade-up' : 'text-trade-down'}`}>
            {fmt(last)} {isUp ? '▲' : '▼'}
          </div>
          <div className={`tabular-nums ${isUp ? 'text-trade-up' : 'text-trade-down'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} &nbsp; {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
          </div>
        </div>
        <div><span className="text-trade-muted">Hoog </span><span className="text-trade-up tabular-nums">{fmt(high)}</span></div>
        <div><span className="text-trade-muted">Open </span><span className="tabular-nums">{fmt(open)}</span></div>
        <div><span className="text-trade-muted">Laag </span><span className="text-trade-down tabular-nums">{fmt(low)}</span></div>
        <div><span className="text-trade-muted">Te koop </span><span className="tabular-nums">{supplyNow ?? '–'}</span></div>
      </div>

      <div className="flex border-y border-trade-grid text-xs">
        {FRAMES.map((f) => (
          <button key={f.key} onClick={() => setFrame(f.key)}
            className={`flex-1 py-2 font-medium transition-colors ${frame === f.key ? 'text-trade-panel-foreground border-b-2 border-vinyl-gold' : 'text-trade-muted hover:text-trade-panel-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {series.length < 1 ? (
        <div className="h-64 flex items-center justify-center text-sm text-trade-muted">Geen meetpunten in deze periode.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px]">
          <div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="qc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={grid} strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="t" tickFormatter={frame === '1D' ? (d) => new Date(d).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : shortDate}
                    stroke={muted} fontSize={10} tickLine={false} axisLine={false} minTickGap={32} />
                  <YAxis domain={['auto', 'auto']} orientation="left" stroke={muted} fontSize={10} tickLine={false} axisLine={false} width={52}
                    tickFormatter={(v) => money(v, currency).replace(/,00$/, '')} />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={dateTime}
                    formatter={(v: number, n: string) => [n === 'supply' ? v : fmt(v), n === 'p' ? 'Laagste prijs' : 'Te koop']} />
                  {open != null && <ReferenceLine y={open} stroke={muted} strokeDasharray="4 4" />}
                  {myPrice != null && <ReferenceLine y={myPrice} stroke={gold} strokeDasharray="6 4"
                    label={{ value: 'Jouw prijs', position: 'insideTopRight', fill: gold, fontSize: 10 }} />}
                  <Area type="linear" dataKey="p" stroke={color} strokeWidth={1.75} fill="url(#qc)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-16 border-t border-trade-grid">
              <div className="px-2 pt-1 text-[10px] text-trade-muted">AANBOD <span className="text-trade-panel-foreground">{supplyNow ?? '–'}</span></div>
              <ResponsiveContainer width="100%" height="75%">
                <BarChart data={series} margin={{ left: 52, right: 4, top: 0, bottom: 0 }}>
                  <Bar dataKey="supply" isAnimationActive={false}>
                    {series.map((d, i) => (
                      <Cell key={i} fill={i === 0 || d.p >= series[i - 1].p ? up : down} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-trade-grid text-xs font-mono">
            {ticks.map((d, i) => {
              const before = series[series.length - 1 - i - 1]?.p ?? d.p;
              const tickUp = d.p >= before;
              return (
                <div key={d.t} className="flex justify-between px-2 py-1.5">
                  <span className="text-trade-muted">{shortDate(d.t)}</span>
                  <span className={tickUp ? 'text-trade-up' : 'text-trade-down'}>{fmt(d.p)}</span>
                  <span className={tickUp ? 'text-trade-up' : 'text-trade-down'}>{d.supply}{tickUp ? '▲' : '▼'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
