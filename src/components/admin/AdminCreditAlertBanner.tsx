import { AlertTriangle } from 'lucide-react';
import { useAdminAlerts } from '@/hooks/useAdminAlerts';

export function AdminCreditAlertBanner() {
  const { alerts } = useAdminAlerts();

  if (alerts.length === 0) return null;

  const latestAlert = alerts[0];
  const isCritical = latestAlert.alert_type === 'credit_depleted';
  const isAbuse = latestAlert.alert_type === 'abuse_detected';

  const getMessage = () => {
    if (isCritical) return 'AI credits zijn op!';
    if (isAbuse) return 'Misbruik gedetecteerd!';
    return 'Rate limit bereikt';
  };

  const colorClass = isCritical || isAbuse ? 'text-destructive' : 'text-amber-500';

  return (
    <p className={`text-xs flex items-center gap-1.5 ${colorClass}`}>
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>
        {getMessage()}
        {alerts.length > 1 && ` (+${alerts.length - 1})`}
      </span>
    </p>
  );
}
