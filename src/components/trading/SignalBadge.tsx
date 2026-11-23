import { TrendingDown, TrendingUp, Minus, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signalLabel, pct, type Signal } from '@/lib/trading';

export function SignalBadge({ signal, deviation }: { signal: Signal; deviation?: number | null }) {
  const Icon = signal === 'overpriced' ? TrendingUp : signal === 'underpriced' ? TrendingDown : signal === 'fair' ? Minus : HelpCircle;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums whitespace-nowrap',
        signal === 'overpriced' && 'bg-trade-down/15 text-trade-down',
        signal === 'underpriced' && 'bg-vinyl-gold/15 text-vinyl-gold',
        signal === 'fair' && 'bg-trade-up/15 text-trade-up',
        signal === 'unknown' && 'bg-trade-grid text-trade-muted',
      )}
    >
      <Icon className="h-3 w-3" />
      {signalLabel[signal]}
      {deviation != null && signal !== 'unknown' && <span className="opacity-80">{pct(deviation)}</span>}
    </span>
  );
}

export function Change({ value }: { value: number | null }) {
  if (value == null) return <span className="text-trade-muted">–</span>;
  return (
    <span className={cn('tabular-nums font-medium', value > 0 ? 'text-trade-up' : value < 0 ? 'text-trade-down' : 'text-trade-muted')}>
      {value > 0 ? '▲' : value < 0 ? '▼' : '•'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}
