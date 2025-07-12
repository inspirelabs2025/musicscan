import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Function to clean JSON from markdown code blocks
function cleanJsonFromMarkdown(text: string): string {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let cleaned = text.replace(/```json\s*\n/g, '').replace(/```\s*\n/g, '').replace(/\n```/g, '').replace(/```/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Find the first { and last } to extract just the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting vinyl image analysis...');
    
    const { imageUrls, scanId } = await req.json();
    
    if (!imageUrls || imageUrls.length !== 3) {
      throw new Error('Exact 3 image URLs required');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Analyze each image with OpenAI Vision
    const analysisPrompts = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this vinyl/CD image for CATALOG NUMBER identification. Extract:
            1. Catalog number (e.g., ABC-123, XYZ789, etc.)
            2. Any visible text or numbers that could be catalog identifiers
            3. Record label name if visible
            4. Any alphanumeric codes
            
            Respond in JSON format:
            {
              "catalog_number": "found_number_or_null",
              "label": "record_label_or_null", 
              "additional_codes": ["code1", "code2"],
              "confidence": 0.0-1.0
            }`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrls[0] }
          }
        ]
      },
      {
        role: 'user', 
        content: [
          {
            type: 'text',
            text: `Analyze this vinyl/CD image for MATRIX NUMBER identification. Matrix numbers are usually etched or printed in the run-out groove area. Extract:
            1. Matrix number (etched numbers/letters in the runout)
            2. Stamper codes
            3. Any technical production codes
            4. Side identifiers (A/B, 1/2)
            
            Respond in JSON format:
            {
              "matrix_number": "found_matrix_or_null",
              "side": "A_or_B_or_null",
              "stamper_codes": ["code1", "code2"],
              "confidence": 0.0-1.0
            }`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrls[1] }
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'text', 
            text: `Analyze this vinyl/CD image for ADDITIONAL INFORMATION. Extract:
            1. Artist name
            2. Album/track title
            3. Year of release
            4. Format (LP, CD, 7", 12", etc.)
            5. Genre (Rock, Jazz, Pop, etc.)
            6. Country of release
            7. Any other identifying text
            8. Barcode if visible
            
            Respond in JSON format:
            {
              "artist": "artist_name_or_null",
              "title": "album_title_or_null",
              "year": "year_or_null",
              "format": "format_or_null",
              "genre": "genre_or_null",
              "country": "country_or_null",
              "barcode": "barcode_or_null",
              "additional_info": "any_other_text",
              "confidence": 0.0-1.0
            }`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrls[2] }
          }
        ]
      }
    ];

    console.log('🔍 Analyzing images with OpenAI Vision...');

    // Process each image analysis
    const analysisResults = [];
    
    for (let i = 0; i < analysisPrompts.length; i++) {
      console.log(`📸 Processing image ${i + 1}/3...`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [analysisPrompts[i]],
          max_tokens: 500,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.choices[0].message.content;
      
      console.log(`✅ Image ${i + 1} analysis result:`, result);
      
      // Clean markdown JSON blocks from OpenAI response
      const cleanedResult = cleanJsonFromMarkdown(result);
      console.log(`🧹 Cleaned result for image ${i + 1}:`, cleanedResult);
      
      try {
        const parsedResult = JSON.parse(cleanedResult);
        analysisResults.push({
          step: i + 1,
          type: ['catalog', 'matrix', 'additional'][i],
          analysis: parsedResult,
          raw_response: result
        });
      } catch (parseError) {
        console.error(`❌ Failed to parse JSON for image ${i + 1}:`, parseError);
        console.error('Original result:', result);
        console.error('Cleaned result:', cleanedResult);
        analysisResults.push({
          step: i + 1,
          type: ['catalog', 'matrix', 'additional'][i],
          analysis: null,
          raw_response: result,
          error: 'JSON parse failed'
        });
      }
    }

    // Combine results for database storage
    const combinedData = {
      catalog_number: analysisResults[0]?.analysis?.catalog_number || null,
      matrix_number: analysisResults[1]?.analysis?.matrix_number || null,
      artist: analysisResults[2]?.analysis?.artist || null,
      title: analysisResults[2]?.analysis?.title || null,
      year: analysisResults[2]?.analysis?.year || null,
      format: analysisResults[2]?.analysis?.format || null,
      label: analysisResults[0]?.analysis?.label || null,
      barcode: analysisResults[2]?.analysis?.barcode || null,
      genre: analysisResults[2]?.analysis?.genre || null,
      country: analysisResults[2]?.analysis?.country || null,
      additional_info: analysisResults[2]?.analysis?.additional_info || null
    };

    console.log('🎯 Combined OCR results:', combinedData);

    // Save comprehensive OCR results to database
    const { data: insertData, error: insertError } = await supabase
      .from('vinyl2_scan')
      .insert({
        catalog_image: imageUrls[0],
        matrix_image: imageUrls[1], 
        additional_image: imageUrls[2],
        catalog_number: combinedData.catalog_number,
        matrix_number: combinedData.matrix_number,
        artist: combinedData.artist,
        title: combinedData.title,
        year: combinedData.year ? parseInt(combinedData.year) : null,
        format: combinedData.format,
        label: combinedData.label,
        genre: combinedData.genre,
        country: combinedData.country
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw insertError;
    }

    console.log('💾 Data saved to database:', insertData);

    return new Response(JSON.stringify({ 
      success: true,
      scanId: insertData.id,
      ocrResults: combinedData,
      analysisDetails: analysisResults,
      message: 'OCR analysis completed successfully!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in analyze-vinyl-images function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});