import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { useAdminAlerts } from '@/hooks/useAdminAlerts';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export function AdminCreditAlertBanner() {
  const { alerts, markAsRead, markAllAsRead } = useAdminAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.slice(0, 3).map(alert => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            alert.alert_type === 'credit_depleted'
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
          }`}
        >
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{alert.message}</p>
            <p className="text-xs opacity-70 mt-1">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: nl })}
              {alert.source_function && ` • ${alert.source_function}`}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {alert.alert_type === 'credit_depleted' && (
              <a
                href="https://lovable.dev/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-destructive/20 rounded"
                title="Open Lovable Settings"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={() => markAsRead.mutate(alert.id)}
              className="p-1 hover:bg-foreground/10 rounded"
              title="Markeer als gelezen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      {alerts.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">
          + {alerts.length - 3} meer alerts
        </p>
      )}
      {alerts.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => markAllAsRead.mutate()}
        >
          Alles markeren als gelezen
        </Button>
      )}
    </div>
  );
}
