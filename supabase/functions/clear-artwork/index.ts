import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting artwork cleanup...');

    // Clear AI scan artwork
    const { error: aiError } = await supabase
      .from('ai_scan_results')
      .update({ artwork_url: null })
      .not('artwork_url', 'is', null);

    if (aiError) {
      console.error('❌ Error clearing AI scans:', aiError);
      throw aiError;
    }

    // Clear CD scan artwork
    const { error: cdError } = await supabase
      .from('cd_scan')
      .update({ front_image: null })
      .not('front_image', 'is', null);

    if (cdError) {
      console.error('❌ Error clearing CD scans:', cdError);
      throw cdError;
    }

    // Clear vinyl scan artwork
    const { error: vinylError } = await supabase
      .from('vinyl2_scan')
      .update({ catalog_image: null })
      .not('catalog_image', 'is', null);

    if (vinylError) {
      console.error('❌ Error clearing vinyl scans:', vinylError);
      throw vinylError;
    }

    // Clear music stories artwork
    const { error: storiesError } = await supabase
      .from('music_stories')
      .update({ artwork_url: null })
      .not('artwork_url', 'is', null);

    if (storiesError) {
      console.error('❌ Error clearing music stories:', storiesError);
      throw storiesError;
    }

    console.log('✅ Artwork cleanup completed');

    // Get final counts
    const { count: aiCount } = await supabase
      .from('ai_scan_results')
      .select('*', { count: 'exact', head: true })
      .is('artwork_url', null);

    const { count: cdCount } = await supabase
      .from('cd_scan')
      .select('*', { count: 'exact', head: true })
      .is('front_image', null);

    const { count: vinylCount } = await supabase
      .from('vinyl2_scan')
      .select('*', { count: 'exact', head: true })
      .is('catalog_image', null);

    const { count: storiesCount } = await supabase
      .from('music_stories')
      .select('*', { count: 'exact', head: true })
      .is('artwork_url', null);

    return new Response(JSON.stringify({
      success: true,
      message: 'All artwork cleared successfully',
      cleared_counts: {
        ai_scans: aiCount,
        cd_scans: cdCount,
        vinyl_scans: vinylCount,
        music_stories: storiesCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in clear-artwork function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
