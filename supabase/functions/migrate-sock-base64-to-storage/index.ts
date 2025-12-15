import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function safeExtFromDataUrl(dataUrl: string): "png" | "jpg" | "webp" {
  const head = dataUrl.slice(0, 64).toLowerCase();
  if (head.includes("image/webp")) return "webp";
  if (head.includes("image/jpeg") || head.includes("image/jpg")) return "jpg";
  return "png";
}

function decodeBase64DataUrl(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(",");
  if (parts.length < 2) throw new Error("Ongeldige data URL");
  const base64 = parts.slice(1).join(",");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function sha256Hex(input: Uint8Array): Promise<string> {
  return crypto.subtle.digest("SHA-256", input).then((hash) => {
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dryRun, limit } = await req.json().catch(() => ({ dryRun: false, limit: 50 }));

    const runLimit = typeof limit === "number" ? Math.max(1, Math.min(200, limit)) : 50;
    const isDryRun = !!dryRun;

    console.log("🧦 migrate-sock-base64-to-storage start", { isDryRun, runLimit });

    const { data: products, error: fetchError } = await supabase
      .from("platform_products")
      .select("id, slug, title, primary_image, images")
      .eq("status", "active")
      .eq("media_type", "merchandise")
      .contains("categories", ["socks"])
      .like("primary_image", "data:image/%")
      .order("created_at", { ascending: false })
      .limit(runLimit);

    if (fetchError) throw fetchError;

    const items = products || [];
    console.log("🧦 Found base64 sock products", { count: items.length });

    let migrated = 0;
    let skipped = 0;
    const errors: Array<{ id: string; slug: string; error: string }> = [];

    for (const p of items) {
      try {
        if (!p.primary_image || typeof p.primary_image !== "string" || !p.primary_image.startsWith("data:image/")) {
          skipped++;
          continue;
        }

        const bytes = decodeBase64DataUrl(p.primary_image);
        const ext = safeExtFromDataUrl(p.primary_image);
        const hash = await sha256Hex(bytes);
        const path = `socks/${p.slug || p.id}/${hash}.${ext}`;

        if (isDryRun) {
          console.log("🧪 Dry-run upload", { id: p.id, slug: p.slug, path, bytes: bytes.length });
          skipped++;
          continue;
        }

        const { error: uploadError } = await supabase.storage
          .from("socks")
          .upload(path, bytes, {
            contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("socks").getPublicUrl(path);
        const publicUrl = publicUrlData.publicUrl;

        const nextImages = Array.isArray(p.images) ? [...p.images] : [];
        // vervang primary als die in images staat
        const idx = nextImages.findIndex((u) => typeof u === "string" && u === p.primary_image);
        if (idx >= 0) nextImages[idx] = publicUrl;
        // zorg dat publicUrl in images voorkomt
        if (!nextImages.includes(publicUrl)) nextImages.unshift(publicUrl);

        const { error: updateError } = await supabase
          .from("platform_products")
          .update({ primary_image: publicUrl, images: nextImages })
          .eq("id", p.id);

        if (updateError) throw updateError;

        migrated++;
        console.log("✅ Migrated", { id: p.id, slug: p.slug, publicUrl });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push({ id: (p as any).id, slug: (p as any).slug, error: msg });
        console.error("❌ Failed migrating product", { id: (p as any).id, slug: (p as any).slug, error: msg });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: isDryRun,
        found: items.length,
        migrated,
        skipped,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ migrate-sock-base64-to-storage error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
