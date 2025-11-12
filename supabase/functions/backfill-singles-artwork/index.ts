import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎨 Starting singles artwork backfill...');

    // Get all singles without artwork or with failed artwork
    const { data: singles, error: fetchError } = await supabase
      .from('music_stories')
      .select('id, artist, single_name, slug, artwork_url, yaml_frontmatter')
      .not('single_name', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch singles: ${fetchError.message}`);
    }

    if (!singles || singles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No singles found to process',
        processed: 0,
        updated: 0,
        failed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter singles that need artwork (no artwork or placeholder)
    const singlesNeedingArtwork = singles.filter(s => 
      !s.artwork_url || 
      s.artwork_url.includes('placeholder') ||
      s.artwork_url.includes('default')
    );

    console.log(`📊 Found ${singles.length} total singles, ${singlesNeedingArtwork.length} need artwork`);

    let updated = 0;
    let failed = 0;

    for (const single of singlesNeedingArtwork) {
      try {
        console.log(`🎵 Processing: ${single.artist} - ${single.single_name}`);

        // Extract discogs_id from yaml_frontmatter if available
        const discogsId = single.yaml_frontmatter?.discogs_id;
        const discogsUrl = discogsId ? `https://www.discogs.com/release/${discogsId}` : null;

        // Call fetch-album-artwork
        const artworkResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-album-artwork`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artist: single.artist,
            title: single.single_name,
            discogs_url: discogsUrl,
            media_type: 'single',
            item_id: single.id,
            item_type: 'music_stories'
          })
        });

        if (artworkResponse.ok) {
          const artworkData = await artworkResponse.json();
          if (artworkData.success && artworkData.artwork_url) {
            updated++;
            console.log(`✅ Updated artwork for: ${single.artist} - ${single.single_name}`);
          } else {
            console.log(`⚠️ No artwork found for: ${single.artist} - ${single.single_name}`);
          }
        } else {
          failed++;
          console.error(`❌ Failed to fetch artwork for: ${single.artist} - ${single.single_name}`);
        }

        // Rate limiting: 1 request per second to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        failed++;
        console.error(`❌ Error processing ${single.artist} - ${single.single_name}:`, error);
      }
    }

    console.log(`✅ Backfill complete: ${updated} updated, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Backfill completed',
      total_singles: singles.length,
      needed_artwork: singlesNeedingArtwork.length,
      processed: singlesNeedingArtwork.length,
      successful: updated,
      failed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Backfill error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
