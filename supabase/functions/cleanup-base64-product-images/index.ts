import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const isDataImage = (url?: string | null) => !!url && url.startsWith("data:");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";

    // 1) Auth check (admin only)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Niet ingelogd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { data: isAdmin, error: adminErr } = await userClient.rpc("is_admin", { _user_id: userId });
    if (adminErr) throw adminErr;
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Geen admin rechten" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Service role cleanup
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const isDryRun = !!body?.dryRun;
    const limit = typeof body?.limit === "number" ? Math.max(1, Math.min(200, body.limit)) : 50;

    console.log("🧽 cleanup-base64-product-images start", { isDryRun, limit });

    const { data: rows, error: fetchErr } = await serviceClient
      .from("platform_products")
      .select("id, slug, primary_image, images")
      .eq("status", "active")
      .like("primary_image", "data:%")
      .limit(limit);

    if (fetchErr) throw fetchErr;

    const items = rows || [];
    let cleaned = 0;
    const errors: Array<{ id: string; slug: string | null; error: string }> = [];

    for (const p of items) {
      try {
        const imagesArr = Array.isArray((p as any).images) ? ((p as any).images as any[]) : [];
        const filteredImages = imagesArr.filter((u) => typeof u === "string" && !isDataImage(u));

        const nextPrimary = filteredImages.length > 0 ? filteredImages[0] : null;

        if (isDryRun) {
          console.log("🧪 Dry-run cleanup", {
            id: (p as any).id,
            slug: (p as any).slug,
            hadPrimaryBase64: isDataImage((p as any).primary_image),
            keptImages: filteredImages.length,
            nextPrimary,
          });
          cleaned++;
          continue;
        }

        const { error: updateErr } = await serviceClient
          .from("platform_products")
          .update({ primary_image: nextPrimary, images: filteredImages })
          .eq("id", (p as any).id);

        if (updateErr) throw updateErr;

        cleaned++;
        console.log("✅ Cleaned", { id: (p as any).id, slug: (p as any).slug, nextPrimary });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push({ id: (p as any).id, slug: (p as any).slug ?? null, error: msg });
        console.error("❌ Failed cleanup", { id: (p as any).id, slug: (p as any).slug, error: msg });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: isDryRun,
        found: items.length,
        cleaned,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("❌ cleanup-base64-product-images error", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
