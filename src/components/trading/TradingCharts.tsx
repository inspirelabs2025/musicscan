import {
  Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
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
