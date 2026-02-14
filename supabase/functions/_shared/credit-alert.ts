import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Log a credit/rate-limit alert to admin_alerts table.
 * Deduplicates: max 1 alert per type+source per hour (via DB function).
 */
export async function logCreditAlert(
  sourceFunction: string,
  alertType: 'credit_depleted' | 'rate_limit',
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const message = alertType === 'credit_depleted'
      ? `⚠️ AI credits zijn op! Functie "${sourceFunction}" kreeg een 402 Payment Required. Voeg credits toe via Settings → Workspace → Usage.`
      : `⏳ Rate limit bereikt voor "${sourceFunction}". Mogelijk te veel verzoeken.`;

    await supabase.rpc('insert_admin_alert_if_new', {
      p_alert_type: alertType,
      p_source_function: sourceFunction,
      p_message: message,
      p_metadata: metadata || {},
    });

    console.log(`[credit-alert] Alert logged: ${alertType} from ${sourceFunction}`);
  } catch (err) {
    // Never let alert logging break the main flow
    console.error('[credit-alert] Failed to log alert:', err);
  }
}
