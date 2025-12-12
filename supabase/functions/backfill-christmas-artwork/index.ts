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

    // Find Christmas stories without artwork
    const { data: storiesWithoutArtwork, error: fetchError } = await supabase
      .from('music_stories')
      .select('id, artist, single_name, slug')
      .filter('yaml_frontmatter->>is_christmas', 'eq', 'true')
      .is('artwork_url', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    console.log(`🎄 Found ${storiesWithoutArtwork?.length || 0} Christmas stories without artwork`);

    const results = {
      total: storiesWithoutArtwork?.length || 0,
      success: 0,
      failed: 0,
      details: [] as any[]
    };

    for (const story of storiesWithoutArtwork || []) {
      try {
        console.log(`🖼️ Fetching artwork for: ${story.artist} - ${story.single_name}`);
        
        // Call fetch-album-artwork
        const artworkResult = await supabase.functions.invoke('fetch-album-artwork', {
          body: { 
            artist: story.artist, 
            title: story.single_name, 
            storyId: story.id 
          }
        });

        const artworkUrl = artworkResult?.data?.artwork_url;
        
        if (artworkUrl) {
          results.success++;
          results.details.push({ 
            id: story.id, 
            artist: story.artist, 
            single: story.single_name,
            artwork_url: artworkUrl,
            status: 'success' 
          });
          console.log(`✅ Artwork found: ${artworkUrl}`);
        } else {
          results.failed++;
          results.details.push({ 
            id: story.id, 
            artist: story.artist, 
            single: story.single_name,
            status: 'no_artwork_found' 
          });
          console.log(`❌ No artwork found for ${story.artist} - ${story.single_name}`);
        }

        // Rate limiting - 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.failed++;
        results.details.push({ 
          id: story.id, 
          artist: story.artist, 
          single: story.single_name,
          status: 'error',
          error: error.message 
        });
        console.log(`❌ Error for ${story.artist}: ${error.message}`);
      }
    }

    console.log(`🎄 Backfill complete: ${results.success} success, ${results.failed} failed`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
