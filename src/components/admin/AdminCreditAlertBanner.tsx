import { AlertTriangle } from 'lucide-react';
import { useAdminAlerts } from '@/hooks/useAdminAlerts';

export function AdminCreditAlertBanner() {
  const { alerts } = useAdminAlerts();

  if (alerts.length === 0) return null;

  const latestAlert = alerts[0];
  const isCritical = latestAlert.alert_type === 'credit_depleted';

  return (
    <p className={`text-xs flex items-center gap-1.5 ${isCritical ? 'text-destructive' : 'text-amber-500'}`}>
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>
        {isCritical ? 'AI credits zijn op!' : 'Rate limit bereikt'}
        {alerts.length > 1 && ` (+${alerts.length - 1})`}
      </span>
    </p>
  );
}
