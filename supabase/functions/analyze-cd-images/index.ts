import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment validation with detailed logging
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

// Validate required environment variables
if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL environment variable is missing');
  throw new Error('SUPABASE_URL is required');
}
if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is missing');
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}
if (!openaiApiKey) {
  console.error('❌ OPENAI_API_KEY environment variable is missing');
  throw new Error('OPENAI_API_KEY is required');
}

console.log('✅ All required environment variables are present');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  console.log('🔍 Validating image URLs:', imageUrls);
  
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
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

async function performOCRAnalysis(imageUrls: string[]): Promise<OCRResult> {
  console.log('🔍 Starting multi-step CD analysis for', imageUrls.length, 'images');
  
  // Validate images first
  await validateImageUrls(imageUrls);
  
  // Step 1: General CD information extraction
  const generalPrompt = `You are an expert at analyzing CD images. Extract general CD information from these images.

PRIORITY ORDER:
1. BARCODE - Extract barcode numbers (highest priority for direct lookup)
2. FRONT COVER - Extract artist, album title, year, label
3. BACK COVER - Extract catalog number, additional information

Focus on:
- Barcode numbers from any visible barcodes
- Artist name and album title from front cover
- Record label name
- Catalog number (usually on back cover or spine)
- Year of release
- Genre if clearly visible
- Country information

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

Be precise and only include information you can clearly see. If uncertain, omit the field.`;

  try {
    console.log('🤖 Step 1: General CD information extraction...');
    const generalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              { type: 'text', text: generalPrompt },
              ...imageUrls.map(url => ({
                type: 'image_url',
                image_url: { url, detail: 'high' }
              }))
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!generalResponse.ok) {
      const errorText = await generalResponse.text();
      console.error('❌ OpenAI API error for general analysis:', generalResponse.status, errorText);
      throw new Error(`OpenAI API error: ${generalResponse.status} - ${errorText}`);
    }

    const generalData = await generalResponse.json();
    const generalContent = generalData.choices[0].message.content;
    console.log('🤖 General analysis response:', generalContent);

    // Parse general results
    let generalResult;
    try {
      const jsonMatch = generalContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in general analysis response');
      }
      generalResult = JSON.parse(jsonMatch[0]);
      console.log('✅ Parsed general result:', generalResult);
    } catch (parseError) {
      console.error('❌ Failed to parse general analysis JSON:', parseError);
      throw new Error('Failed to parse general CD information');
    }

    // Step 2: Dedicated matrix analysis
    console.log('🤖 Step 2: Dedicated matrix analysis...');
    const matrixResults = await performMatrixAnalysis(imageUrls);
    console.log('✅ Matrix analysis completed with confidence:', matrixResults.confidence);

    // Step 3: Combine results
    const combinedResult: OCRResult = {
      ...generalResult,
      matrix_number: matrixResults.matrix_number,
      side: matrixResults.side,
      stamper_codes: matrixResults.stamper_codes
    };

    console.log('✅ Combined analysis result:', combinedResult);
    
    // Enhanced validation
    if (!combinedResult.artist && !combinedResult.title && !combinedResult.barcode && !combinedResult.catalog_number && !combinedResult.matrix_number) {
      console.warn('⚠️ No meaningful data extracted from any analysis step');
      throw new Error('No meaningful data extracted from images');
    }

    // Log matrix extraction success
    if (matrixResults.confidence > 0.5) {
      console.log(`🎯 Matrix extraction successful: ${matrixResults.matrix_number} (confidence: ${matrixResults.confidence})`);
    } else if (matrixResults.confidence > 0) {
      console.log(`⚠️ Matrix extraction uncertain: ${matrixResults.matrix_number || 'none'} (confidence: ${matrixResults.confidence})`);
    } else {
      console.log('❌ No matrix number detected');
    }
    
    return combinedResult;
  } catch (error) {
    console.error('❌ Multi-step OCR analysis failed:', error);
    
    // Enhance error message with context
    if (error.message.includes('OpenAI API')) {
      throw new Error(`OpenAI API Error: ${error.message}`);
    } else if (error.message.includes('JSON')) {
      throw new Error(`Data Parsing Error: ${error.message}`);
    } else if (error.message.includes('Image')) {
      throw new Error(`Image Processing Error: ${error.message}`);
    } else {
      throw new Error(`OCR Analysis Error: ${error.message}`);
    }
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
    
    // Note: Database insertion removed - will be handled by frontend after condition selection
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

    const { imageUrls, scanId }: CDAnalysisRequest = requestData;

    // Comprehensive input validation
    if (!imageUrls) {
      return new Response(JSON.stringify({ 
        error: 'Missing imageUrls in request',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(imageUrls)) {
      return new Response(JSON.stringify({ 
        error: 'imageUrls must be an array',
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

    // Return analysis results without saving to database
    // The frontend will handle saving when user clicks "Opslaan in Database"
    const response = {
      success: true,
      scanId: scanId,
      ocr_results: ocrResults,
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