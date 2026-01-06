// OPTIMIZED V2.0 - Uses Lovable AI Gateway for faster CD analysis
// Single-call optimization for all images

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CD_FUNCTION_VERSION = "V2.0-OPTIMIZED";

// Use Lovable API key (faster) with OpenAI fallback
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
const DISCOGS_CONSUMER_KEY = Deno.env.get('DISCOGS_CONSUMER_KEY');
const DISCOGS_CONSUMER_SECRET = Deno.env.get('DISCOGS_CONSUMER_SECRET');

console.log(`🚀 CD ANALYSIS ${CD_FUNCTION_VERSION}`);
console.log(`🔑 Using: ${LOVABLE_API_KEY ? 'Lovable AI Gateway' : 'OpenAI API'}`);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  matrix_number?: string;
  side?: string;
  stamper_codes?: string;
}

async function validateImageUrls(imageUrls: string[]): Promise<void> {
  console.log('🔍 Validating image URLs:', imageUrls.length, 'images');
  
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    
    // Skip validation for base64 data URIs
    if (url.startsWith('data:')) {
      console.log(`✅ Image ${i + 1} is base64 data URI, skipping URL validation`);
      continue;
    }
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Image ${i + 1} not accessible: ${response.status}`);
      }
      console.log(`✅ Image ${i + 1} validated: ${url.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Image ${i + 1} validation failed: ${error.message}`);
      throw new Error(`Image ${i + 1} validation failed: ${error.message}`);
    }
  }
}

async function performMatrixAnalysis(imageUrls: string[]): Promise<{ matrix_number?: string; side?: string; stamper_codes?: string; confidence: number }> {
  console.log('🔍 Starting dedicated matrix analysis for', imageUrls.length, 'images');
  
  const matrixPrompt = `You are a specialist in CD matrix number identification. Focus ONLY on extracting matrix information from CD disc images.

MATRIX ANALYSIS INSTRUCTIONS:
- Look specifically for the CD disc image (the shiny reflective disc itself)
- Focus on the area around the center hole (spindle hole)
- Matrix numbers are usually etched, molded, or printed on the inner ring area
- They appear on the non-label side (data side) of the CD

TYPICAL CD MATRIX FORMATS:
- DIDP format: "DIDP-093347", "DIDP 070042"
- Sony format: "SRCS-1234 1A1", "SRCL-4567 2B2"
- EMI format: "7243 8 95713 2 4", "EMI 72438957132 4 01"
- Universal format: "UICY-1234 A", "UMCK-1234 1B1"
- Numeric codes: "123456-2", "789012 A1"

WHAT TO EXTRACT:
- Matrix Number: The main identification code (REQUIRED)
- Side: Usually "A", "B", "1", "2", or single letter/number
- Stamper Codes: Additional small codes like "1A1", "2B2", manufacturing marks

CONFIDENCE SCORING:
- 1.0: Clear, well-lit matrix number, easily readable
- 0.8: Matrix number visible but requires some interpretation
- 0.6: Partially visible matrix number, some uncertainty
- 0.4: Barely visible or heavily worn matrix number
- 0.2: Very uncertain identification
- 0.0: No matrix number found or image doesn't show CD disc

Return ONLY a JSON object:
{
  "matrix_number": "EXACT_CODE_AS_SEEN",
  "side": "A",
  "stamper_codes": "1A1",
  "confidence": 0.8
}

If NO matrix number is found, return: {"confidence": 0.0}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: matrixPrompt },
              ...imageUrls.map(url => ({
                type: 'image_url',
                image_url: { url, detail: 'high' }
              }))
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error for matrix analysis:', response.status, errorText);
      return { confidence: 0.0 };
    }

    const data = await response.json();
    console.log('🔍 Matrix analysis response:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid response structure from OpenAI API');
      return { confidence: 0.0 };
    }

    const content = data.choices[0].message.content;
    console.log('🔍 Matrix analysis content:', content);

    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const matrixResult = JSON.parse(cleanedContent);
      console.log('✅ Parsed matrix result:', matrixResult);
      
      return {
        matrix_number: matrixResult.matrix_number || undefined,
        side: matrixResult.side || undefined,
        stamper_codes: matrixResult.stamper_codes || undefined,
        confidence: matrixResult.confidence || 0.0
      };
    } catch (parseError) {
      console.error('❌ Failed to parse matrix analysis JSON:', parseError);
      console.error('❌ Raw content:', content);
      return { confidence: 0.0 };
    }
  } catch (error) {
    console.error('❌ Matrix analysis error:', error);
    return { confidence: 0.0 };
  }
}

