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
    const { limit = 25 } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const discogsToken = Deno.env.get('DISCOGS_TOKEN')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`🔧 Starting title fix for last ${limit} merchandise products...`);
    
    // Get last N products with their release data
    const { data: products, error: fetchError } = await supabase
      .from('platform_products')
      .select(`
        id,
        title,
        artist,
        slug,
        discogs_id,
        release_id,
        releases:release_id (
          id,
          master_id,
          discogs_id
        )
      `)
      .eq('media_type', 'merchandise')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (fetchError) throw fetchError;
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No products to fix', updated: 0, skipped: 0, errors: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📦 Found ${products.length} products to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    
    for (const product of products) {
      try {
        console.log(`\n🔍 Processing: ${product.title} (ID: ${product.id})`);
        
        // Determine master_id
        let masterId = product.releases?.master_id;
        
        // If no master_id from releases, try optimized-catalog-search
        if (!masterId && product.discogs_id) {
          console.log(`  📡 No master_id in releases, fetching via catalog search...`);
          const searchResponse = await supabase.functions.invoke('optimized-catalog-search', {
            body: { direct_discogs_id: product.discogs_id }
          });
          
          if (searchResponse.data?.results?.[0]) {
            masterId = searchResponse.data.results[0].master_id || searchResponse.data.results[0].original_master_id;
          }
        }
        
        if (!masterId) {
          console.log(`  ⚠️ No master_id found, skipping`);
          skippedCount++;
          continue;
        }
        
        // Fetch master metadata
        console.log(`  🎯 Fetching Master metadata for ID: ${masterId}`);
        const masterResponse = await fetch(`https://api.discogs.com/masters/${masterId}`, {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylVault/1.0'
          }
        });
        
        if (!masterResponse.ok) {
          console.log(`  ❌ Master fetch failed with status ${masterResponse.status}`);
          skippedCount++;
          continue;
        }
        
        const masterData = await masterResponse.json();
        const newArtist = masterData.artists?.map((a: any) => a.name).join(', ') || product.artist;
        const newTitle = masterData.title || product.title;
        
        console.log(`  📝 New naming: "${newArtist}" - "${newTitle}"`);
        
        // Generate new slug using DB function
        const { data: slugData, error: slugError } = await supabase.rpc('generate_product_slug', {
          p_title: newTitle,
          p_artist: newArtist
        });
        
        if (slugError) {
          console.error(`  ❌ Slug generation failed:`, slugError);
          errors.push(`${product.id}: Slug generation failed`);
          continue;
        }
        
        const newSlug = slugData as string;
        const productTitle = `${newArtist} - ${newTitle} [Metaalprint]`;
        const metaTitle = `${newArtist} - ${newTitle} | Vinyl Metal Print | VinylVault`;
        
        // Update product
        const { error: updateError } = await supabase
          .from('platform_products')
          .update({
            title: productTitle,
            artist: newArtist,
            slug: newSlug,
            meta_title: metaTitle,
            long_description: `Een prachtige metalen print van het albumhoes van "${newTitle}" door ${newArtist}. Perfect voor aan de muur.`,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`  ❌ Update failed:`, updateError);
          errors.push(`${product.id}: ${updateError.message}`);
        } else {
          console.log(`  ✅ Updated successfully`);
          updatedCount++;
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing product ${product.id}:`, error);
        errors.push(`${product.id}: ${error.message}`);
      }
    }
    
    const summary = {
      message: `Fixed ${updatedCount} products, skipped ${skippedCount}, ${errors.length} errors`,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errors
    };
    
    console.log(`\n✅ Fix complete:`, summary);
    
    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
