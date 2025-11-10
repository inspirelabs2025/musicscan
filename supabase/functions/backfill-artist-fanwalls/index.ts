import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting artist fanwall backfill...')

    // Get all unique artists from published photos
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('artist, display_url')
      .eq('status', 'published')
      .not('artist', 'is', null)
      .order('artist')

    if (photosError) {
      throw photosError
    }

    // Group photos by artist
    const artistMap = new Map<string, { count: number; featuredPhoto: string }>()
    
    for (const photo of photos) {
      if (!photo.artist) continue
      
      const existing = artistMap.get(photo.artist) || { count: 0, featuredPhoto: photo.display_url }
      artistMap.set(photo.artist, {
        count: existing.count + 1,
        featuredPhoto: existing.featuredPhoto,
      })
    }

    console.log(`Found ${artistMap.size} unique artists`)

    // Create artist_fanwalls entries
    const results = []
    for (const [artistName, data] of artistMap.entries()) {
      try {
        // Use the find_or_create function
        const { data: artistId, error: createError } = await supabase
          .rpc('find_or_create_artist_fanwall', {
            artist_name_input: artistName,
          })

        if (createError) {
          console.error(`Error creating fanwall for ${artistName}:`, createError)
          results.push({ artist: artistName, status: 'error', error: createError.message })
          continue
        }

        // Update photo count and featured photo
        const { error: updateError } = await supabase
          .from('artist_fanwalls')
          .update({
            photo_count: data.count,
            featured_photo_url: data.featuredPhoto,
          })
          .eq('id', artistId)

        if (updateError) {
          console.error(`Error updating fanwall for ${artistName}:`, updateError)
          results.push({ artist: artistName, status: 'error', error: updateError.message })
        } else {
          console.log(`Created/updated fanwall for ${artistName} with ${data.count} photos`)
          results.push({ artist: artistName, status: 'success', photoCount: data.count })
        }
      } catch (error) {
        console.error(`Error processing ${artistName}:`, error)
        results.push({ artist: artistName, status: 'error', error: error.message })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Backfill complete: ${successCount} artists processed, ${errorCount} errors`,
        totalArtists: artistMap.size,
        successCount,
        errorCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Backfill error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
