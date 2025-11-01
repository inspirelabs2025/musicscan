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
    const { confirm = false } = await req.json().catch(() => ({ confirm: false }));

    if (!confirm) {
      return new Response(
        JSON.stringify({ error: 'Confirmation required. Send {"confirm": true} in body.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧹 Starting cleanup of ART (metal print) products...');

    // Delete ALL merchandise products with a discogs_id (created by our create-art-product flow)
    const { data: products, error: selectError, count } = await supabase
      .from('platform_products')
      .select('id', { count: 'exact' })
      .eq('media_type', 'merchandise')
      .not('discogs_id', 'is', null);

    if (selectError) {
      console.error('❌ Select error:', selectError);
      throw selectError;
    }

    const ids = (products || []).map((p: any) => p.id);

    if (ids.length === 0) {
      console.log('ℹ️ No ART products found to delete');
      return new Response(
        JSON.stringify({ success: true, deleted: 0, message: 'No ART products matched the cleanup filters.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { error: deleteError } = await supabase
      .from('platform_products')
      .delete()
      .in('id', ids);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      throw deleteError;
    }

    console.log(`✅ Deleted ${ids.length} ART products`);

    return new Response(
      JSON.stringify({ success: true, deleted: ids.length, matched: count ?? ids.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Error clearing ART products:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});