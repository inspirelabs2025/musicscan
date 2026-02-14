import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useAdminAlerts } from '@/hooks/useAdminAlerts';

export function AdminCreditAlertBanner() {
  const { alerts } = useAdminAlerts();

  if (alerts.length === 0) return null;

  const latestAlert = alerts[0];
  const isCritical = latestAlert.alert_type === 'credit_depleted';

  return (
    <a
      href="https://lovable.dev/settings"
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        isCritical
          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
      }`}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        {isCritical ? 'Credits op' : 'Rate limit bereikt'}
        {alerts.length > 1 && ` (+${alerts.length - 1})`}
      </span>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
    </a>
  );
}
