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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header to extract user info
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header provided')
    }

    // Extract JWT token and get user info
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    
    if (userError || !user) {
      throw new Error('Invalid authentication token')
    }

    const { photoUrls, mediaType, conditionGrade }: AnalysisRequest = await req.json()

    console.log('🤖 Starting AI photo analysis for:', { 
      photoCount: photoUrls.length, 
      mediaType, 
      conditionGrade,
      userId: user.id
    })

    // Create initial record with user_id
    const { data: scanRecord, error: insertError } = await supabase
      .from('ai_scan_results')
      .insert({
        user_id: user.id,
        photo_urls: photoUrls,
        media_type: mediaType,
        condition_grade: conditionGrade,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create scan record: ${insertError.message}`)
    }

    const scanId = scanRecord.id

    try {
      // Analyze photos with OpenAI Vision
      const analysisResult = await analyzePhotosWithOpenAI(photoUrls, mediaType)
      
      if (!analysisResult.success) {
        await supabase
          .from('ai_scan_results')
          .update({
            status: 'failed',
            error_message: analysisResult.error
          })
          .eq('id', scanId)

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: analysisResult.error,
            scanId 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Search Discogs for matches
      const discogsResult = await searchDiscogs(analysisResult.data)

      // Update record with results
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
          analysis_data: analysisResult.data,
          ai_description: analysisResult.data.description,
          search_queries: analysisResult.data.searchQueries,
          status: 'completed'
        })
        .eq('id', scanId)

      console.log('✅ AI analysis completed for scan:', scanId)

      return new Response(
        JSON.stringify({
          success: true,
          scanId,
          result: {
            discogs_id: discogsResult.discogsId,
            discogs_url: discogsResult.discogsUrl,
            artist: discogsResult.artist,
            title: discogsResult.title,
            label: discogsResult.label,
            catalog_number: discogsResult.catalogNumber,
            year: discogsResult.year,
            confidence_score: discogsResult.confidence,
            ai_description: analysisResult.data.description
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('❌ Error during analysis:', error)
      
      await supabase
        .from('ai_scan_results')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', scanId)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          scanId 
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
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function analyzePhotosWithOpenAI(photoUrls: string[], mediaType: string) {
  try {
    console.log('🔍 Analyzing photos with OpenAI Vision...')

    const mediaTypeLabel = mediaType === 'vinyl' ? 'vinyl record/LP' : 'CD'
    
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
            role: 'system',
            content: `You are an expert in identifying music releases. Analyze the provided photos of a ${mediaTypeLabel} and extract as much information as possible. Focus on:
            
            - Artist name
            - Album/release title  
            - Record label
            - Catalog number
            - Year of release
            - Any visible text or numbers
            - Genre indicators
            - Distinctive visual elements
            
            Provide specific search terms that would help find this release on Discogs. Be very specific and accurate.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze these photos of a ${mediaTypeLabel} and provide detailed information about the release. Extract all visible text, artist name, title, label, catalog numbers, and any other identifying information. Also suggest specific search queries for finding this on Discogs.`
              },
              ...photoUrls.map(url => ({
                type: 'image_url',
                image_url: { url }
              }))
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const analysis = data.choices[0].message.content

    console.log('🤖 OpenAI analysis:', analysis)

    // Extract structured data from the analysis
    const structuredData = extractStructuredData(analysis, mediaType)
    
    return {
      success: true,
      data: {
        description: analysis,
        ...structuredData,
        searchQueries: generateSearchQueries(structuredData)
      }
    }

  } catch (error) {
    console.error('❌ OpenAI analysis error:', error)
    return {
      success: false,
      error: `AI analysis failed: ${error.message}`
    }
  }
}

function extractStructuredData(analysis: string, mediaType: string) {
  // Simple extraction - could be improved with more sophisticated parsing
  const lines = analysis.split('\n')
  const data: any = {
    artist: null,
    title: null,
    label: null,
    catalogNumber: null,
    year: null
  }

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    if (lowerLine.includes('artist') && lowerLine.includes(':')) {
      data.artist = line.split(':')[1]?.trim()
    } else if (lowerLine.includes('album') || lowerLine.includes('title')) {
      if (lowerLine.includes(':')) {
        data.title = line.split(':')[1]?.trim()
      }
    } else if (lowerLine.includes('label') && lowerLine.includes(':')) {
      data.label = line.split(':')[1]?.trim()
    } else if (lowerLine.includes('catalog') && lowerLine.includes(':')) {
      data.catalogNumber = line.split(':')[1]?.trim()
    } else if (lowerLine.includes('year') && lowerLine.includes(':')) {
      const yearMatch = line.match(/(\d{4})/)
      if (yearMatch) {
        data.year = parseInt(yearMatch[1])
      }
    }
  }

  return data
}

function generateSearchQueries(data: any): string[] {
  const queries = []
  
  if (data.artist && data.title) {
    queries.push(`${data.artist} ${data.title}`)
  }
  
  if (data.catalogNumber) {
    queries.push(data.catalogNumber)
  }
  
  if (data.artist) {
    queries.push(data.artist)
  }
  
  if (data.label && data.catalogNumber) {
    queries.push(`${data.label} ${data.catalogNumber}`)
  }

  return queries.filter(q => q && q.trim().length > 0)
}

async function searchDiscogs(analysisData: any) {
  try {
    console.log('🔍 Searching Discogs with analysis data...')
    
    const queries = analysisData.searchQueries || []
    let bestMatch = null
    let highestConfidence = 0

    for (const query of queries) {
      console.log(`🔍 Searching Discogs for: "${query}"`)
      
      const response = await fetch(
        `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release`,
        {
          headers: {
            'User-Agent': 'VinylScanApp/1.0',
            'Authorization': `Discogs token=${Deno.env.get('DISCOGS_TOKEN')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        
        if (data.results && data.results.length > 0) {
          const match = data.results[0]
          const confidence = calculateConfidence(match, analysisData)
          
          if (confidence > highestConfidence) {
            highestConfidence = confidence
            bestMatch = match
          }
        }
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
        confidence: highestConfidence
      }
    }

    // No match found, return analysis data with low confidence
    return {
      discogsId: null,
      discogsUrl: null,
      artist: analysisData.artist,
      title: analysisData.title,
      label: analysisData.label,
      catalogNumber: analysisData.catalogNumber,
      year: analysisData.year,
      confidence: 0.1
    }

  } catch (error) {
    console.error('❌ Discogs search error:', error)
    
    // Return analysis data with low confidence on error
    return {
      discogsId: null,
      discogsUrl: null,
      artist: analysisData.artist,
      title: analysisData.title,
      label: analysisData.label,
      catalogNumber: analysisData.catalogNumber,
      year: analysisData.year,
      confidence: 0.1
    }
  }
}

