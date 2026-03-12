import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ScanActivityEntry {
  user_id?: string;
  action_type: string;
  function_name: string;
  status: string;
  artist?: string | null;
  title?: string | null;
  media_type?: string | null;
  image_count?: number;
  duration_ms?: number;
  error_message?: string | null;
  metadata?: Record<string, any>;
  discogs_id?: number | null;
  ip_address?: string | null;
}

export async function logScanActivity(entry: ScanActivityEntry): Promise<void> {
  try {
    const client = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await client.from("scan_activity_log").insert({
      user_id: entry.user_id || null,
      action_type: entry.action_type,
      function_name: entry.function_name,
      status: entry.status,
      artist: entry.artist || null,
      title: entry.title || null,
      media_type: entry.media_type || null,
      image_count: entry.image_count || 0,
      duration_ms: entry.duration_ms || null,
      error_message: entry.error_message || null,
      metadata: entry.metadata || {},
      discogs_id: entry.discogs_id || null,
      ip_address: entry.ip_address || null,
    });
    if (error) {
      console.error("[scan-activity-logger] Failed to log:", error.message);
    }
  } catch (e) {
    console.error("[scan-activity-logger] Error:", e);
  }
}

export function getUserIdFromRequest(req: Request): string | undefined {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return undefined;
    const token = authHeader.split(" ")[1];
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub;
  } catch {
    return undefined;
  }
}

export function getIpFromRequest(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
         req.headers.get("cf-connecting-ip") || null;
}
