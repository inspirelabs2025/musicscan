import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🎨 Starting artwork backfill for singles...');

    // Query singles without artwork
    const { data: singles, error: queryError } = await supabase
      .from('music_stories')
      .select('id, artist, single_name, artwork_url')
      .not('single_name', 'is', null)
      .is('artwork_url', null);

    if (queryError) throw queryError;

    const totalSingles = singles?.length || 0;
    console.log(`📊 Found ${totalSingles} singles without artwork`);

    if (totalSingles === 0) {
      return new Response(JSON.stringify({
        success: true,
        total_singles: 0,
        successful: 0,
        failed: 0,
        results: [],
        message: 'No singles found without artwork'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    // Process each single
    for (const single of singles || []) {
      console.log(`🔍 Processing: ${single.artist} - ${single.single_name}`);

      try {
        // Call fetch-album-artwork edge function
        const { data: artworkData, error: artworkError } = await supabase.functions.invoke('fetch-album-artwork', {
          body: {
            artist: single.artist,
            title: single.single_name,
            media_type: 'single',
            item_id: single.id,
            item_type: 'music_stories'
          }
        });

        if (!artworkError && artworkData?.success && artworkData?.artwork_url) {
          successful++;
          console.log(`✅ Artwork found: ${artworkData.artwork_url}`);
          results.push({
            id: single.id,
            artist: single.artist,
            single_name: single.single_name,
            status: 'success',
            artwork_url: artworkData.artwork_url
          });
        } else {
          failed++;
          console.log(`❌ No artwork found for: ${single.artist} - ${single.single_name}`);
          results.push({
            id: single.id,
            artist: single.artist,
            single_name: single.single_name,
            status: 'failed',
            error: artworkError?.message || 'No artwork found'
          });
        }

        // Rate limiting: 1 second delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failed++;
        console.error(`❌ Error processing ${single.artist} - ${single.single_name}:`, error);
        results.push({
          id: single.id,
          artist: single.artist,
          single_name: single.single_name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`🎯 Backfill completed: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      total_singles: totalSingles,
      successful,
      failed,
      results,
      message: `Artwork backfill completed: ${successful}/${totalSingles} singles now have artwork`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in backfill-singles-artwork:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
