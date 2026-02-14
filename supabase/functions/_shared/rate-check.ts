import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Check scan rate for abuse detection.
 * Calls the check_scan_rate RPC with service role.
 * Returns { allowed: true, over_limit: boolean, ip_count, fp_count }
 */
export async function checkScanRate(
  req: Request,
  userId?: string,
  scanType: string = "photo"
): Promise<{ allowed: boolean; over_limit: boolean; ip_count: number; fp_count: number }> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract IP from headers (Supabase forwards client IP)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    // Extract device fingerprint from custom header (sent by frontend)
    const fingerprint = req.headers.get("x-device-fingerprint") || null;

    const { data, error } = await supabase.rpc("check_scan_rate", {
      p_ip: ip,
      p_fingerprint: fingerprint,
      p_user_id: userId || null,
      p_scan_type: scanType,
      p_daily_limit: 10,
    });

    if (error) {
      console.error("[rate-check] RPC error:", error.message);
      // On error, allow the scan (fail-open)
      return { allowed: true, over_limit: false, ip_count: 0, fp_count: 0 };
    }

    const result = data as any;
    if (result?.over_limit) {
      console.warn(`[rate-check] ⚠️ Over limit: IP=${ip}, count=${result.ip_count}`);
    }

    return {
      allowed: true, // We don't block, only alert
      over_limit: result?.over_limit || false,
      ip_count: result?.ip_count || 0,
      fp_count: result?.fp_count || 0,
    };
  } catch (err) {
    console.error("[rate-check] Unexpected error:", err);
    return { allowed: true, over_limit: false, ip_count: 0, fp_count: 0 };
  }
}
