// V3.0 - Two-Pass Verification System to prevent AI hallucination
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CD_FUNCTION_VERSION = "V3.0-TWO-PASS-VERIFICATION";
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
const DISCOGS_CONSUMER_KEY = Deno.env.get('DISCOGS_CONSUMER_KEY');
const DISCOGS_CONSUMER_SECRET = Deno.env.get('DISCOGS_CONSUMER_SECRET');

console.log(`🚀 CD ANALYSIS ${CD_FUNCTION_VERSION}`);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Two-Pass OCR Analysis
async function performTwoPassOCR(imageUrls: string[]): Promise<any> {
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const imageContent = imageUrls.map((url: string) => ({
    type: "image_url",
    image_url: { url }
  }));

  // PASS 1: Spelling-based OCR extraction with enhanced data fields
  const pass1Prompt = `YOU ARE A TEXT READER, NOT AN IMAGE RECOGNIZER.

CRITICAL: Do NOT recognize album covers. Do NOT use your knowledge of music.
You must READ and SPELL the actual printed text character by character.

SPELLING TASK:
1. Look at the FRONT COVER image
2. Find the LARGEST text - this is usually the artist name
3. SPELL IT OUT letter by letter (e.g., "Q-U-E-E-N" not "Queen")
4. Find the second largest text - this is usually the album title
5. SPELL IT OUT letter by letter

Then look at the BACK COVER:
- Find the barcode number (13 digits near barcode)
- Find the catalog number (alphanumeric code like "CDP 7 46208 2")
- Find the matrix/mastering code (often near the inner ring of the CD, like "DIDP-10614" or stamped codes)

Look at the CD DISC surface:
- Find the matrix/mastering code (etched or printed near center hole)
- Common formats: "DIDP-XXXXX", "DADC", "PMDC", alphanumeric codes

**IFPI CODE EXTRACTION (CRITICAL - STRIKTE REGELS)**
Look carefully for IFPI codes on the CD disc inner ring area. There are TWO types:

1. IFPI MASTERING CODE (identificeert mastering facility):
   - Format: "IFPI Lxxx" or "IFPI LYxx" (L/LY prefix + 2-4 chars)
   - Examples: "IFPI L003", "IFPI LY12", "IFPI LZ45"
   
2. IFPI MOULD CODE (identificeert persmachine):
   - Format: "IFPI xxxx" (exact 4 alfanumerieke tekens, GEEN L/LY prefix)
   - Examples: "IFPI 94A1", "IFPI 1234", "IFPI AB12"

A CD can have BOTH types - look for multiple IFPI codes!
IFPI codes are NEVER part of the matrix number - keep them SEPARATE.

IMPORTANT:
- If you see "QUEEN" printed, spell it as "Q-U-E-E-N"
- If you see "NEIL YOUNG" printed, spell it as "N-E-I-L Y-O-U-N-G"
- Do NOT guess based on what album this looks like
- ONLY report text you can PHYSICALLY see printed

Return JSON:
{
  "artist_spelled": "letter-by-letter spelling of artist from front cover",
  "title_spelled": "letter-by-letter spelling of title from front cover", 
  "catalog_number": "exact catalog code from back",
  "barcode": "13 digit barcode number",
  "matrix_number": "matrix/mastering code from CD disc or back cover - EXCLUDE any IFPI codes!",
  "ifpi_mastering": "IFPI mastering code (format: IFPI Lxxx or IFPI LYxx) or null if not found",
  "ifpi_mould": "IFPI mould code (format: IFPI xxxx, 4 chars, no L prefix) or null if not found",
  "year": null,
  "label": "record label name if visible",
  "country": "country of manufacture if visible (e.g., Made in Germany)",
  "ocr_notes": "describe what text you actually see on the cover and disc, including ALL IFPI codes found"
}`;

  console.log('🔍 PASS 1: Spelling-based OCR extraction...');
  const pass1Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: pass1Prompt }, ...imageContent]
      }],
      max_tokens: 1000,
    }),
  });

  if (!pass1Response.ok) {
    const errorText = await pass1Response.text();
    console.error('❌ Pass 1 API error:', pass1Response.status, errorText);
    
    if (pass1Response.status === 429) {
      throw new Error('Rate limit exceeded, please try again later');
    }
    if (pass1Response.status === 402) {
      throw new Error('API credits exhausted');
    }
    throw new Error(`API error: ${pass1Response.status}`);
  }

  const pass1Data = await pass1Response.json();
  const pass1Content = pass1Data.choices?.[0]?.message?.content;
  console.log('📝 PASS 1 raw response:', pass1Content);

  // Parse Pass 1 result
  let pass1Result;
  try {
    const jsonMatch = pass1Content.match(/\{[\s\S]*\}/);
    pass1Result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch (e) {
    console.error('❌ Failed to parse Pass 1:', e);
    pass1Result = { ocr_notes: pass1Content };
  }

  console.log('📝 PASS 1 parsed:', JSON.stringify(pass1Result));

  // Convert spelled text to normal text
  const convertSpelling = (spelled: string | null): string | null => {
    if (!spelled) return null;
    return spelled.replace(/-/g, '').replace(/\s+/g, ' ').trim();
  };

  const extractedArtist = convertSpelling(pass1Result.artist_spelled);
  const extractedTitle = convertSpelling(pass1Result.title_spelled);

  console.log('📝 Extracted artist:', extractedArtist);
  console.log('📝 Extracted title:', extractedTitle);

  // PASS 2: Verification
  let verified = true;
  let verificationNotes = '';

  if (extractedArtist || extractedTitle) {
    const pass2Prompt = `VERIFICATION TASK - Look at the FRONT COVER image only.

I need you to verify if specific text is PHYSICALLY PRINTED on the cover.

Question 1: Is the text "${extractedArtist || 'unknown'}" actually printed/written on the front cover?
- Look for these exact letters printed on the cover
- Answer: YES if you can see these letters, NO if not

Question 2: Is the text "${extractedTitle || 'unknown'}" actually printed/written on the front cover?
- Look for these exact letters printed on the cover  
- Answer: YES if you can see these letters, NO if not

Return JSON:
{
  "artist_visible": true or false,
  "title_visible": true or false,
  "what_i_actually_see": "describe the main text you see on the front cover"
}`;

    console.log('🔍 PASS 2: Verification...');
    try {
      const pass2Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: pass2Prompt },
              { type: 'image_url', image_url: { url: imageUrls[0] } }
            ]
          }],
          max_tokens: 500,
        }),
      });

      if (pass2Response.ok) {
        const pass2Data = await pass2Response.json();
        const pass2Content = pass2Data.choices?.[0]?.message?.content;
        console.log('📝 PASS 2 raw response:', pass2Content);

        try {
          const jsonMatch = pass2Content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const pass2Result = JSON.parse(jsonMatch[0]);
            console.log('📝 PASS 2 parsed:', JSON.stringify(pass2Result));
            
            verified = pass2Result.artist_visible === true || pass2Result.title_visible === true;
            verificationNotes = pass2Result.what_i_actually_see || '';
            
            console.log('✅ Verification result:', verified ? 'VERIFIED' : 'NOT VERIFIED');
            console.log('📝 What AI sees:', verificationNotes);
          }
        } catch (e) {
          console.error('⚠️ Failed to parse Pass 2:', e);
          verified = false;
          verificationNotes = pass2Content;
        }
      }
    } catch (e) {
      console.warn('⚠️ Pass 2 failed, continuing:', e);
    }
  }

  // Calculate confidence
  const confidence = {
    artist: verified ? 0.9 : 0.3,
    title: verified ? 0.85 : 0.3,
    overall: verified ? 0.85 : 0.3,
    verified
  };

  return {
    artist: extractedArtist || null,
    title: extractedTitle || null,
    year: pass1Result.year || null,
    label: pass1Result.label || null,
    catalog_number: pass1Result.catalog_number || null,
    barcode: pass1Result.barcode || null,
    matrix_number: pass1Result.matrix_number || null,
    ifpi_mastering: pass1Result.ifpi_mastering || null,
    ifpi_mould: pass1Result.ifpi_mould || null,
    format: 'CD',
    country: pass1Result.country || null,
    genre: null,
    confidence,
    ocr_notes: verified 
      ? pass1Result.ocr_notes 
      : `⚠️ Verificatie mislukt. AI ziet: ${verificationNotes || pass1Result.ocr_notes}`,
    raw_spelling: {
      artist: pass1Result.artist_spelled,
      title: pass1Result.title_spelled
    }
  };
}

