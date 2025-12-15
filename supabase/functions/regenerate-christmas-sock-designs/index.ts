import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Require logged-in admin (prevents anyone from burning credits by calling this endpoint)
    const token = getBearerToken(req);
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", { _user_id: userId });
    if (adminError || !isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit ?? 5), 1), 10);
    const deleteExisting = body?.deleteExisting === true;

    console.log(`🔄🎄 regenerate-christmas-sock-designs: start (limit=${limit}, deleteExisting=${deleteExisting})`);

    // If deleteExisting is true, delete all existing Christmas socks and their products first
    if (deleteExisting) {
      console.log("🗑️ Deleting existing Christmas socks and products...");
      
      // Get product IDs from Christmas socks
      const { data: christmasSocks } = await supabase
        .from("album_socks")
        .select("id, product_id")
        .eq("pattern_type", "christmas");

      const productIds = christmasSocks?.filter(s => s.product_id).map(s => s.product_id) || [];
      const sockIds = christmasSocks?.map(s => s.id) || [];

      // Delete products
      if (productIds.length > 0) {
        const { error: deleteProductsError } = await supabase
          .from("platform_products")
          .delete()
          .in("id", productIds);
        
        if (deleteProductsError) {
          console.error("❌ Error deleting products:", deleteProductsError);
        } else {
          console.log(`✅ Deleted ${productIds.length} Christmas sock products`);
        }
      }

      // Delete socks
      if (sockIds.length > 0) {
        const { error: deleteSocksError } = await supabase
          .from("album_socks")
          .delete()
          .in("id", sockIds);
        
        if (deleteSocksError) {
          console.error("❌ Error deleting socks:", deleteSocksError);
        } else {
          console.log(`✅ Deleted ${sockIds.length} Christmas socks`);
        }
      }

      // Now trigger backfill to regenerate with artist portraits
      console.log("🔄 Triggering backfill-christmas-socks for artist portraits...");
      const { data: backfillData, error: backfillError } = await supabase.functions.invoke("backfill-christmas-socks", {});
      
      if (backfillError) {
        console.error("❌ Backfill error:", backfillError);
      } else {
        console.log("✅ Backfill triggered:", backfillData);
      }

      return new Response(
        JSON.stringify({
          success: true,
          deleted: { products: productIds.length, socks: sockIds.length },
          backfillTriggered: !backfillError,
          message: `Deleted ${sockIds.length} Christmas socks and ${productIds.length} products. Backfill triggered for artist portraits.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: socks, error: fetchError } = await supabase
      .from("album_socks")
      .select("id, artist_name, album_title, album_cover_url, product_id, base_design_url")
      .eq("pattern_type", "christmas")
      .limit(200);

    if (fetchError) throw fetchError;

    const needsRegen = (socks || [])
      .filter((s) => {
        const base = s.base_design_url || "";
        const cover = s.album_cover_url || "";
        if (!cover) return false;
        if (!base) return true;
        if (base.startsWith("data:image")) return true;
        if (base === cover) return true;
        return false;
      })
      .slice(0, limit);

    if (needsRegen.length === 0) {
      console.log("✅ Nothing to regenerate");
      return new Response(
        JSON.stringify({ success: true, regenerated: 0, message: "Niets om te regenereren" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const christmasPalette = {
      primary_color: "#C41E3A",
      secondary_color: "#228B22",
      accent_color: "#FFD700",
      color_palette: ["#C41E3A", "#228B22", "#FFD700"],
      design_theme: "posterize",
      pattern_type: "christmas",
    };

    let regenerated = 0;
    const updatedSockIds: string[] = [];
    const updatedProductIds: string[] = [];
    const errors: string[] = [];

    for (const s of needsRegen) {
      console.log(`🧦🎄 Regenerating: ${s.artist_name} - ${s.album_title} (${s.id})`);

      try {
        const { data: genData, error: genError } = await supabase.functions.invoke("generate-sock-design", {
          body: {
            existingSockId: s.id,
            artistName: s.artist_name,
            albumTitle: s.album_title,
            albumCoverUrl: s.album_cover_url,
            colorPalette: christmasPalette,
            genre: "Christmas",
          },
        });

        if (genError || !genData?.base_design_url) {
          const msg = genError?.message || "Sock generation failed";
          console.error("❌ generate-sock-design failed:", msg);
          errors.push(`${s.id}: ${msg}`);
          continue;
        }

        const newUrl = genData.base_design_url as string;

        // Keep product image in sync if a product exists
        if (s.product_id) {
          const { error: updateProductError } = await supabase
            .from("platform_products")
            .update({
              primary_image: newUrl,
              images: [newUrl],
            })
            .eq("id", s.product_id);

          if (updateProductError) {
            console.error("❌ Failed updating product image:", updateProductError);
            errors.push(`${s.id}: product update failed - ${updateProductError.message}`);
          } else {
            updatedProductIds.push(s.product_id);
          }
        }

        regenerated++;
        updatedSockIds.push(s.id);

        // tiny delay to reduce rate limiting risk
        await new Promise((r) => setTimeout(r, 400));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error("❌ Error regenerating sock:", msg);
        errors.push(`${s.id}: ${msg}`);
      }
    }

    console.log(`✅ regenerate-christmas-sock-designs done: ${regenerated}/${needsRegen.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        regenerated,
        attempted: needsRegen.length,
        updatedSockIds,
        updatedProductIds,
        errors: errors.length ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ regenerate-christmas-sock-designs error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
