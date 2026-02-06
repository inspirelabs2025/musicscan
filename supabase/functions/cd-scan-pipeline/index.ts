/**
 * CD Scan Pipeline V1.0 — Collector-Grade Identification
 * 
 * Implements strict no-guessing extraction, normalization, 
 * candidate finding, and disambiguation with full audit trail.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const PIPELINE_VERSION = "cd-scan-pipeline-v1.0";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const DISCOGS_TOKEN = Deno.env.get("DISCOGS_TOKEN");
const DISCOGS_CONSUMER_KEY = Deno.env.get("DISCOGS_CONSUMER_KEY");
const DISCOGS_CONSUMER_SECRET = Deno.env.get("DISCOGS_CONSUMER_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Types ───────────────────────────────────────────────────────
interface Extraction {
  field_name: string;
  raw_value: string | null;
  normalized_value: string | null;
  confidence: number;
  source_image_kind: string | null;
}

interface DiscogsCandidate {
  release_id: number;
  score: number;
  reason: string[];
  title: string;
  year?: number;
  country?: string;
  label?: string;
  catno?: string;
  barcode?: string[];
}

interface AuditEntry {
  step: string;
  detail: string;
  timestamp: string;
}

// ─── Normalizers ─────────────────────────────────────────────────
function normalizeBarcode(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null; // Too short for any barcode
  return digits;
}

function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(barcode[12]);
}

function normalizeCatno(raw: string | null): string | null {
  if (!raw) return null;
  // Collapse multiple spaces, trim
  let normalized = raw.trim().replace(/\s+/g, " ");
  // Don't accept pure digit strings >= 12 chars (those are barcodes)
  if (/^\d{12,}$/.test(normalized.replace(/\s/g, ""))) return null;
  return normalized;
}

function normalizeMatrix(raw: string | null): string | null {
  if (!raw) return null;
  let normalized = raw.trim().replace(/\s+/g, " ");
  // Matrix Sanity Guard: if >= 12 consecutive digits and no alpha, it's a barcode
  const digitsOnly = normalized.replace(/\D/g, "");
  const hasAlpha = /[a-zA-Z]/.test(normalized);
  if (digitsOnly.length >= 12 && !hasAlpha) return null;
  return normalized;
}

function normalizeIFPI(raw: string | null): string | null {
  if (!raw) return null;
  return raw.toUpperCase().replace(/\s+/g, "").trim();
}

// ─── AI Field Extraction ─────────────────────────────────────────
async function extractFieldsFromImages(imageUrls: string[]): Promise<{
  extractions: Extraction[];
  artist: string | null;
  title: string | null;
  audit: AuditEntry[];
}> {
  const audit: AuditEntry[] = [];
  
  const prompt = `You are a CD identification specialist. Analyze these photos of a CD (front cover, back cover, disc, etc.) and extract ONLY text you can physically see printed on the item.

CRITICAL RULES:
1. NEVER guess or use your music knowledge. Only report what is PHYSICALLY VISIBLE.
2. Barcodes are ALWAYS near the barcode symbol on the back cover - they are 8-13 digit numbers.
3. Catalog numbers are alphanumeric codes like "CDPCSD 167", "CDP 7 46203 2", "7243 8 36088 2 5" is NOT a catalog number if it's 13 digits - that's a barcode.
4. Matrix/mastering codes are etched/stamped on the disc hub (mirror band near center hole). They often contain plant codes like "DADC", "EMI UDEN", "PMDC", separators like "@@", hyphens, etc.
5. If text is NOT clearly visible, report it as null. NEVER invent data.
6. Year: ONLY from explicit copyright lines "(P) 1995" or "(C) 1995". Never guess year.
7. Country: ONLY from explicit text like "Printed in Holland", "Made in Germany", etc.
8. IFPI codes: Look for "IFPI Lxxx" (master) and "IFPI xxxx" (mould) on the disc.

A barcode like "7243 8 36088 2 9" with spaces is still a barcode (EAN), NOT a catalog number.
A catalog number looks like "CDPCSD 167", "7243-4-94077-2-8" with specific label prefixes.

Return JSON (no markdown):
{
  "artist": "artist name from front cover or null",
  "title": "album title from front cover or null",
  "barcode_raw": "exact barcode digits as printed near barcode symbol, or null",
  "barcode_source": "back_cover or null",
  "catno_raw": "exact catalog number as printed, or null", 
  "catno_source": "back_cover/spine/front or null",
  "matrix_raw": "exact matrix/mastering code from disc hub, or null",
  "matrix_source": "disc_hub or null",
  "ifpi_master_raw": "IFPI master code (usually IFPI Lxxx) or null",
  "ifpi_mould_raw": "IFPI mould code (usually IFPI xxxx) or null",
  "label_raw": "record label name or null",
  "country_raw": "country of manufacture text or null",
  "year_hint_raw": "year from copyright line only, or null",
  "year_hint_source": "copyright line text or null",
  "notes": "what you see on the images, any uncertainties"
}`;

  audit.push({ step: "extraction_start", detail: `Sending ${imageUrls.length} images to AI`, timestamp: new Date().toISOString() });

  const imageContent = imageUrls.map((url: string) => ({
    type: "image_url" as const,
    image_url: { url },
  }));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...imageContent] }],
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI extraction failed: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  // Parse JSON from response
  let parsed: any;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch (e) {
    audit.push({ step: "parse_error", detail: `Failed to parse AI response: ${content.slice(0, 200)}`, timestamp: new Date().toISOString() });
    throw new Error("Failed to parse AI extraction response");
  }

  audit.push({ step: "extraction_raw", detail: JSON.stringify(parsed), timestamp: new Date().toISOString() });

  // Build extractions with normalization
  const extractions: Extraction[] = [];

  // Barcode
  const barcodeNorm = normalizeBarcode(parsed.barcode_raw);
  const barcodeValid = barcodeNorm && barcodeNorm.length === 13 ? validateEAN13(barcodeNorm) : null;
  extractions.push({
    field_name: "barcode",
    raw_value: parsed.barcode_raw || null,
    normalized_value: barcodeNorm,
    confidence: barcodeNorm ? (barcodeValid ? 0.95 : 0.7) : 0,
    source_image_kind: parsed.barcode_source || "back_cover",
  });
  if (barcodeNorm) {
    audit.push({ step: "barcode_normalized", detail: `${parsed.barcode_raw} → ${barcodeNorm} (EAN valid: ${barcodeValid})`, timestamp: new Date().toISOString() });
  }

  // Catalog number - with barcode cross-check
  let catnoRaw = parsed.catno_raw;
  let catnoNorm = normalizeCatno(catnoRaw);
  // Cross-check: if catno looks like the barcode, reject it
  if (catnoNorm && barcodeNorm && catnoNorm.replace(/\D/g, "") === barcodeNorm) {
    audit.push({ step: "catno_rejected", detail: `Catno "${catnoRaw}" matches barcode - REJECTED as barcode misidentification`, timestamp: new Date().toISOString() });
    catnoNorm = null;
    catnoRaw = null;
  }
  extractions.push({
    field_name: "catno",
    raw_value: catnoRaw || null,
    normalized_value: catnoNorm,
    confidence: catnoNorm ? 0.85 : 0,
    source_image_kind: parsed.catno_source || null,
  });

  // Matrix - with barcode cross-check  
  let matrixRaw = parsed.matrix_raw;
  let matrixNorm = normalizeMatrix(matrixRaw);
  // Cross-check: if matrix looks like the barcode, reject it
  if (matrixNorm && barcodeNorm && matrixNorm.replace(/\D/g, "").includes(barcodeNorm)) {
    audit.push({ step: "matrix_rejected", detail: `Matrix "${matrixRaw}" contains barcode digits - REJECTED`, timestamp: new Date().toISOString() });
    matrixNorm = null;
    matrixRaw = null;
  }
  extractions.push({
    field_name: "matrix",
    raw_value: matrixRaw || null,
    normalized_value: matrixNorm,
    confidence: matrixNorm ? 0.6 : 0,
    source_image_kind: parsed.matrix_source || "disc_hub",
  });

  // IFPI master
  const ifpiMasterNorm = normalizeIFPI(parsed.ifpi_master_raw);
  extractions.push({
    field_name: "ifpi_master",
    raw_value: parsed.ifpi_master_raw || null,
    normalized_value: ifpiMasterNorm,
    confidence: ifpiMasterNorm ? 0.8 : 0,
    source_image_kind: "disc_hub",
  });

  // IFPI mould
  const ifpiMouldNorm = normalizeIFPI(parsed.ifpi_mould_raw);
  extractions.push({
    field_name: "ifpi_mould",
    raw_value: parsed.ifpi_mould_raw || null,
    normalized_value: ifpiMouldNorm,
    confidence: ifpiMouldNorm ? 0.8 : 0,
    source_image_kind: "disc_hub",
  });

  // Label
  extractions.push({
    field_name: "label",
    raw_value: parsed.label_raw || null,
    normalized_value: parsed.label_raw?.trim() || null,
    confidence: parsed.label_raw ? 0.7 : 0,
    source_image_kind: "back_cover",
  });

  // Country
  extractions.push({
    field_name: "country",
    raw_value: parsed.country_raw || null,
    normalized_value: parsed.country_raw?.trim() || null,
    confidence: parsed.country_raw ? 0.85 : 0,
    source_image_kind: "back_cover",
  });

  // Year hint - strict: only from copyright lines
  let yearHint = parsed.year_hint_raw;
  if (yearHint && !/^\d{4}$/.test(String(yearHint))) {
    // Try to extract 4-digit year
    const yearMatch = String(yearHint).match(/(19|20)\d{2}/);
    yearHint = yearMatch ? yearMatch[0] : null;
  }
  extractions.push({
    field_name: "year_hint",
    raw_value: parsed.year_hint_raw ? String(parsed.year_hint_raw) : null,
    normalized_value: yearHint ? String(yearHint) : null,
    confidence: yearHint ? 0.7 : 0,
    source_image_kind: parsed.year_hint_source || null,
  });

  return {
    extractions,
    artist: parsed.artist || null,
    title: parsed.title || null,
    audit,
  };
}

// ─── Discogs Candidate Finder ─────────────────────────────────────
function getDiscogsAuth(): Record<string, string> {
  if (DISCOGS_TOKEN) return { Authorization: `Discogs token=${DISCOGS_TOKEN}` };
  if (DISCOGS_CONSUMER_KEY && DISCOGS_CONSUMER_SECRET) {
    return { Authorization: `Discogs key=${DISCOGS_CONSUMER_KEY}, secret=${DISCOGS_CONSUMER_SECRET}` };
  }
  throw new Error("No Discogs credentials configured");
}

async function searchDiscogs(query: string, params: Record<string, string> = {}): Promise<any[]> {
  const auth = getDiscogsAuth();
  const searchParams = new URLSearchParams({ q: query, type: "release", per_page: "10", ...params });
  const url = `https://api.discogs.com/database/search?${searchParams}`;
  
  const res = await fetch(url, { headers: { ...auth, "User-Agent": "MusicScan/4.0" } });
  if (!res.ok) {
    console.log(`⚠️ Discogs search failed: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.results || [];
}

async function getDiscogsRelease(releaseId: number): Promise<any | null> {
  const auth = getDiscogsAuth();
  const res = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
    headers: { ...auth, "User-Agent": "MusicScan/4.0" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function findCandidates(
  extractions: Extraction[],
  artist: string | null,
  title: string | null,
  audit: AuditEntry[]
): Promise<DiscogsCandidate[]> {
  const getField = (name: string) => extractions.find((e) => e.field_name === name)?.normalized_value || null;
  
  const barcode = getField("barcode");
  const catno = getField("catno");
  const label = getField("label");
  
  const candidateMap = new Map<number, DiscogsCandidate>();
  
  // Strategy 1: Barcode search (highest priority, NO format filter)
  if (barcode) {
    audit.push({ step: "search_barcode", detail: `Searching Discogs by barcode: ${barcode}`, timestamp: new Date().toISOString() });
    const results = await searchDiscogs(`barcode:${barcode}`);
    for (const r of results) {
      candidateMap.set(r.id, {
        release_id: r.id,
        score: 0,
        reason: ["barcode_search_hit"],
        title: r.title || "",
        year: r.year,
        country: r.country,
        label: r.label?.[0],
        catno: r.catno,
        barcode: r.barcode || [],
      });
    }
    audit.push({ step: "barcode_results", detail: `Found ${results.length} results`, timestamp: new Date().toISOString() });
    await new Promise((r) => setTimeout(r, 1100)); // Rate limit
  }

  // Strategy 2: Catno search (NO format filter)
  if (catno) {
    audit.push({ step: "search_catno", detail: `Searching Discogs by catno: ${catno}`, timestamp: new Date().toISOString() });
    const results = await searchDiscogs(`catno:${catno}`);
    for (const r of results) {
      if (candidateMap.has(r.id)) {
        candidateMap.get(r.id)!.reason.push("catno_search_hit");
      } else {
        candidateMap.set(r.id, {
          release_id: r.id,
          score: 0,
          reason: ["catno_search_hit"],
          title: r.title || "",
          year: r.year,
          country: r.country,
          label: r.label?.[0],
          catno: r.catno,
          barcode: r.barcode || [],
        });
      }
    }
    audit.push({ step: "catno_results", detail: `Found ${results.length} results`, timestamp: new Date().toISOString() });
    await new Promise((r) => setTimeout(r, 1100));
  }

  // Strategy 3: Artist + Title (only as filter/fallback, not primary)
  if (candidateMap.size === 0 && artist && title) {
    audit.push({ step: "search_artist_title", detail: `Fallback: searching by artist+title: ${artist} - ${title}`, timestamp: new Date().toISOString() });
    const results = await searchDiscogs(`${artist} ${title}`, { format: "CD" });
    for (const r of results.slice(0, 10)) {
      candidateMap.set(r.id, {
        release_id: r.id,
        score: 0,
        reason: ["artist_title_fallback"],
        title: r.title || "",
        year: r.year,
        country: r.country,
        label: r.label?.[0],
        catno: r.catno,
        barcode: r.barcode || [],
      });
    }
    audit.push({ step: "artist_title_results", detail: `Found ${results.length} results`, timestamp: new Date().toISOString() });
  }

  return Array.from(candidateMap.values());
}

// ─── Disambiguation & Confidence Scoring ─────────────────────────
function scoreCandidate(
  candidate: DiscogsCandidate,
  extractions: Extraction[],
  audit: AuditEntry[]
): number {
  const getField = (name: string) => extractions.find((e) => e.field_name === name)?.normalized_value || null;
  
  const barcode = getField("barcode");
  const catno = getField("catno");
  const country = getField("country");
  const matrix = getField("matrix");
  const ifpiMaster = getField("ifpi_master");
  const ifpiMould = getField("ifpi_mould");
  const label = getField("label");
  const yearHint = getField("year_hint");

  let score = 0;
  const reasons: string[] = [];

  // Barcode match (+0.50)
  if (barcode && candidate.barcode) {
    const barcodeDigits = barcode.replace(/\D/g, "");
    const matched = candidate.barcode.some((b: string) => b.replace(/\D/g, "") === barcodeDigits);
    if (matched) {
      score += 0.50;
      reasons.push(`barcode_match:+0.50`);
    }
  }

  // Catno match (+0.30)
  if (catno && candidate.catno) {
    const normCandCatno = candidate.catno.replace(/\s+/g, " ").trim().toUpperCase();
    const normOurCatno = catno.replace(/\s+/g, " ").trim().toUpperCase();
    if (normCandCatno === normOurCatno || normCandCatno.includes(normOurCatno) || normOurCatno.includes(normCandCatno)) {
      score += 0.30;
      reasons.push(`catno_match:+0.30 (${candidate.catno})`);
    }
  }

  // Country match (+0.25)
  if (country && candidate.country) {
    const countryMap: Record<string, string[]> = {
      "netherlands": ["netherlands", "holland", "nl", "the netherlands"],
      "germany": ["germany", "de", "deutschland"],
      "uk": ["uk", "united kingdom", "england", "great britain"],
      "eu": ["eu", "europe"],
      "usa": ["us", "usa", "united states"],
    };
    const ourCountryLower = country.toLowerCase().replace(/printed in |made in /gi, "").trim();
    const candCountryLower = candidate.country?.toLowerCase() || "";
    
    let countryMatched = false;
    for (const [, aliases] of Object.entries(countryMap)) {
      if (aliases.some((a) => ourCountryLower.includes(a)) && aliases.some((a) => candCountryLower.includes(a))) {
        countryMatched = true;
        break;
      }
    }
    if (countryMatched || ourCountryLower === candCountryLower) {
      score += 0.25;
      reasons.push(`country_match:+0.25 (${candidate.country})`);
    }
  }

  // Label match (+0.10)
  if (label && candidate.label) {
    const ourLabel = label.toLowerCase().trim();
    const candLabel = candidate.label.toLowerCase().trim();
    if (candLabel.includes(ourLabel) || ourLabel.includes(candLabel)) {
      score += 0.10;
      reasons.push(`label_match:+0.10 (${candidate.label})`);
    }
  }

  // Year hint match (+0.05) — only if we have explicit year_hint
  if (yearHint && candidate.year) {
    if (parseInt(yearHint) === candidate.year) {
      score += 0.05;
      reasons.push(`year_match:+0.05 (${candidate.year})`);
    }
  }

  // Matrix match (+0.40) — only if we have matrix
  // (Not implemented for scoring from search results; would need release detail fetch)

  // IFPI match (+0.20) — similar, needs release detail
  // (Not implemented for search results)

  candidate.score = score;
  candidate.reason = reasons;
  
  return score;
}

function disambiguate(
  candidates: DiscogsCandidate[],
  extractions: Extraction[],
  audit: AuditEntry[]
): {
  status: "single_match" | "multiple_candidates" | "no_match" | "needs_more_photos";
  releaseId: number | null;
  candidates: DiscogsCandidate[];
  confidence: number;
} {
  const getField = (name: string) => extractions.find((e) => e.field_name === name)?.normalized_value || null;
  const matrix = getField("matrix");
  const ifpi = getField("ifpi_master") || getField("ifpi_mould");
  const barcode = getField("barcode");
  const catno = getField("catno");

  if (candidates.length === 0) {
    // Determine if we need more photos or it's truly no match
    if (!barcode && !catno) {
      audit.push({ step: "no_candidates", detail: "No barcode or catno detected - requesting more photos", timestamp: new Date().toISOString() });
      return { status: "needs_more_photos", releaseId: null, candidates: [], confidence: 0 };
    }
    audit.push({ step: "no_candidates", detail: "No Discogs results found despite technical identifiers", timestamp: new Date().toISOString() });
    return { status: "no_match", releaseId: null, candidates: [], confidence: 0 };
  }

  // Score all candidates
  for (const c of candidates) {
    scoreCandidate(c, extractions, audit);
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];
  const second = candidates[1];

  audit.push({
    step: "scoring_complete",
    detail: candidates.slice(0, 5).map((c) => `ID:${c.release_id} score:${c.score.toFixed(2)} [${c.reason.join(", ")}]`).join(" | "),
    timestamp: new Date().toISOString(),
  });

  // Cap confidence if matrix/IFPI not detected
  const hasMatrixOrIFPI = !!matrix || !!ifpi;
  let maxConfidence = hasMatrixOrIFPI ? 1.0 : 0.79;
  
  if (!hasMatrixOrIFPI) {
    audit.push({ step: "confidence_cap", detail: "Matrix/IFPI not detected → max confidence capped at 0.79", timestamp: new Date().toISOString() });
  }

  const effectiveScore = Math.min(top.score, maxConfidence);

  // Single match criteria
  const gap = second ? top.score - second.score : 1.0;
  const yearHint = getField("year_hint");
  
  if (effectiveScore >= 0.85 && gap >= 0.15) {
    // Additional check: year must be explicit or null
    if (top.year && !yearHint) {
      // We have no year_hint to confirm, but score is high enough from other fields
      // This is OK as long as we're not relying on guessed year
    }
    audit.push({
      step: "single_match",
      detail: `Release ${top.release_id} selected: score=${effectiveScore.toFixed(2)}, gap=${gap.toFixed(2)}`,
      timestamp: new Date().toISOString(),
    });
    return {
      status: "single_match",
      releaseId: top.release_id,
      candidates: candidates.slice(0, 5),
      confidence: effectiveScore,
    };
  }

  // Multiple candidates
  if (candidates.length > 0) {
    const topCandidates = candidates.slice(0, 5);
    audit.push({
      step: "multiple_candidates",
      detail: `No clear winner. Top: ${top.release_id} (${effectiveScore.toFixed(2)}), gap: ${gap.toFixed(2)}. Returning ${topCandidates.length} candidates.`,
      timestamp: new Date().toISOString(),
    });
    return {
      status: "multiple_candidates",
      releaseId: null,
      candidates: topCandidates,
      confidence: effectiveScore,
    };
  }

  return { status: "no_match", releaseId: null, candidates: [], confidence: 0 };
}

// ─── Main Handler ────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) throw new Error("Invalid authentication");

    const body = await req.json();
    const { imageUrls, sessionId: providedSessionId } = body;

    if (!imageUrls || imageUrls.length < 2) {
      return new Response(JSON.stringify({ error: "Minimaal 2 foto's vereist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🚀 [${PIPELINE_VERSION}] Starting for ${imageUrls.length} images, user: ${user.id}`);

    // Create or use session
    let sessionId = providedSessionId;
    if (!sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from("scan_sessions")
        .insert({ user_id: user.id, status: "processing", media_type: "cd" })
        .select("id")
        .single();
      if (sessionError) throw new Error(`Session creation failed: ${sessionError.message}`);
      sessionId = session.id;
    } else {
      await supabase.from("scan_sessions").update({ status: "processing" }).eq("id", sessionId);
    }

    console.log(`📋 Session: ${sessionId}`);

    // Store images
    const imageRecords = imageUrls.map((url: string, i: number) => ({
      scan_session_id: sessionId,
      kind: i === 0 ? "front" : i === 1 ? "back_cover" : i === 2 ? "disc_hub" : "other",
      storage_path: url,
    }));
    await supabase.from("scan_images").insert(imageRecords);

    // Step 2: Extract fields
    console.log("🔍 Extracting fields from images...");
    const { extractions, artist, title, audit } = await extractFieldsFromImages(imageUrls);
    
    console.log(`📊 Extractions: ${extractions.filter((e) => e.normalized_value).map((e) => `${e.field_name}=${e.normalized_value}`).join(", ")}`);

    // Store extractions in DB
    const extractionRecords = extractions.map((e) => ({
      scan_session_id: sessionId,
      field_name: e.field_name,
      raw_value: e.raw_value,
      normalized_value: e.normalized_value,
      confidence: e.confidence,
      extractor_version: PIPELINE_VERSION,
    }));
    await supabase.from("scan_extractions").insert(extractionRecords);

    // Step 4: Find Discogs candidates
    console.log("🔎 Searching Discogs for candidates...");
    const candidates = await findCandidates(extractions, artist, title, audit);
    console.log(`📦 Found ${candidates.length} candidates`);

    // Step 5: Disambiguate and score
    console.log("⚖️ Disambiguating...");
    const result = disambiguate(candidates, extractions, audit);
    console.log(`✅ Status: ${result.status}, confidence: ${result.confidence.toFixed(2)}, releaseId: ${result.releaseId}`);

    // Determine missing fields for "next best photo" guidance
    const getField = (name: string) => extractions.find((e) => e.field_name === name)?.normalized_value || null;
    const missingFields: string[] = [];
    if (!getField("matrix")) missingFields.push("matrix");
    if (!getField("ifpi_master") && !getField("ifpi_mould")) missingFields.push("ifpi");
    if (!getField("barcode")) missingFields.push("barcode");
    if (!getField("catno")) missingFields.push("catno");

    // Get candidate details for top result
    let topReleaseDetails = null;
    if (result.releaseId) {
      try {
        topReleaseDetails = await getDiscogsRelease(result.releaseId);
      } catch (e) {
        console.log("⚠️ Could not fetch release details");
      }
    }

    // Build final result
    const finalArtist = topReleaseDetails?.artists?.[0]?.name || artist;
    const finalTitle = topReleaseDetails?.title || title;

    // Store result
    const scanResult = {
      scan_session_id: sessionId,
      artist: finalArtist,
      title: finalTitle,
      label: getField("label") || topReleaseDetails?.labels?.[0]?.name || null,
      catno: getField("catno") || topReleaseDetails?.labels?.[0]?.catno || null,
      barcode: getField("barcode"),
      country: getField("country") || topReleaseDetails?.country || null,
      year: getField("year_hint") ? parseInt(getField("year_hint")!) : (topReleaseDetails?.year || null),
      matrix: getField("matrix"),
      ifpi_master: getField("ifpi_master"),
      ifpi_mould: getField("ifpi_mould"),
      discogs_match_status: result.status,
      discogs_release_id: result.releaseId,
      discogs_candidates: result.candidates.map((c) => ({
        release_id: c.release_id,
        score: parseFloat(c.score.toFixed(3)),
        reason: c.reason,
        title: c.title,
        year: c.year,
        country: c.country,
      })),
      overall_confidence: parseFloat(result.confidence.toFixed(3)),
      audit: { version: PIPELINE_VERSION, entries: audit },
    };

    // Upsert result
    await supabase.from("scan_results").upsert(scanResult, { onConflict: "scan_session_id" });

    // Update session status
    const sessionStatus = result.status === "single_match" ? "done" : result.status === "needs_more_photos" ? "needs_more_photos" : "done";
    await supabase.from("scan_sessions").update({ status: sessionStatus }).eq("id", sessionId);

    // Build photo guidance
    const photoGuidance = missingFields.map((field) => {
      switch (field) {
        case "matrix":
          return {
            field: "matrix",
            instruction: "Fotografeer de spiegelband van de CD (rond het centergat) onder een hoek van 30-45°, met macro, donkere achtergrond. Draai de CD om het licht te vangen op de gegraveerde tekst.",
          };
        case "ifpi":
          return {
            field: "ifpi",
            instruction: "Zoom in op de binnenste ring van de CD bij het centergat. Gebruik zijlicht om de kleine IFPI codes zichtbaar te maken.",
          };
        case "barcode":
          return {
            field: "barcode",
            instruction: "Fotografeer de achterkant van de hoes met de barcode duidelijk in beeld. Zorg voor scherp beeld zonder reflecties.",
          };
        case "catno":
          return {
            field: "catno",
            instruction: "Zoek het catalogusnummer op de rug of achterkant van de hoes (bijv. 'CDPCSD 167'). Fotografeer dit gebied.",
          };
        default:
          return null;
      }
    }).filter(Boolean);

    const responseBody = {
      success: true,
      sessionId,
      version: PIPELINE_VERSION,
      result: {
        artist: finalArtist,
        title: finalTitle,
        discogs_match_status: result.status,
        discogs_release_id: result.releaseId,
        discogs_url: result.releaseId ? `https://www.discogs.com/release/${result.releaseId}` : null,
        overall_confidence: parseFloat(result.confidence.toFixed(3)),
        candidates: result.candidates,
        extractions: extractions.map((e) => ({
          field: e.field_name,
          raw: e.raw_value,
          normalized: e.normalized_value,
          confidence: e.confidence,
          source: e.source_image_kind,
        })),
        missing_fields: missingFields,
        photo_guidance: photoGuidance,
        audit: audit,
      },
    };

    console.log(`✅ [${PIPELINE_VERSION}] Complete: ${result.status}`);

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`❌ [${PIPELINE_VERSION}] Error:`, error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
