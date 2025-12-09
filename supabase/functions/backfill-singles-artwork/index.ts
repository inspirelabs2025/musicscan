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

    // Parse request body for options
    const { refetch_all = false, batch_size = 10 } = await req.json().catch(() => ({}));
    
    const mode = refetch_all ? '🔄 REFETCH ALL' : '🎨 MISSING ONLY';
    console.log(`${mode} - Starting singles artwork backfill (batch size: ${batch_size})...`);

    // Get singles based on mode - limit to batch_size to prevent timeout
    let query = supabase
      .from('music_stories')
      .select('id, artist, single_name, slug, artwork_url, yaml_frontmatter')
      .not('single_name', 'is', null);
    
    if (!refetch_all) {
      query = query.is('artwork_url', null);
    }
    
    const { data: singles, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(batch_size);

    if (fetchError) {
      throw new Error(`Failed to fetch singles: ${fetchError.message}`);
    }

    // Also get total count for reporting
    const { count: totalMissing } = await supabase
      .from('music_stories')
      .select('*', { count: 'exact', head: true })
      .not('single_name', 'is', null)
      .is('artwork_url', null);

    if (!singles || singles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No singles found to process',
        processed: 0,
        updated: 0,
        failed: 0,
        remaining: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📊 Processing batch of ${singles.length} singles (${totalMissing || 0} total missing artwork)`);

    let updated = 0;
    let failed = 0;

    for (const single of singles) {
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
            console.log(`✅ Added artwork for: ${single.artist} - ${single.single_name}`);
          } else {
            console.log(`⚠️ No artwork found for: ${single.artist} - ${single.single_name}`);
          }
        } else {
          failed++;
          console.error(`❌ Failed to fetch artwork for: ${single.artist} - ${single.single_name}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        failed++;
        console.error(`❌ Error processing ${single.artist} - ${single.single_name}:`, error);
      }
    }

    const remaining = (totalMissing || 0) - updated;
    console.log(`✅ Batch complete: ${updated} updated, ${failed} failed, ${remaining} remaining`);

    return new Response(JSON.stringify({
      success: true,
      message: `Batch processed: ${updated} updated`,
      batch_size: singles.length,
      updated,
      failed,
      remaining: Math.max(0, remaining),
      has_more: remaining > 0
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
