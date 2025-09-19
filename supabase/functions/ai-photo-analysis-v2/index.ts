import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

    // Validate user exists in auth.users table
    try {
      const { data: authUser, error: authCheckError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (authCheckError) {
        console.error('❌ Error checking user in auth table:', authCheckError)
        // Continue anyway, as direct queries to auth.users might not be allowed
      } else if (!authUser) {
        console.warn('⚠️  User not found in auth.users table, but token is valid')
      } else {
        console.log('✅ User exists in auth.users table')
      }
    } catch (authCheckError) {
      console.warn('⚠️  Could not verify user in auth table (this might be normal):', authCheckError)
    }

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
      
      // Merge analysis results
      const combinedData = mergeAnalysisResults(generalAnalysis.data, detailAnalysis.data)
      
      // Update with analysis progress
      await supabase
        .from('ai_scan_results')
        .update({
          analysis_data: { 
            version: 'v2', 
            phase: 'analysis_complete',
            generalAnalysis: generalAnalysis.data,
            detailAnalysis: detailAnalysis.data,
            combined: combinedData
          }
        })
        .eq('id', scanId)

      // Search Discogs with improved strategy
      const discogsResult = await searchDiscogsV2(combinedData)

      // Update record with final results
      await supabase
        .from('ai_scan_results')
        .update({
          discogs_id: discogsResult.discogsId,
          discogs_url: discogsResult.discogsUrl,
          artist: discogsResult.artist,
          title: discogsResult.title,
          label: discogsResult.label,
          catalog_number: discogsResult.catalogNumber,
          year: discogsResult.year,
          confidence_score: discogsResult.confidence,
          analysis_data: {
            version: 'v2',
            phase: 'completed',
            generalAnalysis: generalAnalysis.data,
            detailAnalysis: detailAnalysis.data,
            combined: combinedData,
            discogsSearch: discogsResult.searchMetadata
          },
          ai_description: combinedData.description,
          search_queries: combinedData.searchQueries,
          status: 'completed'
        })
        .eq('id', scanId)

      console.log('✅ AI analysis V2 completed for scan:', scanId)

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
            extracted_details: combinedData.extractedDetails
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

async function analyzePhotosWithOpenAI(photoUrls: string[], mediaType: string, analysisType: 'general' | 'details') {
  try {
    console.log(`🔍 Running ${analysisType} analysis with OpenAI Vision V2...`)

    const mediaTypeLabel = mediaType === 'vinyl' ? 'vinyl record/LP' : 'CD'
    
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
        model: 'gpt-4o', // Reliable vision model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              ...photoUrls.map(url => ({
                type: 'image_url',
                image_url: { 
                  url,
                  detail: 'high' // Higher detail for better text recognition
                }
              }))
            ]
          }
        ],
        max_tokens: 2000, // Increased for more detailed analysis
        temperature: 0.05, // Very low for consistency
        response_format: { type: "json_object" } // Structured JSON output
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const analysis = data.choices[0].message.content

    console.log(`🤖 OpenAI ${analysisType} analysis V2:`, analysis)

    // Parse JSON response
    let parsedAnalysis
    try {
      parsedAnalysis = JSON.parse(analysis)
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError)
      throw new Error('Invalid JSON response from OpenAI')
    }
    
    return {
      success: true,
      data: parsedAnalysis
    }

  } catch (error) {
    console.error(`❌ OpenAI ${analysisType} analysis error:`, error)
    return {
      success: false,
      error: `AI ${analysisType} analysis failed: ${error.message}`
    }
  }
}

