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
    console.log('🔧 Starting bulk media_type fix for metal print products...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, count how many products need updating
    const { count: beforeCount } = await supabase
      .from('platform_products')
      .select('id', { count: 'exact', head: true })
      .eq('media_type', 'merchandise')
      .or('metaalprint.cs.{categories},album-art.cs.{categories},metal-print.cs.{tags}');

    console.log(`📊 Found ${beforeCount} products to update`);

    // Update all merchandise products that are actually metal prints to 'art'
    const { data: updatedProducts, error: updateError } = await supabase
      .from('platform_products')
      .update({ 
        media_type: 'art',
        updated_at: new Date().toISOString()
      })
      .eq('media_type', 'merchandise')
      .or('metaalprint.cs.{categories},album-art.cs.{categories},metal-print.cs.{tags}')
      .select('id, title');

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      throw updateError;
    }

    console.log(`✅ Successfully updated ${updatedProducts?.length || 0} products to media_type='art'`);

    // Verify the update
    const { count: afterCount } = await supabase
      .from('platform_products')
      .select('id', { count: 'exact', head: true })
      .eq('media_type', 'art')
      .or('metaalprint.cs.{categories},album-art.cs.{categories},metal-print.cs.{tags}');

    return new Response(
      JSON.stringify({ 
        success: true,
        updated_count: updatedProducts?.length || 0,
        before_count: beforeCount,
        after_count: afterCount,
        message: `Successfully updated ${updatedProducts?.length || 0} metal print products to 'art' media type`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in bulk-fix-art-media-type:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to update media_type for metal prints'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
