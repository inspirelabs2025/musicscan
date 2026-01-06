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

  // PASS 1: Spelling-based OCR extraction
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
  "year": null,
  "label": "record label name if visible",
  "ocr_notes": "describe what text you actually see on the cover"
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
    format: 'CD',
    country: null,
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

// Discogs search
async function searchDiscogs(catalogNumber: string | null, artist: string | null, title: string | null, barcode: string | null): Promise<any | null> {
  console.log('🔍 Discogs search:', { catalogNumber, artist, title, barcode });
  
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

  const queries = [];
  if (barcode) queries.push(`barcode:${barcode}`);
  if (catalogNumber) queries.push(`catno:${catalogNumber}`);
  if (artist && title) queries.push(`${artist} ${title}`);

  for (const q of queries) {
    try {
      const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(q)}&type=release&format=CD&per_page=3`;
      const res = await fetch(url, { headers: { ...auth, 'User-Agent': 'MusicScan/3.0' } });
      
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length > 0) {
          const match = data.results[0];
          console.log('✅ Discogs match:', match.id, match.title);
          return {
            discogs_id: match.id,
            discogs_url: `https://www.discogs.com/release/${match.id}`,
            cover_image: match.cover_image,
            title: match.title,
            year: match.year
          };
        }
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error('Discogs error:', e);
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls } = await req.json();
    console.log(`📸 [${CD_FUNCTION_VERSION}] Received ${imageUrls?.length || 0} images`);

    if (!imageUrls || imageUrls.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 images required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Two-pass OCR
    const ocrResult = await performTwoPassOCR(imageUrls);
    console.log('📝 OCR result:', JSON.stringify(ocrResult));

    // Discogs search
    let discogsData = null;
    if (ocrResult.barcode || ocrResult.catalog_number || (ocrResult.artist && ocrResult.title)) {
      discogsData = await searchDiscogs(
        ocrResult.catalog_number,
        ocrResult.artist,
        ocrResult.title,
        ocrResult.barcode
      );
    }

    // Merge results
    const finalResult = {
      ...ocrResult,
      discogs_id: discogsData?.discogs_id || null,
      discogs_url: discogsData?.discogs_url || null,
      cover_image: discogsData?.cover_image || null,
    };

    // If Discogs found a match and OCR wasn't confident, prefer Discogs data
    if (discogsData && !ocrResult.confidence.verified) {
      console.log('📝 Using Discogs data due to low OCR confidence');
      // Parse Discogs title format "Artist - Title"
      if (discogsData.title?.includes(' - ')) {
        const [artist, title] = discogsData.title.split(' - ', 2);
        finalResult.artist = artist.trim();
        finalResult.title = title.trim();
        finalResult.confidence.overall = 0.8;
        finalResult.ocr_notes = `${ocrResult.ocr_notes}\n✅ Bevestigd via Discogs lookup.`;
      }
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
