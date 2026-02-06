/**
 * Backfill Script: Fix historical scans where barcode was confused with catno/matrix
 * 
 * Finds scans where:
 * - matrix == barcode OR catno == barcode
 * Marks them as 'needs_review' and clears the discogs_release_id
 * 
 * Run via: supabase functions invoke backfill-scan-review
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Scanning for misidentified records...");

    // Find ai_scan_results where barcode == matrix_number or barcode == catalog_number
    const { data: scans, error } = await supabase
      .from("ai_scan_results")
      .select("id, barcode, matrix_number, catalog_number, discogs_id, artist, title")
      .not("barcode", "is", null)
      .limit(1000);

    if (error) throw error;

    let flagged = 0;
    const flaggedRecords: any[] = [];

    for (const scan of scans || []) {
      if (!scan.barcode) continue;

      const barcodeDigits = scan.barcode.replace(/\D/g, "");
      let needsReview = false;
      const reasons: string[] = [];

      // Check: matrix == barcode
      if (scan.matrix_number) {
        const matrixDigits = scan.matrix_number.replace(/\D/g, "");
        if (matrixDigits === barcodeDigits || matrixDigits.includes(barcodeDigits)) {
          needsReview = true;
          reasons.push(`matrix contains barcode: "${scan.matrix_number}"`);
        }
      }

      // Check: catno == barcode
      if (scan.catalog_number) {
        const catnoDigits = scan.catalog_number.replace(/\D/g, "");
        if (catnoDigits === barcodeDigits) {
          needsReview = true;
          reasons.push(`catno matches barcode: "${scan.catalog_number}"`);
        }
      }

      if (needsReview) {
        flagged++;
        flaggedRecords.push({
          id: scan.id,
          artist: scan.artist,
          title: scan.title,
          reasons,
        });

        // Update: mark as flagged, clear discogs_id
        await supabase
          .from("ai_scan_results")
          .update({
            is_flagged_incorrect: true,
            comments: `[BACKFILL] Needs review: ${reasons.join("; ")}`,
            // Don't clear discogs_id yet - let admin review first
          })
          .eq("id", scan.id);
      }
    }

    console.log(`✅ Backfill complete: ${flagged}/${scans?.length || 0} records flagged for review`);

    return new Response(
      JSON.stringify({
        success: true,
        total_scanned: scans?.length || 0,
        flagged_count: flagged,
        flagged_records: flaggedRecords,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Backfill error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
