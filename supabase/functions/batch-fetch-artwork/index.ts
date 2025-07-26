import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🎨 Starting batch artwork fetch for user:', user_id);

    let totalProcessed = 0;
    let successCount = 0;

    // Fetch CD items without front_image but with discogs_url or artist/title
    const { data: cdItems, error: cdError } = await supabase
      .from('cd_scan')
      .select('id, artist, title, discogs_url, front_image')
      .eq('user_id', user_id)
      .is('front_image', null)
      .or('discogs_url.not.is.null,and(artist.not.is.null,title.not.is.null)')
      .limit(10); // Process in batches

    if (cdError) throw cdError;

    // Process CD items
    for (const item of cdItems || []) {
      if (!item.discogs_url && (!item.artist || !item.title)) continue;

      totalProcessed++;
      console.log(`🔍 Processing CD: ${item.artist} - ${item.title}`);

      try {
        const { data: artworkData, error: artworkError } = await supabase.functions.invoke('fetch-album-artwork', {
          body: {
            discogs_url: item.discogs_url,
            artist: item.artist,
            title: item.title,
            media_type: 'cd',
            item_id: item.id,
          }
        });

        if (!artworkError && artworkData?.success) {
          successCount++;
          console.log(`✅ Found artwork for CD: ${item.artist} - ${item.title}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`❌ Failed to fetch artwork for CD: ${item.artist} - ${item.title}`, error);
      }
    }

    // Fetch Vinyl items without catalog_image but with discogs_url or artist/title
    const { data: vinylItems, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select('id, artist, title, discogs_url, catalog_image')
      .eq('user_id', user_id)
      .is('catalog_image', null)
      .or('discogs_url.not.is.null,and(artist.not.is.null,title.not.is.null)')
      .limit(10); // Process in batches

    if (vinylError) throw vinylError;

    // Process Vinyl items
    for (const item of vinylItems || []) {
      if (!item.discogs_url && (!item.artist || !item.title)) continue;

      totalProcessed++;
      console.log(`🔍 Processing Vinyl: ${item.artist} - ${item.title}`);

      try {
        const { data: artworkData, error: artworkError } = await supabase.functions.invoke('fetch-album-artwork', {
          body: {
            discogs_url: item.discogs_url,
            artist: item.artist,
            title: item.title,
            media_type: 'vinyl',
            item_id: item.id,
          }
        });

        if (!artworkError && artworkData?.success) {
          successCount++;
          console.log(`✅ Found artwork for Vinyl: ${item.artist} - ${item.title}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`❌ Failed to fetch artwork for Vinyl: ${item.artist} - ${item.title}`, error);
      }
    }

    console.log(`🎯 Batch artwork fetch completed: ${successCount}/${totalProcessed} successful`);

    return new Response(JSON.stringify({ 
      success: true,
      total_processed: totalProcessed,
      success_count: successCount,
      message: `Processed ${totalProcessed} items, found artwork for ${successCount}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in batch-fetch-artwork function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});