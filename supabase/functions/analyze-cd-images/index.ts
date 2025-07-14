import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

interface CDAnalysisRequest {
  imageUrls: string[];
  scanId: string;
}

interface OCRResult {
  artist?: string;
  title?: string;
  label?: string;
  catalog_number?: string;
  barcode?: string;
  year?: number;
  format?: string;
  country?: string;
  genre?: string;
}

async function performOCRAnalysis(imageUrls: string[]): Promise<OCRResult> {
  console.log('🔍 Starting OCR analysis for CD images');
  
  try {
    const messages = [
      {
        role: "system" as const,
        content: `You are a CD identification expert. Analyze the CD images and extract information.

PRIORITY ORDER:
1. BARCODE - If you see any barcode, extract the numbers with highest priority
2. FRONT COVER - Extract artist, album title, year, label
3. BACK COVER - Extract catalog number, additional info

For CDs, focus on:
- Barcode numbers (highest priority for direct lookup)
- Artist name and album title from front cover
- Record label name
- Catalog number (usually on back or spine)
- Year of release
- Genre if visible

Return ONLY a JSON object with these exact keys:
{
  "artist": "Artist Name",
  "title": "Album Title", 
  "label": "Record Label",
  "catalog_number": "CAT123",
  "barcode": "1234567890123",
  "year": 2023,
  "format": "CD",
  "country": "Country",
  "genre": "Genre"
}

Be precise and only include information you can clearly see. If uncertain, omit the field.`
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text",
            text: "Please analyze these CD images and extract the information. Focus especially on any barcode you can see."
          },
          ...imageUrls.map(url => ({
            type: "image_url" as const,
            image_url: {
              url: url,
              detail: "high" as const
            }
          }))
        ]
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('🤖 OpenAI raw response:', content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log('✅ Parsed OCR result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ OCR analysis failed:', error);
    throw error;
  }
}

async function searchDiscogs(catalogNumber: string, artist?: string, title?: string, barcode?: string) {
  console.log('🔍 Starting Discogs search for CD');
  
  const discogsToken = Deno.env.get('DISCOGS_TOKEN');
  const discogsConsumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY');
  const discogsConsumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET');
  
  if (!discogsToken && (!discogsConsumerKey || !discogsConsumerSecret)) {
    console.log('⚠️ No Discogs credentials available, skipping search');
    return null;
  }

  const authHeaders = discogsToken 
    ? { 'Authorization': `Discogs token=${discogsToken}` }
    : { 'Authorization': `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}` };

  try {
    // Try different search strategies
    const searchQueries = [];
    
    // Strategy 1: Barcode search (most accurate for CDs)
    if (barcode) {
      searchQueries.push(`barcode:"${barcode}"`);
    }
    
    // Strategy 2: Catalog number
    if (catalogNumber) {
      searchQueries.push(`catno:"${catalogNumber}"`);
      if (artist) {
        searchQueries.push(`catno:"${catalogNumber}" artist:"${artist}"`);
      }
    }
    
    // Strategy 3: Artist and title
    if (artist && title) {
      searchQueries.push(`artist:"${artist}" title:"${title}"`);
    }

    for (const query of searchQueries) {
      console.log(`🔍 Trying query: ${query}`);
      
      const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=CD&per_page=5`;
      
      const response = await fetch(searchUrl, {
        headers: {
          ...authHeaders,
          'User-Agent': 'VinylScanner/2.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const bestMatch = data.results[0];
          console.log(`✅ Found match: ${bestMatch.title} (ID: ${bestMatch.id})`);
          return {
            discogs_id: bestMatch.id,
            discogs_url: `https://www.discogs.com/release/${bestMatch.id}`,
            marketplace_url: `https://www.discogs.com/sell/release/${bestMatch.id}`,
            similarity_score: 0.9 // High confidence for first result
          };
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('❌ No Discogs match found');
    return null;
  } catch (error) {
    console.error('❌ Discogs search failed:', error);
    return null;
  }
}

async function saveToDatabase(scanId: string, ocrResults: OCRResult, imageUrls: string[], discogsData?: any) {
  console.log('💾 Saving CD scan to database');
  
  try {
    const { data, error } = await supabase
      .from('cd_scan')
      .insert({
        front_image: imageUrls[0] || null,
        back_image: imageUrls[1] || null,
        barcode_image: imageUrls[2] || null,
        barcode_number: ocrResults.barcode || null,
        artist: ocrResults.artist || null,
        title: ocrResults.title || null,
        label: ocrResults.label || null,
        catalog_number: ocrResults.catalog_number || null,
        year: ocrResults.year || null,
        format: 'CD',
        genre: ocrResults.genre || null,
        country: ocrResults.country || null,
        discogs_id: discogsData?.discogs_id || null,
        discogs_url: discogsData?.discogs_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database save error:', error);
      throw error;
    }

    console.log('✅ CD scan saved to database:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Failed to save to database:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls, scanId }: CDAnalysisRequest = await req.json();

    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('No images provided');
    }

    console.log(`🎵 Starting CD analysis for scan ${scanId} with ${imageUrls.length} images`);

    // Perform OCR analysis
    const ocrResults = await performOCRAnalysis(imageUrls);

    // Search Discogs for release ID
    const discogsData = await searchDiscogs(
      ocrResults.catalog_number || '', 
      ocrResults.artist, 
      ocrResults.title, 
      ocrResults.barcode
    );

    // Save to database with Discogs data
    const savedScan = await saveToDatabase(scanId, ocrResults, imageUrls, discogsData);

    const response = {
      success: true,
      scanId: savedScan.id,
      ocrResults: ocrResults,
      discogsData: discogsData,
      combinedResults: {
        artist: ocrResults.artist,
        title: ocrResults.title,
        label: ocrResults.label,
        catalog_number: ocrResults.catalog_number,
        barcode: ocrResults.barcode,
        year: ocrResults.year,
        format: 'CD',
        genre: ocrResults.genre,
        country: ocrResults.country,
        discogs_id: discogsData?.discogs_id || null,
        discogs_url: discogsData?.discogs_url || null,
      }
    };

    console.log('✅ CD analysis completed successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ CD analysis failed:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});