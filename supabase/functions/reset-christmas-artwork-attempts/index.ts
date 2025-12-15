import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reset artwork_fetch_attempted for failed Christmas stories so they can be retried
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Reset artwork_fetch_attempted for Christmas stories that failed
    const { data, error } = await supabase
      .from('music_stories')
      .update({ artwork_fetch_attempted: false })
      .filter('yaml_frontmatter->>is_christmas', 'eq', 'true')
      .is('artwork_url', null)
      .eq('artwork_fetch_attempted', true)
      .select('id, artist, single_name');

    if (error) {
      throw new Error(`Update error: ${error.message}`);
    }

    console.log(`🎄 Reset ${data?.length || 0} Christmas stories for artwork retry`);

    return new Response(JSON.stringify({
      success: true,
      reset_count: data?.length || 0,
      items: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Reset error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