// CD Matching Hierarchy v3.1:
// 1. Matrix number (PRIMARY SEARCH KEY)
// 2. Catalog number (SECONDARY VALIDATION - confirms matrix match)
// 3. Barcode (tertiary)
// 4. Artist + Title (fallback)
// 
// DUAL VALIDATION STRATEGY:
// - Search Discogs by matrix number
// - OCR-extracted catalog validates the matrix match
// - IFPI codes boost confidence (NOT search keys)

interface DiscogsSearchParams {
  matrixNumber: string | null;
  catalogNumber: string | null;  // Used for VALIDATION, not primary search
  barcode: string | null;
  artist: string | null;
  title: string | null;
  label: string | null;
  country: string | null;
  ifpiMastering: string | null;   // Confidence booster only
  ifpiMould: string | null;       // Confidence booster only
}

async function searchDiscogsWithMatrix(params: DiscogsSearchParams): Promise<any | null> {
  console.log('🔍 CD Discogs search (matrix-first):', params);
  
  const token = DISCOGS_TOKEN;
  const key = DISCOGS_CONSUMER_KEY;
  const secret = DISCOGS_CONSUMER_SECRET;
  
  if (!token && (!key || !secret)) {
    console.log('⚠️ No Discogs credentials');
    return null;
  }

  const auth = token 
    ? { 'Authorization': `Discogs token=${token}` }
    : { 'Authorization': `Discogs key=${key}, secret=${secret}` };
  
  const headers = { ...auth, 'User-Agent': 'MusicScan/3.0' };

  // Build search queries in priority order (matrix-first for CDs)
  const queries: { query: string; type: string; priority: number }[] = [];
  
  // Priority 1: Matrix number (primary identifier for CDs)
  if (params.matrixNumber) {
    // Clean matrix for search - remove common prefixes/suffixes
    const cleanMatrix = params.matrixNumber
      .replace(/[#*~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    queries.push({ query: cleanMatrix, type: 'matrix', priority: 1 });
  }
  
  // Priority 2: Catalog number
  if (params.catalogNumber) {
    queries.push({ query: `catno:${params.catalogNumber}`, type: 'catno', priority: 2 });
  }
  
  // Priority 3: Barcode
  if (params.barcode) {
    queries.push({ query: `barcode:${params.barcode}`, type: 'barcode', priority: 3 });
  }
  
  // Priority 4: Artist + Title (fallback)
  if (params.artist && params.title) {
    queries.push({ query: `${params.artist} ${params.title}`, type: 'artist_title', priority: 4 });
  }

  // Sort by priority
  queries.sort((a, b) => a.priority - b.priority);
  
  console.log('📋 Search order:', queries.map(q => `${q.type}: "${q.query}"`));

  let bestMatch: any = null;
  let matchConfidence = 0;

  for (const { query, type, priority } of queries) {
    try {
      const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=CD&per_page=5`;
      console.log(`🔎 Trying ${type} search: ${query}`);
      
      const res = await fetch(url, { headers });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.results?.length > 0) {
          console.log(`📦 Found ${data.results.length} results for ${type}`);
          
          // For matrix search, we need to verify by fetching release details
          for (const result of data.results.slice(0, 3)) {
            const releaseData = await fetchReleaseDetails(result.id, headers);
            await new Promise(r => setTimeout(r, 200)); // Rate limit
            
            if (releaseData) {
              // Calculate match confidence based on available data
              let confidence = 0;
              const matchReasons: string[] = [];
              
              // Matrix match is strongest signal (PRIMARY)
              const matrixMatch = type === 'matrix' && releaseData.identifiers?.some((id: any) => 
                id.type === 'Matrix / Runout' && 
                id.value?.toLowerCase().includes(params.matrixNumber?.toLowerCase().slice(0, 8) || '')
              );
              if (matrixMatch) {
                confidence += 0.4;
                matchReasons.push('matrix_primary');
              }
              
              // Catalog number VALIDATES the matrix match (SECONDARY CONFIRMATION)
              // OCR reads catalog → confirms Discogs release is correct
              const discogsCatno = releaseData.labels?.[0]?.catno?.toLowerCase()?.replace(/[\s-]/g, '') || '';
              const ocrCatno = params.catalogNumber?.toLowerCase()?.replace(/[\s-]/g, '') || '';
              
              if (ocrCatno && discogsCatno) {
                // Check for exact match or partial match (OCR might miss characters)
                const exactMatch = discogsCatno === ocrCatno;
                const partialMatch = discogsCatno.includes(ocrCatno) || ocrCatno.includes(discogsCatno);
                
                if (exactMatch) {
                  confidence += 0.35;  // Strong validation
                  matchReasons.push('catno_exact_validation');
                  console.log(`✅ Catalog validation: OCR "${params.catalogNumber}" = Discogs "${releaseData.labels?.[0]?.catno}"`);
                } else if (partialMatch && (ocrCatno.length >= 4 || discogsCatno.length >= 4)) {
                  confidence += 0.2;   // Partial validation
                  matchReasons.push('catno_partial_validation');
                  console.log(`🔶 Partial catalog match: OCR "${params.catalogNumber}" ~ Discogs "${releaseData.labels?.[0]?.catno}"`);
                } else {
                  // Catalog mismatch - reduce confidence!
                  confidence -= 0.1;
                  matchReasons.push('catno_mismatch');
                  console.log(`⚠️ Catalog mismatch: OCR "${params.catalogNumber}" ≠ Discogs "${releaseData.labels?.[0]?.catno}"`);
                }
              }
              
              // IFPI validation (secondary signal, NOT search key)
              if (params.ifpiMastering || params.ifpiMould) {
                const releaseIdentifiers = releaseData.identifiers || [];
                const hasIfpiMatch = releaseIdentifiers.some((id: any) => {
                  if (id.type !== 'Mould SID Code' && id.type !== 'Mastering SID Code') return false;
                  const val = id.value?.toUpperCase() || '';
                  return (params.ifpiMastering && val.includes(params.ifpiMastering.replace('IFPI ', ''))) ||
                         (params.ifpiMould && val.includes(params.ifpiMould.replace('IFPI ', '')));
                });
                if (hasIfpiMatch) {
                  confidence += 0.15;
                  matchReasons.push('ifpi_validated');
                }
              }
              
              // Label/country match
              if (params.label && releaseData.labels?.some((l: any) => 
                l.name?.toLowerCase().includes(params.label?.toLowerCase() || '')
              )) {
                confidence += 0.05;
                matchReasons.push('label');
              }
              
              if (params.country && releaseData.country?.toLowerCase() === params.country?.toLowerCase()) {
                confidence += 0.05;
                matchReasons.push('country');
              }
              
              console.log(`🎯 Release ${result.id}: confidence ${confidence.toFixed(2)} (${matchReasons.join(', ')})`);
              
              if (confidence > matchConfidence) {
                matchConfidence = confidence;
                bestMatch = {
                  discogs_id: result.id,
                  discogs_url: `https://www.discogs.com/release/${result.id}`,
                  cover_image: result.cover_image || releaseData.images?.[0]?.uri,
                  title: result.title,
                  year: releaseData.year || result.year,
                  // Extract catalog number from release details
                  catalog_number: releaseData.labels?.[0]?.catno || null,
                  label: releaseData.labels?.[0]?.name || null,
                  country: releaseData.country || null,
                  genre: releaseData.genres?.[0] || null,
                  match_confidence: confidence,
                  match_reasons: matchReasons
                };
                
                // If we have a very high confidence match, stop searching
                if (confidence >= 0.7) {
                  console.log(`✅ High confidence match found: ${result.id}`);
                  return bestMatch;
                }
              }
            }
          }
        }
      }
      
      await new Promise(r => setTimeout(r, 300)); // Rate limit between searches
    } catch (e) {
      console.error(`Discogs ${type} search error:`, e);
    }
  }
  
  if (bestMatch) {
    console.log(`✅ Best match: ${bestMatch.discogs_id} (confidence: ${matchConfidence.toFixed(2)})`);
  } else {
    console.log('❌ No Discogs match found');
  }
  
  return bestMatch;
}

