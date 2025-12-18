import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('🔍 Starting product deduplication...');

    // Find all products with numbered slugs (-1, -2, -3, etc.)
    const { data: duplicateProducts, error: fetchError } = await supabase
      .from('platform_products')
      .select('id, slug, artist, title, created_at, discogs_id')
      .filter('slug', 'like', '%-metaalprint-%')
      .filter('media_type', 'eq', 'art')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    console.log(`📊 Found ${duplicateProducts?.length || 0} potential products to check`);

    // Group products by their base slug (without the number suffix)
    const productGroups: Record<string, typeof duplicateProducts> = {};
    
    for (const product of duplicateProducts || []) {
      // Extract base slug by removing -1, -2, -3, etc. at the end
      const baseSlug = product.slug.replace(/-\d+$/, '');
      
      if (!productGroups[baseSlug]) {
        productGroups[baseSlug] = [];
      }
      productGroups[baseSlug].push(product);
    }

    let deletedCount = 0;
    let keptCount = 0;
    const deletedIds: string[] = [];

    // For each group, keep only the first (oldest) product
    for (const [baseSlug, products] of Object.entries(productGroups)) {
      if (products.length <= 1) {
        // Not actually a duplicate if only numbered version exists
        continue;
      }

      // Sort by created_at ascending (oldest first)
      products.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // Keep the first one (preferably without number suffix, or the oldest)
      const original = products.find(p => !/-\d+$/.test(p.slug)) || products[0];
      keptCount++;

      // Delete all others
      for (const product of products) {
        if (product.id !== original.id) {
          console.log(`🗑️ Deleting duplicate: ${product.slug} (keeping ${original.slug})`);
          
          const { error: deleteError } = await supabase
            .from('platform_products')
            .delete()
            .eq('id', product.id);

          if (deleteError) {
            console.error(`❌ Failed to delete ${product.slug}: ${deleteError.message}`);
          } else {
            deletedCount++;
            deletedIds.push(product.id);
          }
        }
      }
    }

    // Also delete orphaned numbered products where no base exists
    const { data: orphanedProducts, error: orphanError } = await supabase
      .from('platform_products')
      .select('id, slug')
      .filter('media_type', 'eq', 'art')
      .filter('slug', 'like', '%-%-%-%-%-metaalprint-_')
      .order('created_at', { ascending: false });

    if (!orphanError && orphanedProducts) {
      for (const product of orphanedProducts) {
        // Check if base slug exists without number
        const baseSlug = product.slug.replace(/-\d+$/, '');
        
        const { data: baseExists } = await supabase
          .from('platform_products')
          .select('id')
          .eq('slug', baseSlug)
          .maybeSingle();

        // If no base exists, this numbered one becomes the canonical
        // Update its slug to remove the number
        if (!baseExists) {
          console.log(`🔧 Fixing orphaned slug: ${product.slug} -> ${baseSlug}`);
          
          const { error: updateError } = await supabase
            .from('platform_products')
            .update({ slug: baseSlug })
            .eq('id', product.id);

          if (updateError) {
            console.error(`❌ Failed to update slug: ${updateError.message}`);
          }
        }
      }
    }

    // Log summary
    const summary = {
      checked: duplicateProducts?.length || 0,
      duplicateGroups: Object.keys(productGroups).length,
      kept: keptCount,
      deleted: deletedCount,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Deduplication complete:', summary);

    // Log to cronjob execution
    await supabase.from('cronjob_execution_log').insert({
      function_name: 'deduplicate-products',
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      items_processed: deletedCount,
      metadata: summary
    });

    return new Response(
      JSON.stringify({ success: true, ...summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
