import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface AnalysisRequest {
  photoUrls: string[]
  mediaType: 'vinyl' | 'cd'
  conditionGrade: string
}

interface StructuredAnalysisData {
  artist: string | null
  title: string | null
  label: string | null
  catalogNumber: string | null
  year: number | null
  barcode: string | null
  matrixNumber: string | null
  genre: string | null
  format: string | null
  country: string | null
  confidence: number
  alternativeSearchTerms: string[]
  extractedText: string[]
  imageQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header to extract user info
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No authorization header provided')
      throw new Error('No authorization header provided')
    }

    // Extract JWT token and get user info
    const jwt = authHeader.replace('Bearer ', '')
    console.log('🔐 Attempting to get user from JWT token...')

    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)

    if (userError) {
      console.error('❌ User authentication error:', userError)
      throw new Error(`Invalid authentication token: ${userError.message}`)
    }

    if (!user) {
      console.error('❌ No user found in token')
      throw new Error('Invalid authentication token: No user found')
    }

    console.log('✅ User authenticated successfully:', {
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Check AI scan usage limits
    console.log('🔍 Checking AI scan usage limits for user:', user.id)

    const { data: usageCheck, error: usageError } = await supabase.rpc('check_usage_limit', {
      p_user_id: user.id,
      p_usage_type: 'ai_scans'
    });

    if (usageError) {
      console.error('❌ Usage check error:', usageError);
      throw new Error('Failed to check usage limits');
    }

    const limitCheck = usageCheck[0];
    console.log('📊 Usage check result:', limitCheck);

    if (!limitCheck.can_use) {
      console.log(`🚫 Usage limit reached: ${limitCheck.current_usage}/${limitCheck.limit_amount} for ${limitCheck.plan_name}`);

      return new Response(JSON.stringify({
        error: 'USAGE_LIMIT_EXCEEDED',
        message: `Je hebt je limiet van ${limitCheck.limit_amount} AI scans deze maand bereikt. Upgrade je plan voor meer scans.`,
        usage: {
          current: limitCheck.current_usage,
          limit: limitCheck.limit_amount,
          plan: limitCheck.plan_name
        }
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Skipping direct checks against auth.users (restricted schema). JWT already validated above.

    const { photoUrls, mediaType, conditionGrade }: AnalysisRequest = await req.json()

    console.log('🤖 Starting AI photo analysis V2 for:', {
      photoCount: photoUrls.length,
      mediaType,
      conditionGrade,
      userId: user.id,
      userEmail: user.email
    })

    // Create initial record with version marker and user_id
    console.log('📝 Creating scan record in database...')
    console.log('🔍 User ID being inserted:', user.id)
    console.log('🔍 User ID type:', typeof user.id)

    const insertData = {
      user_id: user.id,
      photo_urls: photoUrls,
      media_type: mediaType,
      condition_grade: conditionGrade,
      status: 'pending',
      analysis_data: { version: 'v2', phase: 'initialization' }
    }

    console.log('📦 Insert data being sent:', insertData)

    const { data: scanRecord, error: insertError } = await supabase
      .from('ai_scan_results')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Database insert error:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        userId: user.id
      })
      throw new Error(`Failed to create scan record: ${insertError.message}`)
    }

    console.log('✅ Scan record created successfully:', scanRecord.id)
    const scanId = scanRecord.id

    try {
      // Multi-pass analysis
      console.log('🔍 Starting multi-pass analysis...')

      // Pass 1: General release identification
      const generalAnalysis = await analyzePhotosWithOpenAI(photoUrls, mediaType, 'general')

      if (!generalAnalysis.success) {
        await supabase
          .from('ai_scan_results')
          .update({
            status: 'failed',
            error_message: generalAnalysis.error
          })
          .eq('id', scanId)

        return new Response(
          JSON.stringify({
            success: false,
            error: generalAnalysis.error,
            scanId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Pass 2: Detail extraction
      const detailAnalysis = await analyzePhotosWithOpenAI(photoUrls, mediaType, 'details')

      // Pass 3: Dedicated matrix/SID extraction with preprocessing
      // For BOTH CD and LP, we now preprocess the matrix photo for better OCR
      let matrixPhotoUrls = photoUrls;
      
      // Try to preprocess the matrix photo (last photo for vinyl, photo 3 for CD)
      const matrixPhotoIndex = mediaType === 'vinyl' ? photoUrls.length - 1 : Math.min(2, photoUrls.length - 1);
      const matrixPhotoUrl = photoUrls[matrixPhotoIndex];
      
      if (matrixPhotoUrl) {
        try {
          console.log(`🔧 Preprocessing ${mediaType} matrix photo (index ${matrixPhotoIndex})...`);
          
          const preprocessResponse = await fetch(
            `${supabaseUrl}/functions/v1/preprocess-matrix-photo`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageUrl: matrixPhotoUrl,
                mediaType: mediaType
              })
            }
          );
          
          if (preprocessResponse.ok) {
            const preprocessResult = await preprocessResponse.json();
            if (preprocessResult.success && preprocessResult.enhancedImageBase64) {
              console.log(`✅ Matrix photo preprocessed in ${preprocessResult.processingTime}ms`);
              console.log(`📊 Pipeline steps: ${preprocessResult.pipeline?.join(' → ')}`);
              
              // Replace the matrix photo URL with the enhanced base64 for the matrix pass
              matrixPhotoUrls = [...photoUrls];
              matrixPhotoUrls[matrixPhotoIndex] = preprocessResult.enhancedImageBase64;
            } else {
              console.log('⚠️ Preprocessing returned no enhanced image, using original');
            }
          } else {
            console.log(`⚠️ Preprocessing failed (${preprocessResponse.status}), using original photo`);
          }
        } catch (preprocessError) {
          console.log('⚠️ Preprocessing error (continuing with original):', preprocessError.message);
        }
      }

      // Run matrix analysis with potentially preprocessed image
      const matrixAnalysis = await analyzePhotosWithOpenAI(matrixPhotoUrls, mediaType, 'matrix')

      if (matrixAnalysis && !matrixAnalysis.success) {
        console.log('⚠️ Matrix pass failed (continuing):', matrixAnalysis.error)
      }

      // Merge analysis results
      const combinedData = mergeAnalysisResults(
        generalAnalysis.data,
        detailAnalysis.success ? detailAnalysis.data : null,
        matrixAnalysis?.success ? matrixAnalysis.data : null
      )

      // Update with analysis progress
      await supabase
        .from('ai_scan_results')
        .update({
          analysis_data: {
            version: 'v2',
            phase: 'analysis_complete',
            generalAnalysis: generalAnalysis.data,
            detailAnalysis: detailAnalysis.success ? detailAnalysis.data : { error: detailAnalysis.error },
            matrixAnalysis: matrixAnalysis
              ? (matrixAnalysis.success ? matrixAnalysis.data : { error: matrixAnalysis.error })
              : null,
            combined: combinedData
          }
        })
        .eq('id', scanId)

      // Search Discogs with improved strategy (now includes format filtering)
      const discogsResult = await searchDiscogsV2(combinedData, mediaType)

      // Update record with final results
      const normalizedYear = typeof discogsResult.year === 'string'
        ? parseInt(discogsResult.year, 10)
        : (discogsResult.year ?? (typeof combinedData.year === 'string' ? parseInt(combinedData.year, 10) : (combinedData.year ?? null)))

      const { error: finalUpdateError } = await supabase
        .from('ai_scan_results')
        .update({
          discogs_id: discogsResult.discogsId ?? null,
          discogs_url: discogsResult.discogsUrl ?? null,
          artist: discogsResult.artist ?? combinedData.artist ?? null,
          title: discogsResult.title ?? combinedData.title ?? null,
          label: discogsResult.label ?? combinedData.label ?? null,
          catalog_number: discogsResult.catalogNumber ?? combinedData.catalogNumber ?? null,
          year: Number.isFinite(normalizedYear as number) ? (normalizedYear as number) : null,
          confidence_score: discogsResult.confidence ?? combinedData.confidence ?? null,
          // Also persist key technical identifiers
          barcode: combinedData.barcode ?? null,
          matrix_number: combinedData.matrixNumber ?? null,
          analysis_data: {
            version: 'v2',
            phase: 'completed',
            generalAnalysis: generalAnalysis.data,
            detailAnalysis: detailAnalysis.data,
            combined: combinedData,
            discogsSearch: discogsResult.searchMetadata
          },
          ai_description: combinedData.description ?? null,
          search_queries: combinedData.searchQueries ?? null,
          status: 'completed'
        })
        .eq('id', scanId)

      if (finalUpdateError) {
        console.error('❌ Final database update failed:', { finalUpdateError, scanId })
        throw new Error(`Final database update failed: ${finalUpdateError.message}`)
      }

      console.log('✅ AI analysis V2 completed for scan:', scanId)

      // Increment usage counter for successful scan
      console.log('📈 Incrementing AI scan usage for user:', user.id)
      const { error: usageError } = await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_usage_type: 'ai_scans',
        p_increment: 1
      });

      if (usageError) {
        console.error('⚠️ Failed to increment usage counter:', usageError);
        // Don't fail the whole request for usage tracking errors
      } else {
        console.log('✅ Usage counter incremented successfully');
      }

      // Automatic artwork enrichment after successful scan
      if (discogsResult?.discogsUrl || (combinedData.artist && combinedData.title)) {
        try {
          console.log('🎨 Starting automatic artwork enrichment...');
          const { data: artworkData } = await supabase.functions.invoke('fetch-album-artwork', {
            body: {
              discogs_url: discogsResult?.discogsUrl,
              artist: discogsResult?.artist || combinedData.artist,
              title: discogsResult?.title || combinedData.title,
              media_type: mediaType,
              item_id: scanId,
              item_type: 'ai_scan' // Flag to indicate this is for ai_scan_results table
            }
          });

          if (artworkData?.artwork_url) {
            // Update scan record with artwork
            await supabase.from('ai_scan_results')
              .update({ artwork_url: artworkData.artwork_url })
              .eq('id', scanId);

            console.log('✅ Artwork enrichment completed:', artworkData.artwork_url);
          } else {
            console.log('ℹ️ No artwork found during enrichment');
          }
        } catch (error) {
          console.log('❌ Artwork enrichment failed but scan succeeded:', error);
        }
      }

      // 🔗 Automatic release linking - connect scan to central releases table
      let releaseId = null;
      if (discogsResult?.discogsId) {
        try {
          console.log('🔗 Linking to releases table for Discogs ID:', discogsResult.discogsId);
          const { data: releaseData, error: releaseError } = await supabase.functions.invoke('find-or-create-release', {
            body: {
              discogs_id: discogsResult.discogsId,
              artist: discogsResult.artist || combinedData.artist,
              title: discogsResult.title || combinedData.title,
              label: discogsResult.label || combinedData.label,
              catalog_number: discogsResult.catalogNumber || combinedData.catalogNumber,
              year: discogsResult.year || combinedData.year,
              format: mediaType === 'vinyl' ? 'Vinyl' : 'CD',
              genre: combinedData.genre,
              country: combinedData.country,
              discogs_url: discogsResult.discogsUrl,
            }
          });

          if (releaseError) {
            console.log('⚠️ Release linking function error:', releaseError);
          } else if (releaseData?.release_id) {
            releaseId = releaseData.release_id;
            // Update scan record with release_id
            await supabase.from('ai_scan_results')
              .update({ release_id: releaseId })
              .eq('id', scanId);
            console.log('✅ Linked to release:', releaseId);
          }
        } catch (error) {
          console.log('⚠️ Release linking failed (non-blocking):', error.message);
        }
      }

      // Fetch pricing data if Discogs ID is available
      let pricingStats = null;
      if (discogsResult?.discogsId) {
        try {
          console.log('💰 Starting pricing fetch for Discogs ID:', discogsResult.discogsId);
          pricingStats = await fetchDiscogsPricing(discogsResult.discogsId);

          if (pricingStats) {
            console.log('✅ Pricing data fetched:', pricingStats);
          } else {
            console.log('ℹ️ No pricing data available for this release');
          }
        } catch (error) {
          console.log('❌ Pricing fetch failed but scan succeeded:', error);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          scanId,
          version: 'v2',
          result: {
            discogs_id: discogsResult.discogsId,
            discogs_url: discogsResult.discogsUrl,
            artist: discogsResult.artist,
            title: discogsResult.title,
            label: discogsResult.label,
            catalog_number: discogsResult.catalogNumber,
            year: discogsResult.year,
            confidence_score: discogsResult.confidence,
            ai_description: combinedData.description,
            image_quality: combinedData.imageQuality,
            extracted_details: combinedData.extractedDetails,
            // Technical identifiers from OCR
            matrix_number: combinedData.matrixNumber || null,
            sid_code_mastering: combinedData.sidCodeMastering || null,
            sid_code_mould: combinedData.sidCodeMould || null,
            label_code: combinedData.labelCode || null,
            barcode: combinedData.barcode || null,
            genre: combinedData.genre || null,
            country: combinedData.country || null,
            // Pricing data from Discogs
            pricing_stats: pricingStats
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('❌ Error during V2 analysis:', error)

      await supabase
        .from('ai_scan_results')
        .update({
          status: 'failed',
          error_message: error.message,
          analysis_data: { version: 'v2', phase: 'error', error: error.message }
        })
        .eq('id', scanId)

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          scanId,
          version: 'v2'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('❌ Request error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Authentication or request processing failed'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function toSupabaseRenderImageUrl(url: string, width = 1600, quality = 70): string {
  // Convert Supabase public object URLs into resized render URLs to avoid huge image downloads/timeouts.
  // Example:
  // /storage/v1/object/public/<bucket>/<path>
  // -> /storage/v1/render/image/public/<bucket>/<path>?width=1600&quality=70
  if (!url.includes('/storage/v1/object/public/')) return url

  const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
  const joinChar = renderUrl.includes('?') ? '&' : '?'
  return `${renderUrl}${joinChar}width=${width}&quality=${quality}`
}

async function toOpenAIImageUrl(
  url: string,
  opts?: { width?: number; quality?: number; maxBytes?: number }
): Promise<string> {
  const maxBytes = opts?.maxBytes ?? 2_500_000 // safety guard to avoid huge OpenAI payloads
  const quality = opts?.quality ?? 70

  // Try progressively smaller renders until the image fits.
  const preferredWidth = opts?.width ?? 1600
  const widths = [preferredWidth, 1400, 1200, 1000, 800, 640]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .filter((v) => v > 0)

  let lastError: string | null = null

  for (const width of widths) {
    const candidateUrl = toSupabaseRenderImageUrl(url, width, quality)

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(candidateUrl)
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`)

        const contentType = res.headers.get('content-type') ?? 'image/jpeg'
        const bytes = new Uint8Array(await res.arrayBuffer())

        if (bytes.byteLength > maxBytes) {
          console.log('⚠️ Image too large, trying smaller resize:', {
            bytes: bytes.byteLength,
            maxBytes,
            width,
            candidateUrl: candidateUrl.slice(0, 160),
          })
          break // try next smaller width
        }

        return `data:${contentType};base64,${encodeBase64(bytes)}`
      } catch (e) {
        lastError = e?.message ?? String(e)
        console.log('⚠️ Failed to fetch/encode image for OpenAI:', {
          attempt,
          width,
          error: lastError,
          candidateUrl: candidateUrl.slice(0, 160),
        })
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, attempt * 250))
        }
      }
    }
  }

  throw new Error(`Failed to prepare image for OpenAI: ${lastError ?? 'unknown error'}`)
}

function parsePossiblyBrokenJson(raw: string): any {
  const s = (raw ?? '').trim()

  // 1) Normal strict JSON
  try {
    return JSON.parse(s)
  } catch {
    // continue
  }

  // 2) Extract first JSON object and sanitize common issues like unescaped newlines in strings
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = s
      .slice(start, end + 1)
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\t/g, ' ')

    return JSON.parse(candidate)
  }

  throw new Error('No JSON object found in model output')
}

async function analyzePhotosWithOpenAI(
  photoUrls: string[],
  mediaType: string,
  analysisType: 'general' | 'details' | 'matrix'
) {
  try {
    console.log(`🔍 Running ${analysisType} analysis with OpenAI Vision V2...`)

    // Keep payload small to avoid 400s due to oversized multimodal inputs
    const urlsForPass = (() => {
      if (analysisType === 'general') return photoUrls.slice(0, 4)
      if (analysisType === 'matrix') return photoUrls.slice(0, 3)
      return photoUrls
    })()

    // We embed resized images as data URLs for ALL passes.
    // This prevents OpenAI from timing out while downloading from Supabase Storage URLs.
    const openAiImageUrls = await Promise.all(
      urlsForPass.map((url) =>
        toOpenAIImageUrl(url, {
          width: analysisType === 'matrix' ? 1800 : 1400,
          quality: 70,
        })
      )
    )

    // Media-specific prompts with structured output
    const systemPrompt = getSystemPrompt(mediaType, analysisType)
    const userPrompt = getUserPrompt(mediaType, analysisType)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Vision model for image analysis
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              ...openAiImageUrls.map((url) => ({
                type: 'image_url',
                image_url: {
                  url,
                  detail: 'high', // Higher detail for better text recognition
                },
              })),
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('❌ OpenAI API error details:', {
        status: response.status,
        analysisType,
        mediaType,
        urlsSent: openAiImageUrls.length,
        body: errText?.slice(0, 2000) || null,
      })
      throw new Error(`OpenAI API error: ${response.status}${errText ? ` - ${errText}` : ''}`)
    }

    const data = await response.json()
    const analysis = data.choices?.[0]?.message?.content

    if (!analysis || typeof analysis !== 'string') {
      console.error('❌ OpenAI returned empty/invalid content:', data)
      throw new Error('OpenAI returned empty response')
    }

    console.log(`🤖 OpenAI ${analysisType} analysis V2:`, analysis)

    const finishReason = data.choices?.[0]?.finish_reason
    if (finishReason === 'length') {
      console.error('❌ OpenAI response truncated (finish_reason=length)', { analysisType, mediaType })
      throw new Error('OpenAI response was truncated (length).')
    }

    // Parse JSON response (defensive: the model sometimes returns JSON with unescaped newlines)
    let parsedAnalysis
    try {
      parsedAnalysis = parsePossiblyBrokenJson(analysis)
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', {
        parseError,
        analysisPreview: analysis.slice(0, 800),
      })
      throw new Error('Invalid JSON response from OpenAI')
    }

    return {
      success: true,
      data: parsedAnalysis,
    }
  } catch (error) {
    console.error(`❌ OpenAI ${analysisType} analysis error:`, error)
    return {
      success: false,
      error: `AI ${analysisType} analysis failed: ${error.message}`,
    }
  }
}

function getSystemPrompt(mediaType: string, analysisType: 'general' | 'details' | 'matrix'): string {
  const basePrompt = `You are an expert music release identification specialist with deep knowledge of ${mediaType === 'vinyl' ? 'vinyl records, LPs, and vinyl production' : 'CDs and optical disc production'}. `

  if (analysisType === 'general') {
    return basePrompt + `Your task is to identify the main release information from the provided images.

RESPOND ONLY IN VALID JSON FORMAT with this exact structure:
{
  "artist": "artist name or null",
  "title": "album/release title or null", 
  "label": "record label name or null",
  "catalogNumber": "catalog number or null",
  "year": number or null,
  "genre": "genre or null",
  "format": "format details or null",
  "country": "country of release or null",
  "confidence": number between 0-1,
  "description": "detailed analysis description",
  "searchQueries": ["array", "of", "search", "terms"],
  "imageQuality": "excellent|good|fair|poor"
}

Focus on the primary release identification. Be extremely accurate with text extraction.`
  }

  if (analysisType === 'matrix') {
    if (mediaType === 'cd') {
      return basePrompt + `You are performing a dedicated OCR pass for CD INNER RING identifiers.
The image may have been preprocessed to enhance text visibility.

CRITICAL RULES:
- Only output what you can actually SEE in the inner ring.
- DO NOT invent missing characters. If unclear, use "?" in-place.
- Do NOT copy example values.
- Keep spaces, hyphens, stars, dots, and symbols exactly as seen.
- Look for high-contrast edges where text has been enhanced.

For CDs, carefully distinguish between these DIFFERENT identifiers:

**MATRIX NUMBER** (CRITICAL - located in INNER RING of disc):
- Text ENGRAVED/ETCHED in the transparent inner ring near the center hole
- Often appears in multiple segments around the ring (top/bottom)
- Return BOTH top-arc and bottom-arc readings when possible
- The preprocessing enhances engraved text - look for edge-highlighted characters

**SID CODES**:
- IFPI Mastering SID: starts with "IFPI L" (e.g., "IFPI L123")
- IFPI Mould SID: starts with "IFPI" + 4 chars NOT starting with L (e.g., "IFPI 0123")

**LABEL CODE**:
- "LC" followed by 4-5 digits (e.g., "LC 0309")

RESPOND ONLY IN VALID JSON FORMAT with this exact structure:
{
  "matrixNumberFull": "best full continuous reading (use ? for unclear) or null",
  "matrixNumberTopArc": "top arc reading or null",
  "matrixNumberBottomArc": "bottom arc reading or null",
  "sidCodeMastering": "IFPI L... code or null",
  "sidCodeMould": "IFPI ... code (not starting with L) or null",
  "labelCode": "LC xxxx code or null",
  "confidence": number between 0-1,
  "notes": "brief notes about readability / uncertain parts"
}

Prioritize inner-ring text over printed tracklist text.`
    } else {
      // Vinyl matrix pass
      return basePrompt + `You are performing a dedicated OCR pass for VINYL DEAD WAX / RUNOUT GROOVE identifiers.
The image may have been preprocessed to enhance embossed/etched text visibility.

CRITICAL RULES:
- Only output what you can actually SEE in the dead wax area (between the label and grooves).
- DO NOT invent missing characters. If unclear, use "?" in-place.
- Do NOT copy example values.
- Keep spaces, hyphens, stars, dots, and symbols exactly as seen.
- Look for edge-enhanced relief text where embossed characters have been highlighted.

For VINYL, carefully look for these identifiers in the RUNOUT GROOVE / DEAD WAX area:

**MATRIX NUMBER** (CRITICAL - etched/stamped in runout groove):
- Text ETCHED, STAMPED, or HAND-WRITTEN in the blank area near the label
- May include letters, numbers, and symbols
- Often appears on Side A and Side B separately
- Look for both machine-stamped and hand-etched text

**STAMPER CODES**:
- Often single letters (A, B, AA, AB, etc.) indicating stamper used
- May be in different locations around the runout

**PRESSING PLANT CODES**:
- Often include abbreviations like "PRC", "STERLING", "RL", "SS", etc.

**CATALOG VARIATIONS**:
- Suffixes like -1, -A, -B indicating pressing variations

RESPOND ONLY IN VALID JSON FORMAT with this exact structure:
{
  "matrixNumberFull": "full matrix number reading (use ? for unclear) or null",
  "matrixNumberSideA": "Side A matrix if visible or null",
  "matrixNumberSideB": "Side B matrix if visible or null",
  "stamperCodes": "stamper letter codes or null",
  "pressingPlant": "pressing plant indicators or null",
  "handEtched": "any hand-written/etched text or null",
  "confidence": number between 0-1,
  "notes": "brief notes about readability / uncertain parts"
}

Focus on the dead wax area between the label and the first groove.`
    }
  }

  // details
  return basePrompt + `Your task is to extract detailed technical information and small text details.

${mediaType === 'vinyl' ? `For VINYL, pay special attention to:
- Matrix numbers (etched in runout groove)
- Stamper codes and pressing marks
- Label variations and catalog numbers
- Any hand-etched markings
- Dead wax inscriptions` : `For CDs, carefully distinguish between these DIFFERENT identifiers:

**MATRIX NUMBER** (CRITICAL - located in INNER RING of disc):
- This is text ENGRAVED/ETCHED in the transparent inner ring near the center hole
- NOT the same as catalog number printed on the label!
- Read the FULL engraved text. If unclear, use "?" or return null.
- Do NOT copy example values.

**SID CODES** (small codes in mirror band/inner ring):
- IFPI Mastering SID: starts with "IFPI L" followed by 3-4 characters
- IFPI Mould SID: starts with "IFPI" + 4 characters NOT starting with L

**CATALOG NUMBER** (on printed label area):
- The number printed on the paper label or case

**OTHER CODES**:
- Barcode: usually on case back
- Label Code: "LC" followed by 4-5 digits`}

RESPOND ONLY IN VALID JSON FORMAT with this exact structure:
{
  "matrixNumber": "FULL engraved text from inner ring (NOT just catalog number) or null",
  "sidCodeMastering": "IFPI L... code or null",
  "sidCodeMould": "IFPI ... code (not starting with L) or null",
  "labelCode": "LC xxxx code or null",
  "barcode": "barcode number or null", 
  "extractedText": ["array", "of", "all", "visible", "text"],
  "technicalDetails": "detailed technical analysis",
  "alternativeSearchTerms": ["additional", "search", "terms"],
  "qualityAssessment": "assessment of image clarity for text reading",
  "extractedDetails": {
    "smallText": ["hard", "to", "read", "text"],
    "codes": ["various", "codes", "found"],
    "markings": ["special", "markings"]
  }
}

Use OCR-like precision for reading small text and codes.`
}

function getUserPrompt(mediaType: string, analysisType: 'general' | 'details' | 'matrix'): string {
  if (analysisType === 'general') {
    return `Analyze these ${mediaType} images and identify the music release. Extract the main information like artist, title, label, and catalog number. Provide multiple search terms that would help find this exact release on Discogs. Assess image quality for text readability.`
  }

  if (analysisType === 'matrix') {
    if (mediaType === 'cd') {
      return `Focus ONLY on CD inner ring / mirror band text and codes. The image may be preprocessed for enhanced contrast. Read the matrix number segment-by-segment around the ring (top arc + bottom arc if present). Use '?' for unclear characters. Do not guess missing parts.`
    } else {
      return `Focus ONLY on vinyl dead wax / runout groove area between the label and grooves. The image may be preprocessed to enhance embossed text. Look for etched, stamped, or hand-written matrix numbers. Include stamper codes and pressing plant indicators. Use '?' for unclear characters.`
    }
  }

  return `Examine these ${mediaType} images for detailed technical information. Look for small text, codes, matrix numbers, barcodes, and any markings that might help with precise identification. Extract ALL visible text, even if partially obscured.`
}

function mergeAnalysisResults(generalData: any, detailData: any, matrixData?: any) {
  // Handle both CD and vinyl matrix data structures
  const matrixFromMatrixPass = (() => {
    if (!matrixData) return null;
    
    // CD format: matrixNumberFull, matrixNumberTopArc, matrixNumberBottomArc
    if (matrixData.matrixNumberFull) return matrixData.matrixNumberFull;
    if (matrixData.matrixNumberTopArc || matrixData.matrixNumberBottomArc) {
      return [matrixData.matrixNumberTopArc, matrixData.matrixNumberBottomArc]
        .filter(Boolean)
        .join(' | ');
    }
    
    // Vinyl format: matrixNumberFull, matrixNumberSideA, matrixNumberSideB
    if (matrixData.matrixNumberSideA || matrixData.matrixNumberSideB) {
      const parts = [];
      if (matrixData.matrixNumberSideA) parts.push(`A: ${matrixData.matrixNumberSideA}`);
      if (matrixData.matrixNumberSideB) parts.push(`B: ${matrixData.matrixNumberSideB}`);
      return parts.join(' / ');
    }
    
    return null;
  })();

  // Extract vinyl-specific data
  const vinylExtras = matrixData ? {
    stamperCodes: matrixData.stamperCodes ?? null,
    pressingPlant: matrixData.pressingPlant ?? null,
    handEtched: matrixData.handEtched ?? null,
  } : {};

  return {
    // Primary fields from general analysis
    artist: generalData?.artist ?? null,
    title: generalData?.title ?? null,
    label: generalData?.label ?? null,
    catalogNumber: generalData?.catalogNumber ?? null,
    year: generalData?.year ?? null,
    genre: generalData?.genre ?? null,
    format: generalData?.format ?? null,
    country: generalData?.country ?? null,

    // Technical details (prefer dedicated matrix pass)
    matrixNumber: matrixFromMatrixPass || detailData?.matrixNumber || null,
    sidCodeMastering: matrixData?.sidCodeMastering ?? detailData?.sidCodeMastering ?? null,
    sidCodeMould: matrixData?.sidCodeMould ?? detailData?.sidCodeMould ?? null,
    labelCode: matrixData?.labelCode ?? detailData?.labelCode ?? null,
    barcode: detailData?.barcode ?? null,
    
    // Vinyl-specific extras
    ...vinylExtras,

    extractedText: [
      ...(generalData?.searchQueries || []),
      ...(detailData?.extractedText || [])
    ],

    // Combined metadata
    confidence: Math.max(generalData?.confidence || 0, 0.1),
    description: generalData?.description ?? null,
    imageQuality: generalData?.imageQuality || 'fair',
    extractedDetails: detailData?.extractedDetails,
    
    // Matrix pass notes for debugging
    matrixNotes: matrixData?.notes ?? null,

    // Enhanced search queries
    searchQueries: [
      ...(generalData?.searchQueries || []),
      ...(detailData?.alternativeSearchTerms || [])
    ].filter((query, index, array) => array.indexOf(query) === index)
  }
}

// Fetch pricing data for a Discogs release
async function fetchDiscogsPricing(discogsId: number): Promise<{
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  num_for_sale: number;
  currency: string;
  blocked?: boolean;
  blocked_reason?: string;
} | null> {
  try {
    console.log(`💰 Fetching pricing for Discogs ID: ${discogsId}`);
    
    const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY');
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    // Try scraping first if ScraperAPI is available
    if (scraperApiKey) {
      const sellUrl = `https://www.discogs.com/sell/release/${discogsId}`;
      const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(sellUrl)}&render=false`;
      
      console.log(`🌐 Scraping pricing from: ${sellUrl}`);
      
      try {
        const response = await fetch(scraperUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          console.log(`📄 Retrieved HTML, length: ${html.length}`);
          
          // Check if release is blocked from sale
          const blockedPatterns = [
            /blocked from sale/i,
            /not permitted to sell/i,
            /This release is blocked/i,
            /not available for sale/i,
            /sale.*?prohibited/i,
          ];
          
          for (const pattern of blockedPatterns) {
            if (pattern.test(html)) {
              console.log('🚫 Release is blocked from sale on Discogs');
              return {
                lowest_price: null,
                median_price: null,
                highest_price: null,
                num_for_sale: 0,
                currency: 'EUR',
                blocked: true,
                blocked_reason: 'Deze release is geblokkeerd voor verkoop op Discogs. Het is niet toegestaan dit item te verkopen op de Discogs Marketplace.'
              };
            }
          }
          
          // Extract pricing with multiple patterns
          const extractPrice = (patterns: RegExp[]): number | null => {
            for (const pattern of patterns) {
              const match = html.match(pattern);
              if (match?.[1]) {
                const price = parseFloat(match[1].replace(',', '.').replace(/\s/g, ''));
                if (!isNaN(price) && price > 0) return price;
              }
            }
            return null;
          };
          
          // Updated patterns for current Discogs HTML structure (2024-2026)
          const lowestPatterns = [
            // New Discogs structure
            /class="price"[^>]*>[\s\S]*?€\s*([\d.,]+)/i,
            /data-price="([\d.,]+)"/i,
            /"lowest"[^}]*"amount":\s*([\d.]+)/i,
            // Statistics section patterns
            /Lowest[:\s]*<[^>]*>[\s]*[€$£]?\s*([\d.,]+)/i,
            /Low[:\s]*<[^>]*>[\s]*[€$£]?\s*([\d.,]+)/i,
            /<span>Lowest:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
            /Lowest:[\s\n\r]*[€$£]?([\d.,]+)/,
            /<span>Low:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
            // From price to sale format
            /from\s+[€$£]?\s*([\d.,]+)/i,
            /starting\s+at\s+[€$£]?\s*([\d.,]+)/i,
          ];
          
          const medianPatterns = [
            /"median"[^}]*"amount":\s*([\d.]+)/i,
            /Median[:\s]*<[^>]*>[\s]*[€$£]?\s*([\d.,]+)/i,
            /<span>Median:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
            /Median:[\s\n\r]*[€$£]?([\d.,]+)/,
          ];
          
          const highestPatterns = [
            /"highest"[^}]*"amount":\s*([\d.]+)/i,
            /Highest[:\s]*<[^>]*>[\s]*[€$£]?\s*([\d.,]+)/i,
            /High[:\s]*<[^>]*>[\s]*[€$£]?\s*([\d.,]+)/i,
            /<span>Highest:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
            /Highest:[\s\n\r]*[€$£]?([\d.,]+)/,
            /<span>High:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
          ];
          
          // Also try to extract from JSON-LD or embedded data
          const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
          let jsonLdPricing: any = null;
          if (jsonLdMatch?.[1]) {
            try {
              const jsonLd = JSON.parse(jsonLdMatch[1]);
              if (jsonLd.offers) {
                const offers = Array.isArray(jsonLd.offers) ? jsonLd.offers : [jsonLd.offers];
                const prices = offers.map((o: any) => parseFloat(o.price)).filter((p: number) => !isNaN(p) && p > 0);
                if (prices.length > 0) {
                  jsonLdPricing = {
                    lowest: Math.min(...prices),
                    highest: Math.max(...prices),
                    median: prices.sort((a: number, b: number) => a - b)[Math.floor(prices.length / 2)]
                  };
                  console.log('✅ Found JSON-LD pricing data:', jsonLdPricing);
                }
              }
            } catch (e) {
              // JSON-LD parsing failed, continue with regex
            }
          }
          
          const numForSalePatterns = [
            /(\d+)\s+for sale/i,
            /(\d+)\s+items?\s+for sale/i,
            /(\d+)\s+available/i,
            /"numForSale":\s*(\d+)/i,
          ];
          
          let numForSale = 0;
          for (const pattern of numForSalePatterns) {
            const match = html.match(pattern);
            if (match?.[1]) {
              numForSale = parseInt(match[1]);
              break;
            }
          }
          
          const lowest = jsonLdPricing?.lowest || extractPrice(lowestPatterns);
          const median = jsonLdPricing?.median || extractPrice(medianPatterns);
          const highest = jsonLdPricing?.highest || extractPrice(highestPatterns);
          
          console.log(`📊 Pricing extraction attempt: lowest=${lowest}, median=${median}, highest=${highest}, for_sale=${numForSale}`);
          
          if (lowest || median || highest) {
            console.log(`✅ Scraped pricing: lowest=${lowest}, median=${median}, highest=${highest}, for_sale=${numForSale}`);
            return {
              lowest_price: lowest,
              median_price: median,
              highest_price: highest,
              num_for_sale: numForSale,
              currency: 'EUR'
            };
          }
          
          // Last resort: Try to find any price on the page
          const anyPriceMatch = html.match(/[€$£]\s*([\d]+[.,][\d]{2})/);
          if (anyPriceMatch?.[1]) {
            const fallbackPrice = parseFloat(anyPriceMatch[1].replace(',', '.'));
            if (!isNaN(fallbackPrice) && fallbackPrice > 0) {
              console.log(`⚠️ Using fallback single price: ${fallbackPrice}`);
              return {
                lowest_price: fallbackPrice,
                median_price: null,
                highest_price: null,
                num_for_sale: numForSale,
                currency: 'EUR'
              };
            }
          }
          
          console.log('⚠️ No pricing found in scraped HTML, release may not have items for sale');
        }
      } catch (scrapeError) {
        console.error('❌ Scraping failed:', scrapeError);
      }
    }
    
    // Fallback: Use Discogs API directly (only provides lowest_price)
    if (discogsToken) {
      console.log('🔄 Falling back to Discogs API for pricing...');
      const apiUrl = `https://api.discogs.com/releases/${discogsId}`;
      
      const apiResponse = await fetch(apiUrl, {
        headers: {
          'Authorization': `Discogs token=${discogsToken}`,
          'User-Agent': 'VinylScanApp/2.0'
        }
      });
      
      if (apiResponse.ok) {
        const releaseData = await apiResponse.json();
        if (releaseData.lowest_price) {
          console.log(`✅ API pricing: lowest_price=${releaseData.lowest_price}, num_for_sale=${releaseData.num_for_sale}`);
          return {
            lowest_price: releaseData.lowest_price,
            median_price: null,
            highest_price: null,
            num_for_sale: releaseData.num_for_sale || 0,
            currency: 'EUR'
          };
        }
      }
    }
    
    console.log('⚠️ No pricing data available');
    return null;
  } catch (error) {
    console.error('❌ Pricing fetch error:', error);
    return null;
  }
}

async function searchDiscogsV2(analysisData: any, mediaType: 'vinyl' | 'cd' = 'cd') {
  try {
    // Determine format filter based on media type
    const formatFilter = mediaType === 'vinyl' ? 'Vinyl' : 'CD';
    console.log(`🔍 Searching Discogs V2 with format filter: ${formatFilter}`);
    console.log(`🎵 Search strategy mode: ${mediaType === 'cd' ? 'BARCODE-FIRST (CD)' : 'MATRIX-FIRST (Vinyl)'}`);
    
    // Log technical identifiers for debugging
    console.log('📋 Technical identifiers available:', {
      artist: analysisData.artist || null,
      title: analysisData.title || null,
      matrixNumber: analysisData.matrixNumber || analysisData.matrixNumberFull || null,
      sidCodeMastering: analysisData.sidCodeMastering || null,
      sidCodeMould: analysisData.sidCodeMould || null,
      barcode: analysisData.barcode || null,
      catalogNumber: analysisData.catalogNumber || null,
      labelCode: analysisData.labelCode || null
    });
    
    // MEDIA-SPECIFIC search strategies
    // CD: Barcode-first (vrijwel altijd barcode sinds jaren '80)
    // Vinyl: Matrix-first (oudere platen hebben vaak geen barcode)
    
    // Normalize barcode: remove all spaces for Discogs API compatibility
    const normalizedBarcode = analysisData.barcode 
      ? analysisData.barcode.replace(/\s+/g, '') 
      : null;
    
    if (normalizedBarcode && normalizedBarcode !== analysisData.barcode) {
      console.log(`📊 Barcode normalized: "${analysisData.barcode}" → "${normalizedBarcode}"`);
    }
    
    const searchStrategies: Array<{ query: string; type: string; format?: string | null; priority: string }> = 
      mediaType === 'cd' 
        ? [
            // === CD: BARCODE-FIRST STRATEGY ===
            // Strategy 1: Barcode (PRIMARY - 100% unique per pressing)
            ...(normalizedBarcode ? [{
              query: normalizedBarcode,
              type: 'barcode',
              format: formatFilter,
              priority: 'primary'
            }] : []),
            
            // Strategy 2: Matrix number (CRITICAL - pressing-specific)
            ...(analysisData.matrixNumber ? [{ 
              query: analysisData.matrixNumber, 
              type: 'matrix', 
              format: null,
              priority: 'critical'
            }] : []),
            ...(analysisData.matrixNumberFull && analysisData.matrixNumberFull !== analysisData.matrixNumber ? [{ 
              query: analysisData.matrixNumberFull, 
              type: 'matrix', 
              format: null,
              priority: 'critical'
            }] : []),

            // Strategy 3: Catalog number (HIGH)
            ...(analysisData.catalogNumber ? [{
              query: analysisData.catalogNumber,
              type: 'catno',
              format: formatFilter,
              priority: 'high'
            }] : []),
            
            // Strategy 4: Label + Catno (MEDIUM)
            ...(analysisData.label && analysisData.catalogNumber ? [{
              query: `${analysisData.label} ${analysisData.catalogNumber}`,
              type: 'label_catno',
              format: formatFilter,
              priority: 'medium'
            }] : []),
            
            // Strategy 5: Artist + Title (LOW - OCR-dependent, can have errors)
            ...(analysisData.artist && analysisData.title ? [{
              query: `${analysisData.artist} ${analysisData.title}`,
              type: 'artist_title_format',
              format: formatFilter,
              priority: 'low'
            }] : []),
            
            // Strategy 6: General fallback without format filter
            ...(analysisData.artist && analysisData.title ? [{
              query: `${analysisData.artist} ${analysisData.title}`,
              type: 'general_fallback',
              format: null,
              priority: 'fallback'
            }] : []),
            
            // Strategy 7: Additional search terms (FALLBACK)
            ...(analysisData.searchQueries || []).map((q: string) => ({ 
              query: q, 
              type: 'alternative', 
              format: null,
              priority: 'fallback'
            }))
          ]
        : [
            // === VINYL: MATRIX-FIRST STRATEGY ===
            // Vinyl records (especially older ones) often don't have barcodes
            // Matrix number in runout groove is the primary identifier
            
            // Strategy 1: Matrix number (PRIMARY for vinyl - always in runout groove)
            ...(analysisData.matrixNumber ? [{ 
              query: analysisData.matrixNumber, 
              type: 'matrix', 
              format: null,
              priority: 'primary'
            }] : []),
            ...(analysisData.matrixNumberFull && analysisData.matrixNumberFull !== analysisData.matrixNumber ? [{ 
              query: analysisData.matrixNumberFull, 
              type: 'matrix', 
              format: null,
              priority: 'primary'
            }] : []),
            
            // Strategy 2: Catalog number (HIGH)
            ...(analysisData.catalogNumber ? [{
              query: analysisData.catalogNumber,
              type: 'catno',
              format: formatFilter,
              priority: 'high'
            }] : []),
            
            // Strategy 3: Label + Catno (MEDIUM)
            ...(analysisData.label && analysisData.catalogNumber ? [{
              query: `${analysisData.label} ${analysisData.catalogNumber}`,
              type: 'label_catno',
              format: formatFilter,
              priority: 'medium'
            }] : []),
            
            // Strategy 4: Artist + Title (MEDIUM for vinyl - more important without barcode)
            ...(analysisData.artist && analysisData.title ? [{
              query: `${analysisData.artist} ${analysisData.title}`,
              type: 'artist_title_format',
              format: formatFilter,
              priority: 'medium'
            }] : []),
            
            // Strategy 5: Barcode (FALLBACK - only modern vinyl has barcode)
            ...(normalizedBarcode ? [{
              query: normalizedBarcode,
              type: 'barcode',
              format: formatFilter,
              priority: 'fallback'
            }] : []),
            
            // Strategy 6: General fallback without format filter
            ...(analysisData.artist && analysisData.title ? [{
              query: `${analysisData.artist} ${analysisData.title}`,
              type: 'general_fallback',
              format: null,
              priority: 'fallback'
            }] : []),
            
            // Strategy 7: Additional search terms (FALLBACK)
            ...(analysisData.searchQueries || []).map((q: string) => ({ 
              query: q, 
              type: 'alternative', 
              format: null,
              priority: 'fallback'
            }))
          ];

    let bestMatch = null
    let highestConfidence = 0
    let verifiedByMatrix = false
    const searchMetadata = {
      strategies: [] as any[],
      totalSearches: 0,
      bestStrategy: null as string | null,
      matrixVerified: false,
      verificationLevel: null as string | null,
      technicalMatches: {
        barcode: false,
        matrix: false,
        sidCode: false,
        catno: false,
        label: false,
        year: false,
        country: false
      }
    }

    for (const [index, strategyItem] of searchStrategies.entries()) {
      const { query, type, format: strategyFormat, priority } = strategyItem as { query: string; type: string; format?: string | null; priority: string }
      if (!query || query.trim().length < 2) continue
      
      console.log(`🔍 V2 Strategy ${index + 1} (${type}/${priority}): "${query}"${strategyFormat ? ` [format=${strategyFormat}]` : ''}`);
      searchMetadata.totalSearches++
      
      // Build search URL with type-specific parameters
      let searchUrl: string;
      if (type === 'barcode') {
        searchUrl = `https://api.discogs.com/database/search?barcode=${encodeURIComponent(query)}&type=release`;
      } else if (type === 'catno') {
        searchUrl = `https://api.discogs.com/database/search?catno=${encodeURIComponent(query)}&type=release`;
      } else {
        searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release`;
      }
      
      // Add format filter if specified (CD or Vinyl)
      if (strategyFormat) {
        searchUrl += `&format=${encodeURIComponent(strategyFormat)}`;
      }
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'VinylScanApp/2.0',
          'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.results && data.results.length > 0) {
          // For each candidate, fetch detailed release info to verify matrix/IFPI
          for (const match of data.results.slice(0, 5)) {
            let releaseDetails = null
            let matrixMatch = false
            let sidMatch = false
            let catnoMatch = false
            let labelMatch = false
            let yearMatch = false
            let countryMatch = false
            
            // Fetch full release details for matrix verification
            if (analysisData.matrixNumber || analysisData.matrixNumberFull || analysisData.sidCodeMastering || analysisData.sidCodeMould) {
              try {
                const releaseResponse = await fetch(`https://api.discogs.com/releases/${match.id}`, {
                  headers: {
                    'User-Agent': 'VinylScanApp/2.0',
                    'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
                  }
                });
                
                if (releaseResponse.ok) {
                  releaseDetails = await releaseResponse.json();
                  
                  // Check matrix/runout match
                  if (releaseDetails.identifiers) {
                    const extractedMatrix = (analysisData.matrixNumber || analysisData.matrixNumberFull || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    const extractedSidMastering = (analysisData.sidCodeMastering || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    const extractedSidMould = (analysisData.sidCodeMould || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    for (const identifier of releaseDetails.identifiers) {
                      const identValue = (identifier.value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                      
                      // Matrix/Runout match
                      if (identifier.type === 'Matrix / Runout' && extractedMatrix) {
                        if (identValue.includes(extractedMatrix) || extractedMatrix.includes(identValue)) {
                          console.log(`✅ Matrix match found: "${identifier.value}" matches "${analysisData.matrixNumber || analysisData.matrixNumberFull}"`);
                          matrixMatch = true;
                          searchMetadata.technicalMatches.matrix = true;
                        }
                      }
                      
                      // SID Code match
                      if (identifier.type === 'Mastering SID Code' && extractedSidMastering) {
                        if (identValue === extractedSidMastering) {
                          console.log(`✅ SID Mastering match: "${identifier.value}"`);
                          sidMatch = true;
                          searchMetadata.technicalMatches.sidCode = true;
                        }
                      }
                      
                      if (identifier.type === 'Mould SID Code' && extractedSidMould) {
                        if (identValue === extractedSidMould) {
                          console.log(`✅ SID Mould match: "${identifier.value}"`);
                          sidMatch = true;
                          searchMetadata.technicalMatches.sidCode = true;
                        }
                      }
                    }
                  }
                  
                  // Check barcode match
                  if (releaseDetails.identifiers && analysisData.barcode) {
                    const extractedBarcode = analysisData.barcode.replace(/[^0-9]/g, '');
                    for (const identifier of releaseDetails.identifiers) {
                      if (identifier.type === 'Barcode' && identifier.value) {
                        const discogsBarcode = identifier.value.replace(/[^0-9]/g, '');
                        if (discogsBarcode === extractedBarcode) {
                          console.log(`✅ Barcode match: "${identifier.value}"`);
                          searchMetadata.technicalMatches.barcode = true;
                        }
                      }
                    }
                  }
                  
                  // Check catalog number match
                  if (analysisData.catalogNumber && releaseDetails.labels) {
                    const extractedCatno = analysisData.catalogNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
                    for (const label of releaseDetails.labels) {
                      if (label.catno) {
                        const discogsCatno = label.catno.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (discogsCatno === extractedCatno || discogsCatno.includes(extractedCatno) || extractedCatno.includes(discogsCatno)) {
                          console.log(`✅ Catalog number match: "${label.catno}"`);
                          catnoMatch = true;
                          searchMetadata.technicalMatches.catno = true;
                        }
                      }
                    }
                  }
                  
                  // Check label match
                  if (analysisData.label && releaseDetails.labels) {
                    const extractedLabel = analysisData.label.toLowerCase();
                    for (const label of releaseDetails.labels) {
                      if (label.name && label.name.toLowerCase().includes(extractedLabel)) {
                        console.log(`✅ Label match: "${label.name}"`);
                        labelMatch = true;
                        searchMetadata.technicalMatches.label = true;
                      }
                    }
                  }
                  
                  // Check year match
                  if (analysisData.year && releaseDetails.year) {
                    if (parseInt(analysisData.year) === parseInt(releaseDetails.year)) {
                      console.log(`✅ Year match: ${releaseDetails.year}`);
                      yearMatch = true;
                      searchMetadata.technicalMatches.year = true;
                    }
                  }
                  
                  // Check country match
                  if (analysisData.country && releaseDetails.country) {
                    const extractedCountry = analysisData.country.toLowerCase();
                    const discogsCountry = releaseDetails.country.toLowerCase();
                    if (extractedCountry === discogsCountry || extractedCountry.includes(discogsCountry) || discogsCountry.includes(extractedCountry)) {
                      console.log(`✅ Country match: ${releaseDetails.country}`);
                      countryMatch = true;
                      searchMetadata.technicalMatches.country = true;
                    }
                  }
                }
              } catch (detailError) {
                console.log('⚠️ Could not fetch release details for verification:', detailError);
              }
            }
            
            // === PROTOCOL CONFIDENCE SCORING (fixed weights - not media-specific) ===
            // According to MusicScan protocol:
            // Matrix exact/fuzzy = +50 (highest - DOORSLAGGEVEND)
            // Barcode exact = +40 (secondary)
            // Catno exact = +25
            // Label exact = +15
            // Year exact = +10
            // Country exact = +10
            // Total: 150 points
            
            let confidencePoints = 0;
            const totalPossiblePoints = 150;
            
            // 🎯 Matrix = ALTIJD HOOGSTE GEWICHT (doorslaggevend voor identificatie)
            if (matrixMatch) {
              confidencePoints += 50;
              console.log(`📈 Matrix match: +50 points (DOORSLAGGEVEND)`);
            }
            
            // 🔢 Barcode = secundair (hard bewijs maar niet per se pressing-specifiek)
            if (searchMetadata.technicalMatches.barcode) {
              confidencePoints += 40;
              console.log(`📈 Barcode match: +40 points (hard bewijs)`);
            }
            
            // Validation signals
            if (catnoMatch) {
              confidencePoints += 25;
              console.log(`📈 Catalog number match: +25 points`);
            }
            if (labelMatch) {
              confidencePoints += 15;
              console.log(`📈 Label match: +15 points`);
            }
            if (yearMatch) {
              confidencePoints += 10;
              console.log(`📈 Year match: +10 points`);
            }
            if (countryMatch) {
              confidencePoints += 10;
              console.log(`📈 Country match: +10 points`);
            }
            
            // Normalize to 0-1 scale
            const confidence = confidencePoints / totalPossiblePoints;
            console.log(`📊 Total confidence: ${confidencePoints}/${totalPossiblePoints} = ${(confidence * 100).toFixed(1)}%`);
            
            searchMetadata.strategies.push({
              query,
              type,
              priority,
              strategy: index + 1,
              resultsCount: data.results.length,
              confidence,
              confidencePoints,
              match: match.title,
              matrixVerified: matrixMatch,
              sidVerified: sidMatch,
              barcodeVerified: searchMetadata.technicalMatches.barcode
            })
            
            if (confidence > highestConfidence) {
              highestConfidence = confidence
              bestMatch = match
              bestMatch.releaseDetails = releaseDetails // Store for pricing context
              searchMetadata.bestStrategy = `${index + 1} (${type})`
              verifiedByMatrix = matrixMatch || sidMatch
              searchMetadata.matrixVerified = verifiedByMatrix
            }
            
            // 🎯 PROTOCOL: MATRIX IS ALWAYS DOORSLAGGEVEND
            // Matrix + ANY secondary identifier = LOCKED (100% verified)
            // Priority: Matrix+Barcode > Matrix+Catno > Matrix+Label
            if (matrixMatch) {
              if (searchMetadata.technicalMatches.barcode) {
                console.log('🎯 LOCKED: Matrix + Barcode confirmed');
                console.log(`   Release: ${bestMatch.title} (ID: ${bestMatch.id})`);
                console.log(`   Confidence: ${confidencePoints}/${totalPossiblePoints} = ${(confidence * 100).toFixed(1)}%`);
                searchMetadata.verificationLevel = 'LOCKED';
                break;
              } else if (catnoMatch) {
                console.log('🎯 LOCKED: Matrix + Catalog confirmed');
                console.log(`   Release: ${bestMatch.title} (ID: ${bestMatch.id})`);
                console.log(`   Confidence: ${confidencePoints}/${totalPossiblePoints} = ${(confidence * 100).toFixed(1)}%`);
                searchMetadata.verificationLevel = 'LOCKED';
                break;
              } else if (labelMatch && yearMatch) {
                console.log('🎯 LOCKED: Matrix + Label + Year confirmed');
                console.log(`   Release: ${bestMatch.title} (ID: ${bestMatch.id})`);
                console.log(`   Confidence: ${confidencePoints}/${totalPossiblePoints} = ${(confidence * 100).toFixed(1)}%`);
                searchMetadata.verificationLevel = 'LOCKED';
                break;
              }
            }
            
            // 🔢 BARCODE + CATNO = HIGH (barcode is unique per commercial release)
            if (searchMetadata.technicalMatches.barcode && catnoMatch && !matrixMatch) {
              console.log('🎯 HIGH: Barcode + Catalog confirmed (matrix pending)');
              console.log(`   Release: ${bestMatch.title} (ID: ${bestMatch.id})`);
              searchMetadata.verificationLevel = 'HIGH';
              // Don't break - continue searching for matrix confirmation
            }
          }
        }
      }
      
      // Early exit if LOCKED
      if (searchMetadata.verificationLevel === 'LOCKED') {
        console.log('🔒 Match LOCKED - stopping all searches');
        break
      }
      
      // Early exit if we have a very high confidence match (90%+)
      if (highestConfidence >= 0.9) {
        console.log(`🎯 High confidence match found (${(highestConfidence * 100).toFixed(1)}%), stopping search`)
        break
      }
    }

    if (bestMatch) {
      console.log(`✅ Best match found: ${bestMatch.title} (ID: ${bestMatch.id}, confidence: ${(highestConfidence * 100).toFixed(1)}%, verification: ${searchMetadata.verificationLevel || 'standard'})`);
      
      // Parse artist and title from Discogs result
      // Discogs returns "Artist - Title" or "Artist (num) - Title" format
      let parsedArtist = bestMatch.artist;
      let parsedTitle = bestMatch.title;
      
      // If no separate artist field, extract from the combined title field
      if (!parsedArtist && parsedTitle && parsedTitle.includes(' - ')) {
        const parts = parsedTitle.split(' - ');
        if (parts.length >= 2) {
          // Remove numbering like "(2)" from artist name
          parsedArtist = parts[0].replace(/\s*\(\d+\)\s*$/, '').trim();
          parsedTitle = parts.slice(1).join(' - ').trim();
          console.log(`📝 Parsed artist/title from Discogs: "${parsedArtist}" - "${parsedTitle}"`);
        }
      }
      
      // Use Discogs data, fall back to OCR only if Discogs has nothing
      const finalArtist = parsedArtist || analysisData.artist;
      const finalTitle = parsedTitle || analysisData.title;
      
      console.log(`🎯 Final artist: "${finalArtist}" (from ${parsedArtist ? 'Discogs' : 'OCR'})`);
      console.log(`🎯 Final title: "${finalTitle}" (from ${parsedTitle ? 'Discogs' : 'OCR'})`);
      
      return {
        discogsId: bestMatch.id,
        discogsUrl: `https://www.discogs.com/release/${bestMatch.id}`,
        artist: finalArtist,
        title: finalTitle,
        label: bestMatch.label?.[0] || analysisData.label,
        catalogNumber: bestMatch.catno || analysisData.catalogNumber,
        year: bestMatch.year || analysisData.year,
        confidence: highestConfidence,
        matrixVerified: verifiedByMatrix,
        searchMetadata
      }
    }

    // No match found, return analysis data with enhanced confidence assessment
    return {
      discogsId: null,
      discogsUrl: null,
      artist: analysisData.artist,
      title: analysisData.title,
      label: analysisData.label,
      catalogNumber: analysisData.catalogNumber,
      year: analysisData.year,
      confidence: Math.max(analysisData.confidence * 0.3, 0.1),
      matrixVerified: false,
      searchMetadata
    }

  } catch (error) {
    console.error('❌ Discogs V2 search error:', error)
    
    return {
      discogsId: null,
      discogsUrl: null,
      artist: analysisData.artist,
      title: analysisData.title,
      label: analysisData.label,
      catalogNumber: analysisData.catalogNumber,
      year: analysisData.year,
      confidence: 0.1,
      matrixVerified: false,
      searchMetadata: { error: error.message }
    }
  }
}

function calculateConfidenceV2(discogsMatch: any, analysisData: any, strategyIndex: number): number {
  let confidence = 0.2 // Base confidence

  // Strategy bonus (earlier strategies are more reliable)
  const strategyBonus = Math.max(0.1, 0.4 - (strategyIndex * 0.05))
  confidence += strategyBonus

  // Exact catalog number match (highest weight)
  if (analysisData.catalogNumber && discogsMatch.catno) {
    const catnoSimilarity = calculateSimilarityV2(
      analysisData.catalogNumber.toLowerCase().replace(/[^a-z0-9]/g, ''),
      discogsMatch.catno.toLowerCase().replace(/[^a-z0-9]/g, '')
    )
    confidence += catnoSimilarity * 0.4
  }

  // Artist match
  if (analysisData.artist && discogsMatch.artist) {
    const artistSimilarity = calculateSimilarityV2(
      analysisData.artist.toLowerCase(),
      discogsMatch.artist.toLowerCase()
    )
    confidence += artistSimilarity * 0.25
  }

  // Title match
  if (analysisData.title && discogsMatch.title) {
    const titleSimilarity = calculateSimilarityV2(
      analysisData.title.toLowerCase(),
      discogsMatch.title.toLowerCase()
    )
    confidence += titleSimilarity * 0.25
  }

  // Year match bonus
  if (analysisData.year && discogsMatch.year && analysisData.year === discogsMatch.year) {
    confidence += 0.1
  }

  // Label match bonus
  if (analysisData.label && discogsMatch.label && discogsMatch.label.length > 0) {
    const labelSimilarity = calculateSimilarityV2(
      analysisData.label.toLowerCase(),
      discogsMatch.label[0].toLowerCase()
    )
    confidence += labelSimilarity * 0.1
  }

  return Math.min(confidence, 1.0)
}

function calculateSimilarityV2(str1: string, str2: string): number {
  // Enhanced similarity calculation
  if (str1 === str2) return 1.0
  
  // Exact substring match
  if (str1.includes(str2) || str2.includes(str1)) return 0.9
  
  // Word-based similarity with better weighting
  const words1 = str1.split(/\s+/).filter(w => w.length > 0)
  const words2 = str2.split(/\s+/).filter(w => w.length > 0)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  let commonWords = 0
  let totalImportance = 0
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2) {
        commonWords++
        totalImportance += word1.length // Longer words are more important
        break
      } else if (word1.includes(word2) || word2.includes(word1)) {
        commonWords += 0.7
        totalImportance += Math.min(word1.length, word2.length) * 0.7
        break
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length)
  const wordSimilarity = commonWords / maxWords
  
  return Math.min(wordSimilarity, 1.0)
}
