
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    if (!discogsToken) {
      throw new Error('Discogs token not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Starting metadata enrichment...');

    // Get all items with Discogs IDs but missing metadata
    const { data: cdItems, error: cdError } = await supabase
      .from('cd_scan')
      .select('id, discogs_id, artist, title, genre, label, country, format')
      .not('discogs_id', 'is', null)
      .or('genre.is.null,label.is.null,country.is.null');

    if (cdError) throw cdError;

    const { data: vinylItems, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select('id, discogs_id, artist, title, genre, label, country, format')
      .not('discogs_id', 'is', null)
      .or('genre.is.null,label.is.null,country.is.null');

    if (vinylError) throw vinylError;

    const allItems = [
      ...(cdItems || []).map(item => ({ ...item, table: 'cd_scan' })),
      ...(vinylItems || []).map(item => ({ ...item, table: 'vinyl2_scan' }))
    ];

    console.log(`📊 Found ${allItems.length} items to enrich`);

    let enrichedCount = 0;
    const batchSize = 5; // Respectful rate limiting

    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          console.log(`🔍 Enriching: ${item.artist} - ${item.title}`);
          
          const discogsResponse = await fetch(
            `https://api.discogs.com/releases/${item.discogs_id}`,
            {
              headers: {
                'Authorization': `Discogs token=${discogsToken}`,
                'User-Agent': 'VinylCollection/1.0'
              }
            }
          );

          if (!discogsResponse.ok) {
            console.warn(`⚠️ Failed to fetch Discogs data for ID ${item.discogs_id}`);
            continue;
          }

          const discogsData = await discogsResponse.json();
          
          // Extract enriched metadata
          const enrichedData = {
            genre: discogsData.genres?.[0] || item.genre,
            label: discogsData.labels?.[0]?.name || item.label,
            country: discogsData.country || item.country,
            format: discogsData.formats?.[0]?.name || item.format,
            style: discogsData.styles || []
          };

          // Update the appropriate table
          const { error: updateError } = await supabase
            .from(item.table)
            .update(enrichedData)
            .eq('id', item.id);

          if (updateError) {
            console.error(`❌ Failed to update ${item.table} ${item.id}:`, updateError);
          } else {
            enrichedCount++;
            console.log(`✅ Enriched ${item.artist} - ${item.title}`);
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Error enriching item ${item.id}:`, error);
        }
      }
    }

    console.log(`🎉 Enrichment completed: ${enrichedCount} items updated`);

    return new Response(JSON.stringify({
      success: true,
      enrichedCount,
      totalProcessed: allItems.length,
      message: `Successfully enriched ${enrichedCount} out of ${allItems.length} items`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Metadata enrichment error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
