import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Starting album cover backfill process...')
    
    // Get all blog posts without album covers
    const { data: blogPosts, error } = await supabase
      .from('blog_posts')
      .select('id, slug, yaml_frontmatter')
      .is('album_cover_url', null)
      .eq('is_published', true)
    
    if (error) {
      console.error('Error fetching blog posts:', error)
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${blogPosts?.length || 0} blog posts without album covers`)
    
    const results = []
    
    for (const post of blogPosts || []) {
      try {
        const frontmatter = post.yaml_frontmatter
        const artist = frontmatter?.artist || 'Unknown Artist'
        const album = frontmatter?.album || frontmatter?.title || 'Unknown Album'
        
        console.log(`Searching cover for: ${artist} - ${album}`)
        
        // Search for album cover using Perplexity
        const searchQuery = `${artist} ${album} album cover image high resolution`
        
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are a music expert. Find the official album cover image URL for the requested album. Return ONLY the direct image URL, nothing else. If you cannot find a high-quality official album cover, return "NOT_FOUND".'
              },
              {
                role: 'user',
                content: `Find the official album cover image URL for: ${artist} - ${album}`
              }
            ],
            temperature: 0.2,
            max_tokens: 200,
            return_images: false,
            return_related_questions: false,
            search_recency_filter: 'month'
          }),
        })

        let albumCoverUrl = null
        
        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json()
          const coverUrl = perplexityData.choices?.[0]?.message?.content?.trim()
          
          if (coverUrl && coverUrl !== 'NOT_FOUND' && coverUrl.startsWith('http')) {
            albumCoverUrl = coverUrl
            console.log(`Found cover URL: ${albumCoverUrl}`)
          }
        }
        
        // Update the blog post with the album cover URL
        if (albumCoverUrl) {
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ album_cover_url: albumCoverUrl })
            .eq('id', post.id)
          
          if (updateError) {
            console.error(`Error updating blog post ${post.id}:`, updateError)
            results.push({
              id: post.id,
              slug: post.slug,
              success: false,
              error: updateError.message
            })
          } else {
            console.log(`Successfully updated blog post ${post.slug}`)
            results.push({
              id: post.id,
              slug: post.slug,
              success: true,
              album_cover_url: albumCoverUrl
            })
          }
        } else {
          console.log(`No cover found for ${artist} - ${album}`)
          results.push({
            id: post.id,
            slug: post.slug,
            success: false,
            error: 'No album cover found'
          })
        }
        
        // Add small delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Error processing blog post ${post.id}:`, error)
        results.push({
          id: post.id,
          slug: post.slug,
          success: false,
          error: error.message
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    console.log(`Backfill completed: ${successCount} success, ${failCount} failed`)
    
    return new Response(JSON.stringify({
      message: 'Album cover backfill completed',
      total_processed: results.length,
      successful: successCount,
      failed: failCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in album-cover-backfill function:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to complete album cover backfill',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})