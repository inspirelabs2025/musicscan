/**
 * verify-and-enrich-release
 * 
 * Fetches full Discogs release data, verifies against scanned identifiers,
 * and stores enriched data for future local-first lookups.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCOGS_TOKEN = Deno.env.get("DISCOGS_TOKEN");
const DISCOGS_CONSUMER_KEY = Deno.env.get("DISCOGS_CONSUMER_KEY");
const DISCOGS_CONSUMER_SECRET = Deno.env.get("DISCOGS_CONSUMER_SECRET");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── Discogs Auth ────────────────────────────────────────────────
function getDiscogsAuth(): Record<string, string> {
  if (DISCOGS_TOKEN) return { Authorization: `Discogs token=${DISCOGS_TOKEN}` };
  if (DISCOGS_CONSUMER_KEY && DISCOGS_CONSUMER_SECRET) {
    return { Authorization: `Discogs key=${DISCOGS_CONSUMER_KEY}, secret=${DISCOGS_CONSUMER_SECRET}` };
  }
  throw new Error("No Discogs credentials configured");
}

// ─── Fetch full release from Discogs ─────────────────────────────
async function fetchDiscogsRelease(discogsId: number): Promise<any> {
  const auth = getDiscogsAuth();
  const res = await fetch(`https://api.discogs.com/releases/${discogsId}`, {
    headers: { ...auth, "User-Agent": "MusicScan/4.0", Accept: "application/json" },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Discogs API ${res.status}: ${errText}`);
  }
  return res.json();
}

// ─── Extract structured data from Discogs release ────────────────
function extractEnrichmentData(release: any) {
  // Tracklist
  const tracklist = (release.tracklist || []).map((t: any) => ({
    position: t.position,
    title: t.title,
    duration: t.duration || null,
    type: t.type_ || "track",
  }));

  // Credits (extraartists)
  const credits = (release.extraartists || []).map((a: any) => ({
    name: a.name,
    role: a.role,
    anv: a.anv || null,
  }));

  // Companies
  const companies = (release.companies || []).map((c: any) => ({
    name: c.name,
    role: c.entity_type_name,
    catno: c.catno || null,
  }));

  // Identifiers → split into barcodes, matrix variants, and other identifiers
  const identifiers = release.identifiers || [];
  const barcodes: string[] = [];
  const matrixVariants: { value: string; description: string }[] = [];
  const otherIdentifiers: { type: string; value: string; description: string }[] = [];

  for (const id of identifiers) {
    const type = (id.type || "").toLowerCase();
    if (type === "barcode") {
      const digits = (id.value || "").replace(/\D/g, "");
      if (digits.length >= 8) barcodes.push(digits);
    } else if (type === "matrix / runout") {
      matrixVariants.push({ value: id.value || "", description: id.description || "" });
    } else {
      otherIdentifiers.push({
        type: id.type || "unknown",
        value: id.value || "",
        description: id.description || "",
      });
    }
  }

  // Labels
  const labels = (release.labels || []).map((l: any) => ({
    name: l.name,
    catno: l.catno || null,
    id: l.id,
  }));

  // Format
  const formats = (release.formats || []).map((f: any) => ({
    name: f.name,
    qty: f.qty,
    descriptions: f.descriptions || [],
  }));

  // Community data
  const community = release.community || {};

  // Images
  const images = (release.images || []).map((img: any) => ({
    type: img.type,
    uri: img.uri,
    uri150: img.uri150,
    width: img.width,
    height: img.height,
  }));

  const primaryImage = images.find((i: any) => i.type === "primary") || images[0];

  return {
    artist: release.artists?.map((a: any) => a.name).join(", ") || null,
    title: release.title || null,
    country: release.country || null,
    year: release.year || null,
    format: formats,
    labels,
    tracklist,
    credits,
    companies,
    matrix_variants: matrixVariants,
    barcodes: [...new Set(barcodes)], // deduplicate
    identifiers: otherIdentifiers,
    notes: release.notes || null,
    community_have: community.have || null,
    community_want: community.want || null,
    community_rating: community.rating?.average || null,
    artwork_url: primaryImage?.uri || null,
    images,
    master_id: release.master_id || null,
    genres: release.genres || [],
    styles: release.styles || [],
  };
}

// ─── Verification logic ──────────────────────────────────────────
function verifyRelease(
  scanData: { barcode?: string | null; catno?: string | null; matrix?: string | null },
  enrichment: ReturnType<typeof extractEnrichmentData>
): { status: string; score: number; details: any } {
  let confirmations = 0;
  const details: any = { checks: [] };

  // 1. Barcode check
  if (scanData.barcode) {
    const scanBarcode = scanData.barcode.replace(/\D/g, "");
    const matched = enrichment.barcodes.some((b) => b === scanBarcode);
    details.checks.push({
      type: "barcode",
      scan_value: scanBarcode,
      release_values: enrichment.barcodes,
      matched,
    });
    if (matched) confirmations++;
  }

  // 2. Catalog number check
  if (scanData.catno) {
    const scanCatno = scanData.catno.replace(/\s+/g, "").toUpperCase();
    const matched = enrichment.labels.some((l: any) => {
      const releaseCatno = (l.catno || "").replace(/\s+/g, "").toUpperCase();
      return releaseCatno === scanCatno || releaseCatno.includes(scanCatno) || scanCatno.includes(releaseCatno);
    });
    details.checks.push({
      type: "catno",
      scan_value: scanData.catno,
      release_values: enrichment.labels.map((l: any) => l.catno),
      matched,
    });
    if (matched) confirmations++;
  }

  // 3. Matrix check — tokenized substring matching
  if (scanData.matrix) {
    const scanMatrix = scanData.matrix.toUpperCase().replace(/\s+/g, " ").trim();
    const scanTokens = scanMatrix.split(/[\s\-\/]+/).filter((t) => t.length >= 2);

    let bestOverlap = 0;
    for (const variant of enrichment.matrix_variants) {
      const releaseMatrix = variant.value.toUpperCase().replace(/\s+/g, " ").trim();
      const releaseTokens = releaseMatrix.split(/[\s\-\/]+/).filter((t) => t.length >= 2);

      if (releaseTokens.length === 0) continue;

      const matchedTokens = scanTokens.filter((st) =>
        releaseTokens.some((rt) => rt.includes(st) || st.includes(rt))
      );
      const overlap = matchedTokens.length / Math.max(scanTokens.length, 1);
      bestOverlap = Math.max(bestOverlap, overlap);
    }

    const matched = bestOverlap >= 0.5;
    details.checks.push({
      type: "matrix",
      scan_value: scanData.matrix,
      release_variant_count: enrichment.matrix_variants.length,
      best_overlap: bestOverlap,
      matched,
    });
    if (matched) confirmations++;
  }

  // Score: 2+ = verified, 1 = likely, 0 = needs_review
  let status: string;
  if (confirmations >= 2) {
    status = "verified";
  } else if (confirmations === 1) {
    status = "likely";
  } else {
    status = "needs_review";
  }

  details.confirmations = confirmations;

  return { status, score: confirmations, details };
}

// ─── Main Handler ────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { discogs_id, scan_data, release_id } = body;

    if (!discogs_id) {
      return new Response(JSON.stringify({ error: "discogs_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🔍 Verifying & enriching Discogs release ${discogs_id}...`);

    // Check if already enriched
    const { data: existing } = await supabase
      .from("release_enrichments")
      .select("*")
      .eq("discogs_id", discogs_id)
      .maybeSingle();

    if (existing && existing.verification_status === "verified") {
      console.log(`✅ Already verified & enriched: ${discogs_id}`);

      // Still run verification if scan_data provided
      if (scan_data) {
        const verification = verifyRelease(scan_data, existing);
        return new Response(JSON.stringify({
          success: true,
          action: "existing_verified",
          discogs_id,
          verification,
          enrichment: existing,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        action: "already_enriched",
        discogs_id,
        enrichment: existing,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch full release from Discogs
    console.log(`📡 Fetching release ${discogs_id} from Discogs API...`);
    const release = await fetchDiscogsRelease(discogs_id);

    // Extract enrichment data
    const enrichment = extractEnrichmentData(release);
    console.log(`📊 Extracted: ${enrichment.tracklist.length} tracks, ${enrichment.barcodes.length} barcodes, ${enrichment.matrix_variants.length} matrix variants`);

    // Verify if scan_data provided
    let verification = { status: "unverified", score: 0, details: {} };
    if (scan_data) {
      verification = verifyRelease(scan_data, enrichment);
      console.log(`🔐 Verification: ${verification.status} (${verification.score} confirmations)`);
    }

    // Upsert enrichment data
    const enrichmentRecord = {
      discogs_id,
      release_id: release_id || existing?.release_id || null,
      artist: enrichment.artist,
      title: enrichment.title,
      country: enrichment.country,
      year: enrichment.year,
      format: enrichment.format,
      labels: enrichment.labels,
      tracklist: enrichment.tracklist,
      credits: enrichment.credits,
      companies: enrichment.companies,
      matrix_variants: enrichment.matrix_variants,
      barcodes: enrichment.barcodes,
      identifiers: enrichment.identifiers,
      notes: enrichment.notes,
      community_have: enrichment.community_have,
      community_want: enrichment.community_want,
      community_rating: enrichment.community_rating,
      artwork_url: enrichment.artwork_url,
      images: enrichment.images,
      verification_status: verification.status,
      verification_score: verification.score,
      verification_details: verification.details,
      enriched_at: new Date().toISOString(),
      pricing_lowest: null,
      pricing_median: null,
      pricing_highest: null,
    };

    const { data: upserted, error: upsertError } = await supabase
      .from("release_enrichments")
      .upsert(enrichmentRecord, { onConflict: "discogs_id" })
      .select()
      .single();

    if (upsertError) {
      console.error("❌ Upsert error:", upsertError);
      throw new Error(`Failed to store enrichment: ${upsertError.message}`);
    }

    console.log(`✅ Enrichment stored for ${discogs_id}: ${verification.status}`);

    // Also update releases table if we have a release_id
    if (release_id) {
      const updateData: any = {};
      if (enrichment.artwork_url) updateData.artwork_url = enrichment.artwork_url;
      if (enrichment.genres?.length) updateData.genre = enrichment.genres[0];
      if (enrichment.styles?.length) updateData.style = enrichment.styles;
      if (enrichment.master_id) updateData.master_id = enrichment.master_id;
      if (enrichment.country) updateData.country = enrichment.country;

      if (Object.keys(updateData).length > 0) {
        await supabase.from("releases").update(updateData).eq("id", release_id);
        console.log(`📝 Updated releases table with: ${Object.keys(updateData).join(", ")}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action: existing ? "updated" : "created",
      discogs_id,
      verification,
      enrichment: upserted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
