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

/**
 * MATRIX NORMALIZATION PATCH (CRITICAL)
 * 
 * Before any Discogs matching:
 * 1. Split matrix_raw into tokens by whitespace.
 * 2. Remove leading tokens that:
 *    - have length < 3, OR
 *    - are purely numeric, OR
 *    - do not contain both letters and numbers.
 * 3. Rejoin remaining tokens as matrix_canonical.
 * 4. Use matrix_canonical for all matching and scoring.
 * 5. Matrix match is TRUE if all canonical tokens exist in the Discogs candidate matrix (subset match).
 * 
 * Example:
 * Input: "S 2 SUMCD 4164 01"
 * Canonical: "SUMCD 4164 01"
 */
function normalizeMatrixRaw(matrixRaw: string): { canonical: string; tokens: string[]; raw: string; isValid: boolean; invalidReason?: string } {
  if (!matrixRaw) {
    return { canonical: '', tokens: [], raw: '', isValid: false, invalidReason: 'empty' };
  }
  
  const rawNorm = matrixRaw.toUpperCase().replace(/\s+/g, ' ').trim();
  const tokens = rawNorm.split(' ').filter(Boolean);
  
  // === PATCH A: MATRIX SANITY GUARD ===
  // Check if this looks like a barcode instead of a matrix
  const allDigits = rawNorm.replace(/[^0-9]/g, '');
  const hasSignificantAlphaTokens = tokens.some(t => {
    const hasLetters = /[A-Z]/.test(t);
    const hasNumbers = /[0-9]/.test(t);
    // A significant token has BOTH letters and numbers (like "SUMCD4164")
    // OR is a known catno-like pattern (letters only, 3+ chars)
    return (hasLetters && hasNumbers && t.length >= 4) || 
           (hasLetters && !hasNumbers && t.length >= 3);
  });
  
  // Rule 1: If 12+ consecutive digits and no significant alpha tokens → barcode leak
  if (allDigits.length >= 12 && !hasSignificantAlphaTokens) {
    console.log(`   ⛔ MATRIX SANITY GUARD: Detected barcode-like pattern`);
    console.log(`      Digits: ${allDigits} (${allDigits.length} digits)`);
    console.log(`      No significant alphanumeric tokens found`);
    return { 
      canonical: '', 
      tokens: [], 
      raw: rawNorm, 
      isValid: false, 
      invalidReason: 'barcode_pattern_detected' 
    };
  }
  
  // Rule 2: If it's purely an EAN-13 pattern (exactly 13 digits, no meaningful letters)
  if (allDigits.length === 13 && !hasSignificantAlphaTokens) {
    console.log(`   ⛔ MATRIX SANITY GUARD: Detected EAN-13 pattern`);
    return { 
      canonical: '', 
      tokens: [], 
      raw: rawNorm, 
      isValid: false, 
      invalidReason: 'ean13_pattern_detected' 
    };
  }
  
  // === LEADING NOISE REMOVAL ===
  // Find the first token that looks like a real matrix identifier
  let startIndex = 0;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Skip tokens shorter than 3 characters
    if (token.length < 3) {
      startIndex = i + 1;
      continue;
    }
    
    // Check if token has alphanumeric structure (letters AND numbers)
    const hasLetters = /[A-Z]/.test(token);
    const hasNumbers = /[0-9]/.test(token);
    
    // If token has both letters and numbers, this is likely the start of the real matrix
    if (hasLetters && hasNumbers) {
      startIndex = i;
      break;
    }
    
    // If token is ONLY letters (single char like "S") or ONLY numbers ("2"), skip it as noise
    if ((hasLetters && !hasNumbers && token.length < 3) || (!hasLetters && hasNumbers && token.length < 3)) {
      startIndex = i + 1;
      continue;
    }
    
    // If we hit a token that looks like a real identifier (e.g., pure catno), start here
    if (hasLetters || (hasNumbers && token.length >= 3)) {
      startIndex = i;
      break;
    }
  }
  
  const canonicalTokens = tokens.slice(startIndex);
  const canonical = canonicalTokens.join(' ');
  
  // Final sanity check on canonical form
  const canonicalDigits = canonical.replace(/[^0-9]/g, '');
  const canonicalHasAlpha = /[A-Z]/.test(canonical);
  
  // If after cleanup we still have 10+ digits without meaningful letters, it's suspicious
  if (canonicalDigits.length >= 10 && !canonicalHasAlpha) {
    console.log(`   ⛔ MATRIX SANITY GUARD: Canonical still looks like barcode`);
    return { 
      canonical: '', 
      tokens: [], 
      raw: rawNorm, 
      isValid: false, 
      invalidReason: 'canonical_barcode_like' 
    };
  }
  
  const isValid = canonical.length > 0;
  
  console.log(`   🔧 Matrix Normalization:`);
  console.log(`      Raw: "${rawNorm}"`);
  console.log(`      Canonical: "${canonical}"`);
  console.log(`      Tokens removed: ${startIndex} leading noise token(s)`);
  console.log(`      Valid: ${isValid ? '✅' : '❌'}`);
  
  return {
    canonical,
    tokens: canonicalTokens,
    raw: rawNorm,
    isValid
  };
}