async function performOCRAnalysis(imageUrls: string[]): Promise<OCRResult & { confidence?: { artist: number; title: number; overall: number }; ocr_notes?: string }> {
  console.log(`🔍 [${CD_FUNCTION_VERSION}] Starting STRICT OCR analysis for ${imageUrls.length} images`);
  
  // Use Lovable API Gateway if available
  const apiKey = LOVABLE_API_KEY || openaiApiKey;
  const apiUrl = LOVABLE_API_KEY 
    ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const model = LOVABLE_API_KEY ? 'google/gemini-2.5-flash' : 'gpt-4o';

  if (!apiKey) {
    throw new Error('No API key configured (LOVABLE_API_KEY or OPENAI_API_KEY)');
  }

  console.log(`🤖 [${CD_FUNCTION_VERSION}] Using ${LOVABLE_API_KEY ? 'Lovable Gateway' : 'OpenAI'} with model: ${model}`);

  // Build ALL images in single call
  const imageContents = imageUrls.map(url => ({
    type: 'image_url',
    image_url: { url, detail: 'high' }
  }));

  const systemPrompt = `You are a STRICT OCR specialist for CD analysis. Your ONLY job is to READ TEXT that is ACTUALLY VISIBLE on the CD images.

CRITICAL RULES - FOLLOW EXACTLY:
1. ONLY report text you can CLEARLY SEE in the images
2. NEVER guess, assume, or hallucinate artist/album names
3. If you cannot clearly read text, set that field to null
4. Do NOT use your knowledge of music - only read what is printed
5. The front cover typically shows the artist name and album title prominently
6. The back cover has tracklisting, barcode, catalog number, label info
7. The disc itself may have matrix codes, catalog numbers

IMAGE IDENTIFICATION:
- Image 1: Front cover
- Image 2: Back cover  
- Image 3 (if present): Disc or additional

CONFIDENCE SCORING (0.0 to 1.0):
- 1.0: Text is crystal clear and unambiguous
- 0.8-0.9: Text is readable with high certainty
- 0.6-0.7: Text is partially visible or slightly unclear
- 0.3-0.5: Text is hard to read, low certainty
- 0.0-0.2: Cannot read, guessing would be required (use null instead)`;

  const userPrompt = `Analyze these CD images. READ ONLY the text that is ACTUALLY PRINTED on the covers and disc. Do not guess or use music knowledge.

Return ONLY valid JSON:
{
  "artist": "exact text as printed or null",
  "title": "exact text as printed or null",
  "year": number or null,
  "label": "exact text or null",
  "catalog_number": "exact text or null",
  "barcode": "exact text or null",
  "format": "CD",
  "genre": "if clearly labeled or null",
  "country": "if clearly labeled or null",
  "matrix_number": "from disc or null",
  "confidence": {
    "artist": 0.0-1.0,
    "title": 0.0-1.0,
    "overall": 0.0-1.0
  },
  "ocr_notes": "brief notes about what you could/couldn't read"
}

IMPORTANT: If the artist or title is not clearly readable, return null. Do NOT guess based on artwork recognition.`;

  const startTime = Date.now();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              ...imageContents
            ]
          }
        ],
        max_tokens: 1500,
      }),
    });

    const aiTime = Date.now() - startTime;
    console.log(`⚡ [${CD_FUNCTION_VERSION}] AI analysis completed in ${aiTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI API error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit bereikt, probeer het over een minuut opnieuw.');
      }
      if (response.status === 402) {
        throw new Error('AI credits op, neem contact op met de beheerder.');
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`🔍 [${CD_FUNCTION_VERSION}] Raw AI response:`, content);

    // Parse JSON
    let result: OCRResult & { confidence?: { artist: number; title: number; overall: number }; ocr_notes?: string };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      result = {};
    }

    // Ensure confidence object exists
    if (!result.confidence) {
      result.confidence = {
        artist: result.artist ? 0.5 : 0,
        title: result.title ? 0.5 : 0,
        overall: 0.5
      };
    }

    console.log(`✅ [${CD_FUNCTION_VERSION}] OCR result with confidence:`, result);
    
    if (!result.artist && !result.title && !result.barcode && !result.catalog_number) {
      console.warn('⚠️ No meaningful data extracted - images may be unclear');
    }
    
    return result;
  } catch (error) {
    console.error(`❌ [${CD_FUNCTION_VERSION}] OCR analysis failed:`, error);
    throw error;
  }
}

async function searchDiscogs(catalogNumber: string, artist?: string, title?: string, barcode?: string): Promise<any | null> {
  console.log('🔍 Starting Discogs search for CD', { catalogNumber, artist, title, barcode });
  
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
      console.log(`📊 Added barcode search: barcode:"${barcode}"`);
    }
    
    // Strategy 2: Catalog number
    if (catalogNumber) {
      searchQueries.push(`catno:"${catalogNumber}"`);
      console.log(`📊 Added catalog search: catno:"${catalogNumber}"`);
      if (artist) {
        searchQueries.push(`catno:"${catalogNumber}" artist:"${artist}"`);
        console.log(`📊 Added catalog+artist search: catno:"${catalogNumber}" artist:"${artist}"`);
      }
    }
    
    // Strategy 3: Artist and title
    if (artist && title) {
      searchQueries.push(`artist:"${artist}" title:"${title}"`);
      console.log(`📊 Added artist+title search: artist:"${artist}" title:"${title}"`);
    }

    console.log(`🔍 Will try ${searchQueries.length} search strategies`);

    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`🔍 [${i + 1}/${searchQueries.length}] Trying query: ${query}`);
      
      const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=CD&per_page=5`;
      console.log(`📡 Request URL: ${searchUrl}`);
      
      const response = await fetch(searchUrl, {
        headers: {
          ...authHeaders,
          'User-Agent': 'VinylScanner/2.0'
        }
      });

      console.log(`📡 Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`📦 Response data:`, { 
          resultsCount: data.results?.length || 0, 
          pagination: data.pagination 
        });
        
        if (data.results && data.results.length > 0) {
          const bestMatch = data.results[0];
          console.log(`✅ Found match: ${bestMatch.title} (ID: ${bestMatch.id})`);
          console.log(`🎯 Full match data:`, bestMatch);
          
          const discogsResult = {
            discogs_id: bestMatch.id,
            discogs_url: `https://www.discogs.com/release/${bestMatch.id}`,
            marketplace_url: `https://www.discogs.com/sell/release/${bestMatch.id}`,
            similarity_score: 0.9, // High confidence for first result
            search_query_used: query,
            search_strategy: i + 1
          };
          
          console.log(`🎯 Returning Discogs result:`, discogsResult);
          return discogsResult;
        } else {
          console.log(`❌ No results found for query: ${query}`);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Discogs API error for query "${query}":`, response.status, errorText);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('❌ No Discogs match found after trying all strategies');
    return null;
  } catch (error) {
    console.error('❌ Discogs search failed with exception:', error);
    return null;
  }
}

async function saveToDatabase(scanId: string, ocrResults: OCRResult, imageUrls: string[], discogsData?: any): Promise<any> {
  console.log('💾 Saving CD scan to database');
  console.log('💾 OCR Results:', ocrResults);
  console.log('💾 Discogs Data:', discogsData);
  
  try {
    // Prepare data with validation
    const insertData = {
      front_image: imageUrls[0] || null,
      back_image: imageUrls[1] || null,
      barcode_image: imageUrls[2] || null,
      matrix_image: imageUrls[3] || null, // Optional 4th image
      barcode_number: ocrResults.barcode || null,
      artist: ocrResults.artist || null,
      title: ocrResults.title || null,
      label: ocrResults.label || null,
      catalog_number: ocrResults.catalog_number || null,
      matrix_number: ocrResults.matrix_number || null,
      side: ocrResults.side || null,
      stamper_codes: ocrResults.stamper_codes || null,
      year: ocrResults.year || null,
      format: 'CD',
      genre: ocrResults.genre || null,
      country: ocrResults.country || null,
      discogs_id: discogsData?.discogs_id || null,
      discogs_url: discogsData?.discogs_url || null,
    };
    
    // Validate data types and lengths
    if (insertData.artist && typeof insertData.artist === 'string' && insertData.artist.length > 255) {
      insertData.artist = insertData.artist.substring(0, 255);
      console.warn('⚠️ Artist name truncated to 255 characters');
    }
    if (insertData.title && typeof insertData.title === 'string' && insertData.title.length > 255) {
      insertData.title = insertData.title.substring(0, 255);
      console.warn('⚠️ Title truncated to 255 characters');
    }
    if (insertData.year && (insertData.year < 1900 || insertData.year > 2030)) {
      console.warn(`⚠️ Invalid year ${insertData.year}, setting to null`);
      insertData.year = null;
    }
    
    // ✅ FIXED: Database insertion removed - will be handled by frontend after condition selection
    console.log('💾 OCR data prepared for frontend (not saved to database yet):', insertData);
    
    // Return the prepared data instead of database record
    return insertData;
  } catch (error) {
    console.error('❌ Failed to save to database:', error);
    
    // Enhance error context
    if (error.message.includes('Database error:')) {
      throw error; // Already enhanced
    } else {
      throw new Error(`Database Save Error: ${error.message}`);
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`🚀 CD Analysis request started at ${new Date().toISOString()}`);

  try {
    // Parse and validate request
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        success: false,
        details: parseError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Support both imageUrls (URLs) and imageBase64 (base64 data URIs)
    const imageUrls = requestData.imageUrls || requestData.imageBase64 || [];
    const scanId = requestData.scanId;
    const isBase64 = !!requestData.imageBase64;

    console.log(`📸 Image type: ${isBase64 ? 'base64' : 'URL'}`);

    // Comprehensive input validation
    if (!imageUrls || !Array.isArray(imageUrls)) {
      return new Response(JSON.stringify({ 
        error: 'Missing or invalid images in request. Send imageUrls or imageBase64 array.',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (imageUrls.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'At least one image is required',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (imageUrls.length < 2) {
      return new Response(JSON.stringify({ 
        error: 'CD scanning requires at least 2 images (front and back)',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🎵 Starting CD analysis for scan ${scanId || 'quick-check'} with ${imageUrls.length} images`);

    // Perform OCR analysis
    const ocrResults = await performOCRAnalysis(imageUrls);

    // Search Discogs for release ID
    const discogsData = await searchDiscogs(
      ocrResults.catalog_number || '', 
      ocrResults.artist, 
      ocrResults.title, 
      ocrResults.barcode
    );

    // Return analysis results without saving to database
    // The frontend will handle saving when user clicks "Opslaan in Database"
    const response = {
      success: true,
      scanId: scanId,
      analysis: {
        artist: ocrResults.artist,
        title: ocrResults.title,
        label: ocrResults.label,
        catalog_number: ocrResults.catalog_number,
        barcode: ocrResults.barcode,
        year: ocrResults.year,
        format: 'CD',
        genre: ocrResults.genre,
        country: ocrResults.country,
        matrix_number: ocrResults.matrix_number,
        side: ocrResults.side,
        stamper_codes: ocrResults.stamper_codes
      },
      discogsData: discogsData,
      // Legacy fields for backward compatibility
      ocr_results: ocrResults,
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
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error('❌ CD analysis failed:', error);
    console.error(`❌ Total processing time: ${duration}ms`);
    
    // Determine appropriate error status and message
    let statusCode = 500;
    let userFriendlyMessage = error.message;
    
    if (error.message.includes('OpenAI API')) {
      statusCode = 502; // Bad Gateway
      userFriendlyMessage = 'AI image analysis service unavailable. Please try again later.';
    } else if (error.message.includes('Image')) {
      statusCode = 400; // Bad Request
      userFriendlyMessage = 'Image processing failed. Please check your images and try again.';
    } else if (error.message.includes('Database')) {
      statusCode = 503; // Service Unavailable
      userFriendlyMessage = 'Database service temporarily unavailable. Please try again.';
    } else if (error.message.includes('Network error')) {
      statusCode = 502; // Bad Gateway
      userFriendlyMessage = 'Network connectivity issue. Please check your connection and try again.';
    }
    
    return new Response(JSON.stringify({ 
      error: userFriendlyMessage,
      success: false,
      details: error.message,
      processingTime: duration,
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});