function getSystemPrompt(mediaType: string, analysisType: 'general' | 'details'): string {
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
  } else {
    return basePrompt + `Your task is to extract detailed technical information and small text details.

${mediaType === 'vinyl' ? `For VINYL, pay special attention to:
- Matrix numbers (etched in runout groove)
- Stamper codes and pressing marks
- Label variations and catalog numbers
- Any hand-etched markings
- Dead wax inscriptions` : `For CDs, focus on:
- Catalog numbers on disc and case
- Barcode numbers
- Matrix codes on inner ring of disc
- Label logos and publisher information
- Manufacturing codes`}

RESPOND ONLY IN VALID JSON FORMAT with this exact structure:
{
  "matrixNumber": "matrix/runout info or null",
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
}

function getUserPrompt(mediaType: string, analysisType: 'general' | 'details'): string {
  if (analysisType === 'general') {
    return `Analyze these ${mediaType} images and identify the music release. Extract the main information like artist, title, label, and catalog number. Provide multiple search terms that would help find this exact release on Discogs. Assess image quality for text readability.`
  } else {
    return `Examine these ${mediaType} images for detailed technical information. Look for small text, codes, matrix numbers, barcodes, and any markings that might help with precise identification. Extract ALL visible text, even if partially obscured.`
  }
}

function mergeAnalysisResults(generalData: any, detailData: any) {
  return {
    // Primary fields from general analysis
    artist: generalData.artist,
    title: generalData.title,
    label: generalData.label,
    catalogNumber: generalData.catalogNumber,
    year: generalData.year,
    genre: generalData.genre,
    format: generalData.format,
    country: generalData.country,
    
    // Technical details from detail analysis
    matrixNumber: detailData?.matrixNumber,
    barcode: detailData?.barcode,
    extractedText: [...(generalData.searchQueries || []), ...(detailData?.extractedText || [])],
    
    // Combined metadata
    confidence: Math.max(generalData.confidence || 0, 0.1),
    description: generalData.description,
    imageQuality: generalData.imageQuality || 'fair',
    extractedDetails: detailData?.extractedDetails,
    
    // Enhanced search queries
    searchQueries: [
      ...(generalData.searchQueries || []),
      ...(detailData?.alternativeSearchTerms || [])
    ].filter((query, index, array) => array.indexOf(query) === index) // Remove duplicates
  }
}

async function searchDiscogsV2(analysisData: any) {
  try {
    console.log('🔍 Searching Discogs V2 with enhanced strategy...')
    
    const searchStrategies = [
      // Strategy 1: Exact catalog number (highest priority)
      ...(analysisData.catalogNumber ? [analysisData.catalogNumber] : []),
      
      // Strategy 2: Artist + Title combination
      ...(analysisData.artist && analysisData.title ? [`${analysisData.artist} ${analysisData.title}`] : []),
      
      // Strategy 3: Label + Catalog number
      ...(analysisData.label && analysisData.catalogNumber ? [`${analysisData.label} ${analysisData.catalogNumber}`] : []),
      
      // Strategy 4: Barcode (if available)
      ...(analysisData.barcode ? [analysisData.barcode] : []),
      
      // Strategy 5: Matrix number (for vinyl)
      ...(analysisData.matrixNumber ? [analysisData.matrixNumber] : []),
      
      // Strategy 6: Additional search terms
      ...(analysisData.searchQueries || [])
    ]

    let bestMatch = null
    let highestConfidence = 0
    const searchMetadata = {
      strategies: [],
      totalSearches: 0,
      bestStrategy: null
    }

    for (const [index, query] of searchStrategies.entries()) {
      if (!query || query.trim().length < 2) continue
      
      console.log(`🔍 V2 Strategy ${index + 1}: "${query}"`)
      searchMetadata.totalSearches++
      
      const response = await fetch(
        `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release`,
        {
          headers: {
            'User-Agent': 'VinylScanApp/2.0',
            'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        if (data.results && data.results.length > 0) {
          for (const match of data.results.slice(0, 3)) { // Check top 3 results
            const confidence = calculateConfidenceV2(match, analysisData, index)
            
            searchMetadata.strategies.push({
              query,
              strategy: index + 1,
              resultsCount: data.results.length,
              confidence,
              match: match.title
            })
            
            if (confidence > highestConfidence) {
              highestConfidence = confidence
              bestMatch = match
              searchMetadata.bestStrategy = index + 1
            }
          }
        }
      }
      
      // Early exit if we have a very high confidence match
      if (highestConfidence > 0.9) {
        console.log(`🎯 High confidence match found (${highestConfidence}), stopping search`)
        break
      }
    }

    if (bestMatch) {
      return {
        discogsId: bestMatch.id,
        discogsUrl: `https://www.discogs.com/release/${bestMatch.id}`,
        artist: bestMatch.artist || analysisData.artist,
        title: bestMatch.title || analysisData.title,
        label: bestMatch.label?.[0] || analysisData.label,
        catalogNumber: bestMatch.catno || analysisData.catalogNumber,
        year: bestMatch.year || analysisData.year,
        confidence: highestConfidence,
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
      confidence: Math.max(analysisData.confidence * 0.3, 0.1), // Reduced confidence for no match
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