/**
 * MusicScan Discogs Matching Protocol v3.0
 * 
 * 🎯 KERNPRINCIPE: Technische identifiers bepalen waarheid. Titel/artiest zijn decoratie.
 * 
 * HIËRARCHIE (VERPLICHTE VOLGORDE):
 * 1. BARCODE (PRIMARY) - ❌ NOOIT format filter
 * 2. CATNO + LABEL (HIGH) - ❌ NOOIT format filter  
 * 3. ARTIST + TITLE (FALLBACK) - ⚠️ MAG NOOIT AUTO-SELECTEREN
 * 
 * SCORING:
 * - Matrix exact: +50 (DOORSLAGGEVEND)
 * - Barcode exact: +40
 * - Catno exact: +25
 * - Label exact: +15
 * - Year exact: +10
 * - Country exact: +10
 * - Title similarity: +5
 * Total: 155 punten
 * 
 * LOCK CONDITIONS (early exit):
 * - Matrix + Barcode
 * - Matrix + Catno
 * - Matrix + Label + Year
 * 
 * HARD GATING:
 * - Score < 70 → NO_MATCH
 * - Fuzzy-only match bij aanwezige identifiers → manual_review_required
 */
async function searchDiscogsV2(analysisData: any, mediaType: 'vinyl' | 'cd' = 'cd') {
  try {
    const formatFilter = mediaType === 'vinyl' ? 'Vinyl' : 'CD';
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 MusicScan Protocol v3.0 - ${mediaType.toUpperCase()} MATCHING`);
    console.log(`${'='.repeat(60)}`);
    
    // === NORMALISATIE (ALTIJD UITVOEREN) ===
    const barcodeDigits = analysisData.barcode 
      ? analysisData.barcode.replace(/[^0-9]/g, '') 
      : null;
    const catnoNorm = analysisData.catalogNumber 
      ? analysisData.catalogNumber.toUpperCase().replace(/\s+/g, ' ').trim()
      : null;
    
    // 🔧 MATRIX NORMALIZATION: Remove leading noise tokens
    const matrixRaw = analysisData.matrixNumber || analysisData.matrixNumberFull || '';
    const matrixNormalized = normalizeMatrixRaw(matrixRaw);
    const matrixNorm = matrixNormalized.canonical;
    const matrixTokens = matrixNormalized.tokens;
    
    // === PATCH A: MATRIX VALIDITY CHECK ===
    const matrixValid = matrixNormalized.isValid;
    
    console.log('📋 GENORMALISEERDE IDENTIFIERS:');
    console.log(`   barcode_digits: ${barcodeDigits || '(geen)'}`);
    console.log(`   catno_norm: ${catnoNorm || '(geen)'}`);
    console.log(`   matrix_norm: ${matrixNorm || '(geen)'}`);
    console.log(`   matrix_tokens: [${matrixTokens.join(', ')}]`);
    console.log(`   matrix_valid: ${matrixValid ? '✅' : `❌ (${matrixNormalized.invalidReason || 'unknown'})`}`);
    console.log(`   label: ${analysisData.label || '(geen)'}`);
    console.log(`   artist: ${analysisData.artist || '(geen)'}`);
    console.log(`   title: ${analysisData.title || '(geen)'}`);
    
    // Track of we technische identifiers hebben (alleen geldige matrix meetellen)
    const hasTechnicalIdentifiers = !!(barcodeDigits || catnoNorm || (matrixNorm && matrixValid));
    console.log(`\n⚡ Technische identifiers aanwezig: ${hasTechnicalIdentifiers ? 'JA' : 'NEE'}`);
    
    // Search metadata voor debugging en output
    const searchMetadata = {
      protocol_version: '3.0',
      strategies_executed: [] as any[],
      total_searches: 0,
      best_strategy: null as string | null,
      verification_level: null as string | null,
      lock_reason: null as string | null,
      matched_on: [] as string[],
      explain: [] as string[],
      technical_matches: {
        barcode: false,
        matrix: false,
        catno: false,
        label: false,
        year: false,
        country: false
      }
    };

    let bestMatch: any = null;
    let bestConfidencePoints = 0;
    let bestMatchDetails: any = null;
    
    // === STRATEGY 1: BARCODE (PRIMARY, HARD) ===
    // ❌ VERBODEN: format, country, year, fuzzy q
    if (barcodeDigits) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`🥇 STRATEGY 1: BARCODE SEARCH (PRIMARY)`);
      console.log(`   Query: barcode=${barcodeDigits}`);
      console.log(`   ❌ NO format filter (protocol requirement)`);
      
      const searchUrl = `https://api.discogs.com/database/search?barcode=${encodeURIComponent(barcodeDigits)}&type=release`;
      searchMetadata.total_searches++;
      
      try {
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'MusicScanApp/3.0',
            'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   📊 Results: ${data.results?.length || 0} candidates`);
          
          searchMetadata.strategies_executed.push({
            strategy: 1,
            type: 'barcode',
            query: barcodeDigits,
            results: data.results?.length || 0,
            format_filter: false
          });
          
          if (data.results && data.results.length > 0) {
            // Verify candidates
            for (const candidate of data.results.slice(0, 5)) {
              const verification = await verifyCandidate(candidate, analysisData, barcodeDigits, catnoNorm, matrixNorm, matrixTokens, matrixValid);
              
              if (verification.points > bestConfidencePoints) {
                bestConfidencePoints = verification.points;
                bestMatch = candidate;
                bestMatchDetails = verification;
                searchMetadata.matched_on = verification.matched_on;
                searchMetadata.technical_matches = verification.technical_matches;
                searchMetadata.explain = verification.explain;
              }
              
              // Check LOCK conditions
              if (verification.lock_reason) {
                searchMetadata.verification_level = 'LOCKED';
                searchMetadata.lock_reason = verification.lock_reason;
                console.log(`   🔒 ${verification.lock_reason}`);
                break;
              }
            }
            
            if (searchMetadata.verification_level === 'LOCKED') {
              console.log(`\n✅ LOCKED MATCH via barcode strategy`);
            }
          }
        } else {
          console.log(`   ⚠️ API Error: ${response.status}`);
        }
      } catch (err) {
        console.log(`   ❌ Fetch error: ${err.message}`);
      }
    }
    
    // === STRATEGY 2: CATNO + LABEL (HIGH) ===
    // ❌ VERBODEN: format filter
    if (!searchMetadata.verification_level && catnoNorm) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`🥈 STRATEGY 2: CATNO SEARCH (HIGH)`);
      console.log(`   Query: catno=${catnoNorm}${analysisData.label ? ` + label=${analysisData.label}` : ''}`);
      console.log(`   ❌ NO format filter (protocol requirement)`);
      
      let searchUrl = `https://api.discogs.com/database/search?catno=${encodeURIComponent(catnoNorm)}&type=release`;
      if (analysisData.label) {
        searchUrl += `&label=${encodeURIComponent(analysisData.label)}`;
      }
      searchMetadata.total_searches++;
      
      try {
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'MusicScanApp/3.0',
            'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   📊 Results: ${data.results?.length || 0} candidates`);
          
          searchMetadata.strategies_executed.push({
            strategy: 2,
            type: 'catno',
            query: catnoNorm,
            label: analysisData.label || null,
            results: data.results?.length || 0,
            format_filter: false
          });
          
          if (data.results && data.results.length > 0) {
            for (const candidate of data.results.slice(0, 5)) {
              const verification = await verifyCandidate(candidate, analysisData, barcodeDigits, catnoNorm, matrixNorm, matrixTokens, matrixValid);
              
              if (verification.points > bestConfidencePoints) {
                bestConfidencePoints = verification.points;
                bestMatch = candidate;
                bestMatchDetails = verification;
                searchMetadata.matched_on = verification.matched_on;
                searchMetadata.technical_matches = verification.technical_matches;
                searchMetadata.explain = verification.explain;
              }
              
              if (verification.lock_reason) {
                searchMetadata.verification_level = 'LOCKED';
                searchMetadata.lock_reason = verification.lock_reason;
                console.log(`   🔒 ${verification.lock_reason}`);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.log(`   ❌ Fetch error: ${err.message}`);
      }
    }
    
    // === STRATEGY 3: ARTIST + TITLE (SUGGEST ONLY) ===
    // ⚠️ MAG NOOIT AUTOMATISCH SELECTEREN bij aanwezige technische identifiers
    const needsFuzzySearch = !bestMatch && analysisData.artist && analysisData.title;
    
    if (needsFuzzySearch) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`🥉 STRATEGY 3: ARTIST + TITLE (SUGGEST ONLY)`);
      console.log(`   Query: ${analysisData.artist} - ${analysisData.title}`);
      console.log(`   ⚠️ Format filter: ${formatFilter} (alleen voor fuzzy)`);
      
      if (hasTechnicalIdentifiers) {
        console.log(`   ⛔ HARD GATE: Technische identifiers aanwezig maar geen match`);
        console.log(`   ⛔ Fuzzy search mag NIET auto-selecteren → manual_review_required`);
      }
      
      const searchUrl = `https://api.discogs.com/database/search?artist=${encodeURIComponent(analysisData.artist)}&release_title=${encodeURIComponent(analysisData.title)}&type=release&format=${encodeURIComponent(formatFilter)}`;
      searchMetadata.total_searches++;
      
      try {
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'MusicScanApp/3.0',
            'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   📊 Results: ${data.results?.length || 0} candidates`);
          
          searchMetadata.strategies_executed.push({
            strategy: 3,
            type: 'artist_title',
            query: `${analysisData.artist} - ${analysisData.title}`,
            results: data.results?.length || 0,
            format_filter: formatFilter,
            auto_select_blocked: hasTechnicalIdentifiers
          });
          
          if (data.results && data.results.length > 0) {
            for (const candidate of data.results.slice(0, 5)) {
              const verification = await verifyCandidate(candidate, analysisData, barcodeDigits, catnoNorm, matrixNorm, matrixTokens, matrixValid);
              
              // HARD GATE: Bij technische identifiers mag fuzzy NIET auto-selecteren
              if (hasTechnicalIdentifiers) {
                console.log(`   ⛔ Candidate ${candidate.id} DISQUALIFIED (technische identifiers niet gematcht)`);
                searchMetadata.verification_level = 'manual_review_required';
                continue;
              }
              
              if (verification.points > bestConfidencePoints) {
                bestConfidencePoints = verification.points;
                bestMatch = candidate;
                bestMatchDetails = verification;
                searchMetadata.matched_on = verification.matched_on;
                searchMetadata.technical_matches = verification.technical_matches;
                searchMetadata.explain = verification.explain;
              }
            }
          }
        }
      } catch (err) {
        console.log(`   ❌ Fetch error: ${err.message}`);
      }
    }
    
    // === FINAL DECISION ===
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 FINAL DECISION`);
    console.log(`${'='.repeat(60)}`);
    
    // HARD GATING RULE 1: Identifier Minimum
    if (bestMatch && hasTechnicalIdentifiers) {
      const hasIdentifierMatch = searchMetadata.technical_matches.barcode || 
                                  searchMetadata.technical_matches.matrix || 
                                  searchMetadata.technical_matches.catno;
      
      if (!hasIdentifierMatch) {
        console.log(`⛔ DISQUALIFIED: Geen match op barcode, matrix of catno`);
        console.log(`   Technische identifiers waren aanwezig maar niet gematcht`);
        bestMatch = null;
        bestConfidencePoints = 0;
        searchMetadata.verification_level = 'DISQUALIFIED';
      }
    }
    
    // HARD GATING RULE 2: Confidence Threshold
    const CONFIDENCE_THRESHOLD = 70; // Uit 155 punten = ~45%
    
    if (bestMatch && bestConfidencePoints < CONFIDENCE_THRESHOLD) {
      console.log(`⛔ BELOW THRESHOLD: Score ${bestConfidencePoints}/${CONFIDENCE_THRESHOLD} required`);
      
      if (hasTechnicalIdentifiers) {
        console.log(`   Technische identifiers aanwezig → NO_MATCH (niet guessen)`);
        searchMetadata.verification_level = 'no_match';
        bestMatch = null;
      } else {
        console.log(`   Geen technische identifiers → manual_review_required`);
        searchMetadata.verification_level = 'manual_review_required';
      }
    }
    
    // Build final result
    if (bestMatch && searchMetadata.verification_level !== 'no_match' && searchMetadata.verification_level !== 'DISQUALIFIED') {
      // Parse artist/title from Discogs
      let parsedArtist = bestMatch.artist;
      let parsedTitle = bestMatch.title;
      
      if (!parsedArtist && parsedTitle && parsedTitle.includes(' - ')) {
        const parts = parsedTitle.split(' - ');
        if (parts.length >= 2) {
          parsedArtist = parts[0].replace(/\s*\(\d+\)\s*$/, '').trim();
          parsedTitle = parts.slice(1).join(' - ').trim();
        }
      }
      
      const finalArtist = parsedArtist || analysisData.artist;
      const finalTitle = parsedTitle || analysisData.title;
      const confidenceNormalized = bestConfidencePoints / 155; // Normalize to 0-1
      
      console.log(`\n✅ MATCH FOUND`);
      console.log(`   Release: ${finalArtist} - ${finalTitle}`);
      console.log(`   Discogs ID: ${bestMatch.id}`);
      console.log(`   Score: ${bestConfidencePoints}/155 (${(confidenceNormalized * 100).toFixed(1)}%)`);
      console.log(`   Verification: ${searchMetadata.verification_level || 'standard'}`);
      console.log(`   Lock Reason: ${searchMetadata.lock_reason || 'N/A'}`);
      console.log(`   Matched On: [${searchMetadata.matched_on.join(', ')}]`);
      
      return {
        discogsId: bestMatch.id,
        discogsUrl: `https://www.discogs.com/release/${bestMatch.id}`,
        artist: finalArtist,
        title: finalTitle,
        label: bestMatch.label?.[0] || analysisData.label,
        catalogNumber: bestMatch.catno || analysisData.catalogNumber,
        year: bestMatch.year || analysisData.year,
        confidence: confidenceNormalized,
        confidencePoints: bestConfidencePoints,
        matrixVerified: searchMetadata.technical_matches.matrix,
        searchMetadata
      };
    }
    
    // NO MATCH
    console.log(`\n❌ NO MATCH`);
    console.log(`   Reason: ${hasTechnicalIdentifiers 
      ? 'Technical identifiers present but no Discogs candidates found' 
      : 'No technical identifiers and fuzzy search failed'}`);
    console.log(`   Action: manual_review_required`);
    
    return {
      discogsId: null,
      discogsUrl: null,
      artist: analysisData.artist,
      title: analysisData.title,
      label: analysisData.label,
      catalogNumber: analysisData.catalogNumber,
      year: analysisData.year,
      confidence: 0,
      confidencePoints: 0,
      matrixVerified: false,
      searchMetadata: {
        ...searchMetadata,
        status: 'no_match',
        reason: hasTechnicalIdentifiers 
          ? 'Technical identifiers present but no Discogs candidates found'
          : 'No match found',
        action: 'manual_review_required'
      }
    };

  } catch (error) {
    console.error('❌ MusicScan Protocol Error:', error);
    
    return {
      discogsId: null,
      discogsUrl: null,
      artist: analysisData.artist,
      title: analysisData.title,
      label: analysisData.label,
      catalogNumber: analysisData.catalogNumber,
      year: analysisData.year,
      confidence: 0,
      matrixVerified: false,
      searchMetadata: { error: error.message, protocol_version: '3.0' }
    };
  }
}