// Fetch detailed release info for validation
async function fetchReleaseDetails(releaseId: number, headers: Record<string, string>): Promise<any | null> {
  try {
    const url = `https://api.discogs.com/releases/${releaseId}`;
    const res = await fetch(url, { headers });
    
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error(`Failed to fetch release ${releaseId}:`, e);
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({} as any));

    const imageUrls: string[] | null = Array.isArray(body.imageUrls)
      ? body.imageUrls
      : Array.isArray(body.imageBase64)
        ? body.imageBase64
        : Array.isArray(body.image_base64)
          ? body.image_base64
          : null;

    const sourceField = Array.isArray(body.imageUrls)
      ? 'imageUrls'
      : Array.isArray(body.imageBase64)
        ? 'imageBase64'
        : Array.isArray(body.image_base64)
          ? 'image_base64'
          : 'unknown';

    console.log(`📦 [${CD_FUNCTION_VERSION}] Payload keys: ${Object.keys(body || {}).join(', ')}`);
    console.log(`📸 [${CD_FUNCTION_VERSION}] Received ${imageUrls?.length || 0} images (source: ${sourceField})`);

    if (!imageUrls || imageUrls.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 images required', expected: 'imageUrls[] (or imageBase64[])' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Two-pass OCR
    const ocrResult = await performTwoPassOCR(imageUrls);
    console.log('📝 OCR result:', JSON.stringify(ocrResult));

    // Discogs search with matrix-first hierarchy
    let discogsData = null;
    if (ocrResult.matrix_number || ocrResult.barcode || ocrResult.catalog_number || (ocrResult.artist && ocrResult.title)) {
      discogsData = await searchDiscogsWithMatrix({
        matrixNumber: ocrResult.matrix_number,
        catalogNumber: ocrResult.catalog_number,
        barcode: ocrResult.barcode,
        artist: ocrResult.artist,
        title: ocrResult.title,
        label: ocrResult.label,
        country: ocrResult.country,
        ifpiMastering: ocrResult.ifpi_mastering,
        ifpiMould: ocrResult.ifpi_mould
      });
    }

    // Merge results - Discogs provides catalog number if not found by OCR
    const finalResult = {
      ...ocrResult,
      discogs_id: discogsData?.discogs_id || null,
      discogs_url: discogsData?.discogs_url || null,
      cover_image: discogsData?.cover_image || null,
      // Use Discogs catalog number if OCR didn't find one
      catalog_number: ocrResult.catalog_number || discogsData?.catalog_number || null,
      // Enrich with Discogs data
      label: ocrResult.label || discogsData?.label || null,
      country: ocrResult.country || discogsData?.country || null,
      genre: ocrResult.genre || discogsData?.genre || null,
      year: ocrResult.year || discogsData?.year || null,
      match_confidence: discogsData?.match_confidence || null,
      match_reasons: discogsData?.match_reasons || null,
    };

    // Build validation status notes
    const validationNotes: string[] = [];
    
    if (ocrResult.matrix_number) {
      validationNotes.push(`Matrix: ${ocrResult.matrix_number}`);
    }
    if (ocrResult.catalog_number) {
      validationNotes.push(`Catalog (OCR): ${ocrResult.catalog_number}`);
    }
    if (discogsData?.catalog_number && discogsData.catalog_number !== ocrResult.catalog_number) {
      validationNotes.push(`Catalog (Discogs): ${discogsData.catalog_number}`);
    }
    
    // Dual validation feedback
    if (discogsData?.match_reasons) {
      if (discogsData.match_reasons.includes('catno_exact_validation')) {
        validationNotes.push('✅ Catalog bevestigt matrix match');
      } else if (discogsData.match_reasons.includes('catno_partial_validation')) {
        validationNotes.push('🔶 Catalog deels bevestigd');
      } else if (discogsData.match_reasons.includes('catno_mismatch')) {
        validationNotes.push('⚠️ Catalog komt niet overeen - controleer handmatig');
      }
    }

    // If Discogs found a match and OCR wasn't confident, prefer Discogs data
    if (discogsData && !ocrResult.confidence.verified) {
      console.log('📝 Using Discogs data due to low OCR confidence');
      // Parse Discogs title format "Artist - Title"
      if (discogsData.title?.includes(' - ')) {
        const [artist, title] = discogsData.title.split(' - ', 2);
        finalResult.artist = artist.trim();
        finalResult.title = title.trim();
        finalResult.confidence.overall = Math.max(0.8, discogsData.match_confidence || 0);
      }
    }
    
    // Add validation notes to ocr_notes
    if (validationNotes.length > 0) {
      finalResult.ocr_notes = `${ocrResult.ocr_notes}\n\n📋 Validatie:\n${validationNotes.join('\n')}`;
    }

    console.log('✅ Final result:', JSON.stringify(finalResult));

    return new Response(
      JSON.stringify(finalResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
