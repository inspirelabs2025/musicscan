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
    console.log('🔧 Starting bulk media_type and category fix for metal print products...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all products with media_type 'merchandise' or 'art'
    const { data: products, error: fetchError } = await supabase
      .from('platform_products')
      .select('id, title, categories, tags, media_type');

    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Fetched ${products?.length || 0} products to analyze`);

    // Helper function to identify metal prints
    const isMetalPrint = (p: any) => {
      const cats = (p.categories || []).map((c: string) => c.toLowerCase());
      const tags = (p.tags || []).map((t: string) => t.toLowerCase());
      const title = (p.title || '').toLowerCase();
      
      return title.includes('metaalprint') ||
             title.includes('[metaalprint]') ||
             cats.includes('metaalprint') ||
             cats.includes('album-art') ||
             tags.includes('metal-print') ||
             tags.includes('wall-art');
    };

    // Process updates
    const updates: Promise<any>[] = [];
    let updateCount = 0;

    for (const p of products || []) {
      if (!isMetalPrint(p)) continue;

      // Build new categories set with 'metaal album cover'
      const newCatsSet = new Set([...(p.categories || [])]);
      const hadMetaalCategory = newCatsSet.has('metaal album cover');
      newCatsSet.add('metaal album cover');

      const payload: any = {
        categories: Array.from(newCatsSet),
        updated_at: new Date().toISOString()
      };

      // Update media_type if currently merchandise
      if (p.media_type === 'merchandise') {
        payload.media_type = 'art';
      }

      // Only update if something changed
      if (payload.media_type || !hadMetaalCategory) {
        console.log(`🔄 Updating product: ${p.title?.substring(0, 50)}...`);
        updateCount++;
        updates.push(
          supabase
            .from('platform_products')
            .update(payload)
            .eq('id', p.id)
            .select('id, media_type, categories')
            .single()
            .then(({ data, error }) => {
              if (error) throw error;
              return data;
            })
        );
      }
    }

    console.log(`📝 Executing ${updates.length} updates...`);

    // Execute all updates in parallel
    const results = await Promise.allSettled(updates);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Successfully updated ${successful} products`);
    if (failed > 0) {
      console.log(`⚠️ Failed to update ${failed} products`);
    }

    // Verify final state
    const { count: artCount } = await supabase
      .from('platform_products')
      .select('id', { count: 'exact', head: true })
      .eq('media_type', 'art');

    const { count: categoryCount } = await supabase
      .from('platform_products')
      .select('id', { count: 'exact', head: true })
      .contains('categories', ['metaal album cover']);

    return new Response(
      JSON.stringify({ 
        success: true,
        updated_count: successful,
        failed_count: failed,
        final_art_count: artCount,
        metaal_category_count: categoryCount,
        message: `Updated ${successful} products. Art=${artCount}, with 'metaal album cover'=${categoryCount}`
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