function calculateConfidence(discogsMatch: any, analysisData: any): number {
  let confidence = 0.3 // Base confidence for finding a match

  // Check artist match
  if (analysisData.artist && discogsMatch.artist) {
    const artistSimilarity = calculateSimilarity(
      analysisData.artist.toLowerCase(),
      discogsMatch.artist.toLowerCase()
    )
    confidence += artistSimilarity * 0.3
  }

  // Check title match
  if (analysisData.title && discogsMatch.title) {
    const titleSimilarity = calculateSimilarity(
      analysisData.title.toLowerCase(),
      discogsMatch.title.toLowerCase()
    )
    confidence += titleSimilarity * 0.3
  }

  // Check catalog number match (high weight)
  if (analysisData.catalogNumber && discogsMatch.catno) {
    const catnoSimilarity = calculateSimilarity(
      analysisData.catalogNumber.toLowerCase(),
      discogsMatch.catno.toLowerCase()
    )
    confidence += catnoSimilarity * 0.2
  }

  return Math.min(confidence, 1.0)
}

function calculateSimilarity(str1: string, str2: string): number {
  // Simple similarity calculation - could be improved with Levenshtein distance
  if (str1 === str2) return 1.0
  if (str1.includes(str2) || str2.includes(str1)) return 0.8
  
  const words1 = str1.split(' ')
  const words2 = str2.split(' ')
  const commonWords = words1.filter(word => words2.includes(word))
  
  return commonWords.length / Math.max(words1.length, words2.length)
}