/**
 * Verify a Discogs candidate against extracted identifiers
 * Returns confidence points and lock conditions
 */
async function verifyCandidate(
  candidate: any, 
  analysisData: any, 
  barcodeDigits: string | null,
  catnoNorm: string | null,
  matrixNorm: string,
  matrixTokens: string[],
  matrixValid: boolean = true  // NEW: Patch A - Matrix Sanity Guard
): Promise<{
  points: number;
  matched_on: string[];
  explain: string[];
  lock_reason: string | null;
  technical_matches: {
    barcode: boolean;
    matrix: boolean;
    catno: boolean;
    label: boolean;
    year: boolean;
    country: boolean;
  };
  releaseDetails: any;
}> {
  const result = {
    points: 0,
    matched_on: [] as string[],
    explain: [] as string[],
    lock_reason: null as string | null,
    technical_matches: {
      barcode: false,
      matrix: false,
      catno: false,
      label: false,
      year: false,
      country: false
    },
    releaseDetails: null as any
  };
  
  try {
    // Fetch full release details
    const releaseResponse = await fetch(`https://api.discogs.com/releases/${candidate.id}`, {
      headers: {
        'User-Agent': 'MusicScanApp/3.0',
        'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
      }
    });
    
    if (!releaseResponse.ok) {
      console.log(`      ⚠️ Could not fetch release ${candidate.id}`);
      return result;
    }
    
    const releaseDetails = await releaseResponse.json();
    result.releaseDetails = releaseDetails;
    
    console.log(`\n   📀 Verifying candidate: ${candidate.title} (ID: ${candidate.id})`);
    
    // === CHECK MATRIX (50 points) - TOKEN SUBSET MATCHING ===
    // PATCH A: Only check matrix if matrixValid is true (sanity guard passed)
    // Matrix match is TRUE if all canonical tokens exist in the Discogs candidate matrix
    if (matrixValid && matrixNorm && matrixTokens.length > 0 && releaseDetails.identifiers) {
      for (const identifier of releaseDetails.identifiers) {
        if (identifier.type === 'Matrix / Runout' && identifier.value) {
          const discogsMatrixRaw = identifier.value.toUpperCase();
          const discogsMatrixAlphaNum = discogsMatrixRaw.replace(/[^A-Z0-9]/g, '');
          const discogsMatrixTokens = discogsMatrixRaw.split(/[\s\-\/]+/).filter(Boolean);
          
          // Strategy 1: Exact string match (after alphanumeric normalization)
          const extractedMatrixAlphaNum = matrixNorm.replace(/[^A-Z0-9]/g, '');
          if (discogsMatrixAlphaNum === extractedMatrixAlphaNum) {
            result.points += 50;
            result.matched_on.push('matrix');
            result.technical_matches.matrix = true;
            result.explain.push(`Matrix '${matrixNorm}' matched exactly`);
            console.log(`      ✅ Matrix exact match: +50 points`);
            break;
          }
          
          // Strategy 2: Token subset match
          // All canonical tokens from OCR must exist in the Discogs matrix tokens
          const significantTokens = matrixTokens.filter(t => t.length >= 3);
          if (significantTokens.length > 0) {
            const allTokensFound = significantTokens.every(token => {
              const tokenAlphaNum = token.replace(/[^A-Z0-9]/g, '');
              // Check if token exists in Discogs matrix (as substring or exact token match)
              return discogsMatrixAlphaNum.includes(tokenAlphaNum) ||
                     discogsMatrixTokens.some(dt => dt.replace(/[^A-Z0-9]/g, '').includes(tokenAlphaNum));
            });
            
            if (allTokensFound) {
              result.points += 50;
              result.matched_on.push('matrix');
              result.technical_matches.matrix = true;
              result.explain.push(`Matrix tokens [${significantTokens.join(', ')}] all found in '${identifier.value}'`);
              console.log(`      ✅ Matrix token subset match: +50 points`);
              console.log(`         OCR tokens: [${significantTokens.join(', ')}]`);
              console.log(`         Discogs matrix: "${identifier.value}"`);
              break;
            }
          }
          
          // Strategy 3: Contains match (either direction)
          if (discogsMatrixAlphaNum.includes(extractedMatrixAlphaNum) || 
              extractedMatrixAlphaNum.includes(discogsMatrixAlphaNum)) {
            result.points += 50;
            result.matched_on.push('matrix');
            result.technical_matches.matrix = true;
            result.explain.push(`Matrix '${matrixNorm}' contained in Discogs matrix`);
            console.log(`      ✅ Matrix contains match: +50 points`);
            break;
          }
        }
      }
      
      if (!result.technical_matches.matrix) {
        console.log(`      ❌ Matrix NOT matched`);
        console.log(`         OCR canonical: "${matrixNorm}"`);
        console.log(`         OCR tokens: [${matrixTokens.join(', ')}]`);
      }
    } else if (!matrixValid && matrixNorm) {
      // Matrix was detected but failed sanity guard (barcode-like pattern)
      console.log(`      ⛔ Matrix SKIPPED (sanity guard: detected as barcode-like)`);
      console.log(`         Raw: "${matrixNorm}"`);
    }
    
    // === CHECK BARCODE (40 points) ===
    if (barcodeDigits && releaseDetails.identifiers) {
      for (const identifier of releaseDetails.identifiers) {
        if (identifier.type === 'Barcode' && identifier.value) {
          const discogsBarcode = identifier.value.replace(/[^0-9]/g, '');
          if (discogsBarcode === barcodeDigits) {
            result.points += 40;
            result.matched_on.push('barcode');
            result.technical_matches.barcode = true;
            result.explain.push('Barcode matched exactly');
            console.log(`      ✅ Barcode match: +40 points`);
            break;
          }
        }
      }
    }
    
    // === CHECK CATNO (25 points) ===
    if (catnoNorm && releaseDetails.labels) {
      for (const label of releaseDetails.labels) {
        if (label.catno) {
          const discogsCatno = label.catno.toUpperCase().replace(/\s+/g, ' ').trim();
          if (discogsCatno === catnoNorm || 
              discogsCatno.replace(/[^A-Z0-9]/g, '') === catnoNorm.replace(/[^A-Z0-9]/g, '')) {
            result.points += 25;
            result.matched_on.push('catno');
            result.technical_matches.catno = true;
            result.explain.push('Catalog number matched');
            console.log(`      ✅ Catno match: +25 points`);
            break;
          }
        }
      }
    }
    
    // === CHECK LABEL (15 points) ===
    if (analysisData.label && releaseDetails.labels) {
      const extractedLabel = analysisData.label.toLowerCase();
      for (const label of releaseDetails.labels) {
        if (label.name && label.name.toLowerCase().includes(extractedLabel)) {
          result.points += 15;
          result.matched_on.push('label');
          result.technical_matches.label = true;
          result.explain.push('Label and year consistent');
          console.log(`      ✅ Label match: +15 points`);
          break;
        }
      }
    }
    
    // === CHECK YEAR (10 points) ===
    if (analysisData.year && releaseDetails.year) {
      if (parseInt(analysisData.year) === parseInt(releaseDetails.year)) {
        result.points += 10;
        result.matched_on.push('year');
        result.technical_matches.year = true;
        console.log(`      ✅ Year match: +10 points`);
      }
    }
    
    // === CHECK COUNTRY (10 points) ===
    if (analysisData.country && releaseDetails.country) {
      const extractedCountry = analysisData.country.toLowerCase();
      const discogsCountry = releaseDetails.country.toLowerCase();
      if (extractedCountry === discogsCountry || 
          extractedCountry.includes(discogsCountry) || 
          discogsCountry.includes(extractedCountry)) {
        result.points += 10;
        result.matched_on.push('country');
        result.technical_matches.country = true;
        console.log(`      ✅ Country match: +10 points`);
      }
    }
    
    // === TITLE SIMILARITY (5 points max) ===
    if (analysisData.title && candidate.title) {
      const similarity = calculateTitleSimilarity(analysisData.title, candidate.title);
      if (similarity > 0.7) {
        result.points += 5;
        result.matched_on.push('title');
        console.log(`      ✅ Title similarity (${(similarity * 100).toFixed(0)}%): +5 points`);
      }
    }
    
    console.log(`      📊 Total: ${result.points}/155 points`);
    
    // === LOCK CONDITIONS ===
    // PATCH B: Added Barcode + Catno lock (even without valid matrix)
    if (result.technical_matches.matrix) {
      if (result.technical_matches.barcode) {
        result.lock_reason = 'Matrix + Barcode match';
      } else if (result.technical_matches.catno) {
        result.lock_reason = 'Matrix + Catalog confirmed';
      } else if (result.technical_matches.label && result.technical_matches.year) {
        result.lock_reason = 'Matrix + Label + Year confirmed';
      }
    }
    
    // NEW LOCK RULE: Barcode + Catno = LOCKED (even without valid matrix)
    // Rationale: barcode + catno together are unique enough for CDs
    if (!result.lock_reason && result.technical_matches.barcode && result.technical_matches.catno) {
      result.lock_reason = 'Barcode + Catalog match';
      result.explain.push('Barcode and catalog number both matched (no matrix required)');
      console.log(`      🔒 NEW LOCK: Barcode + Catno = verified`);
    }
    
  } catch (err) {
    console.log(`      ❌ Verification error: ${err.message}`);
  }
  
  return result;
}

/**
 * Calculate title similarity using Levenshtein-like approach
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const t2 = title2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (t1 === t2) return 1.0;
  if (t1.includes(t2) || t2.includes(t1)) return 0.9;
  
  // Simple character overlap
  const chars1 = new Set(t1.split(''));
  const chars2 = new Set(t2.split(''));
  const intersection = [...chars1].filter(c => chars2.has(c)).length;
  const union = new Set([...chars1, ...chars2]).size;
  
  return intersection / union;
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
