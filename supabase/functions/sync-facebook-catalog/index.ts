import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  title: string;
  artist: string | null;
  description: string | null;
  price: number;
  slug: string;
  primary_image: string | null;
  media_type: string;
  categories: string[];
  tags: string[];
}

interface FacebookCatalogItem {
  retailer_id: string;
  name: string;
  description: string;
  availability: string;
  condition: string;
  price: string;
  url: string;
  image_url: string;
  brand: string;
  google_product_category: string;
  product_type: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { forceFullResync = false } = await req.json();
    
    console.log('Starting Facebook Catalog sync...', { forceFullResync });

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabaseClient
      .from('facebook_sync_log')
      .insert({
        status: 'running',
        sync_type: 'manual'
      })
      .select()
      .single();

    if (syncLogError) {
      console.error('Failed to create sync log:', syncLogError);
      throw syncLogError;
    }

    console.log('Created sync log:', syncLog.id);

    // Fetch all active products
    const { data: products, error: productsError } = await supabaseClient
      .from('platform_products')
      .select('id, title, artist, description, price, slug, primary_image, media_type, categories, tags')
      .eq('status', 'active')
      .not('published_at', 'is', null);

    if (productsError) {
      console.error('Failed to fetch products:', productsError);
      throw productsError;
    }

    console.log(`Fetched ${products?.length || 0} products`);

    if (!products || products.length === 0) {
      await supabaseClient
        .from('facebook_sync_log')
        .update({
          status: 'completed',
          sync_completed_at: new Date().toISOString(),
          total_products: 0,
          products_synced: 0
        })
        .eq('id', syncLog.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No products to sync',
          productsProcessed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert products to Facebook Catalog format
    const catalogItems: FacebookCatalogItem[] = products.map((product: Product) => ({
      retailer_id: product.id,
      name: `${product.artist || ''} - ${product.title}`.trim().replace(/^- /, ''),
      description: product.description || `${product.artist || ''} - ${product.title}`,
      availability: 'in stock',
      condition: 'new',
      price: `${(product.price * 100).toFixed(0)} EUR`,
      url: `https://musicscan.app/product/${product.slug}`,
      image_url: product.primary_image || '',
      brand: 'MusicScan',
      google_product_category: getGoogleProductCategory(product),
      product_type: getProductType(product)
    }));

    console.log(`Converted ${catalogItems.length} products to catalog format`);

    // Fetch Facebook credentials from database
    const { data: tokenSecret, error: tokenError } = await supabaseClient
      .from('app_secrets')
      .select('secret_value')
      .eq('secret_key', 'FACEBOOK_PAGE_ACCESS_TOKEN')
      .single();

    if (tokenError || !tokenSecret) {
      console.error('Failed to fetch Facebook token:', tokenError);
      throw new Error('Facebook Page Access Token not configured. Please save your token first.');
    }

    const accessToken = tokenSecret.secret_value;
    const catalogId = Deno.env.get('FACEBOOK_CATALOG_ID'); // Catalog ID can remain in env for now

    if (!accessToken || !catalogId) {
      throw new Error('Facebook credentials not configured');
    }

    console.log('Using Facebook token from database');

    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    // Process in batches of 100 (Facebook's limit)
    const batchSize = 100;
    for (let i = 0; i < catalogItems.length; i += batchSize) {
      const batch = catalogItems.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} items`);

      try {
        const requestData = {
          requests: batch.map(item => ({
            method: 'UPDATE',
            retailer_id: item.retailer_id,
            data: item
          }))
        };

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${catalogId}/batch`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Facebook API error (batch ${i / batchSize + 1}):`, errorText);
          errors.push({
            batch: i / batchSize + 1,
            error: errorText
          });
          failureCount += batch.length;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        const result = await response.json();
        console.log(`Batch ${i / batchSize + 1} result:`, result);
        
        // Count successes and failures from response
        if (result.data) {
          const batchSuccesses = result.data.filter((r: any) => r.success !== false).length;
          const batchFailures = result.data.filter((r: any) => r.success === false).length;
          
          successCount += batchSuccesses;
          failureCount += batchFailures;
          
          if (batchFailures > 0) {
            errors.push({
              batch: i / batchSize + 1,
              failures: result.data.filter((r: any) => r.success === false)
            });
          }
        } else {
          successCount += batch.length;
        }

        // Rate limiting: wait between batches
        if (i + batchSize < catalogItems.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
        errors.push({
          batch: i / batchSize + 1,
          error: error.message
        });
        failureCount += batch.length;
      }
    }

    // Update sync log with final results
    const finalStatus = failureCount === 0 ? 'completed' : (successCount > 0 ? 'partial' : 'failed');
    
    await supabaseClient
      .from('facebook_sync_log')
      .update({
        status: finalStatus,
        sync_completed_at: new Date().toISOString(),
        total_products: products.length,
        products_synced: successCount,
        products_failed: failureCount,
        error_details: errors.length > 0 ? errors : null
      })
      .eq('id', syncLog.id);

    console.log('Sync completed:', {
      total: products.length,
      success: successCount,
      failed: failureCount,
      status: finalStatus
    });

    return new Response(
      JSON.stringify({
        success: true,
        syncId: syncLog.id,
        totalProducts: products.length,
        productsSync: successCount,
        productsFailed: failureCount,
        status: finalStatus,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing to Facebook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getGoogleProductCategory(product: Product): string {
  const categories = product.categories || [];
  const tags = product.tags || [];
  const mediaType = product.media_type;

  if (mediaType === 'vinyl' || categories.includes('vinyl')) {
    return '54'; // Media > Music & Sound Recordings
  }
  if (mediaType === 'cd' || categories.includes('cd')) {
    return '54';
  }
  if (categories.includes('ART') || tags.includes('poster') || tags.includes('canvas')) {
    return '500044'; // Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Posters, Prints & Visual Artwork
  }
  if (mediaType === 'merchandise' || tags.includes('tshirts') || tags.includes('shirts')) {
    return '212'; // Apparel & Accessories > Clothing
  }
  if (tags.includes('socks') || tags.includes('sokken')) {
    return '204'; // Apparel & Accessories > Clothing Accessories > Hosiery & Socks
  }
  if (tags.includes('buttons') || tags.includes('badges')) {
    return '167'; // Apparel & Accessories > Jewelry > Fashion Jewelry
  }

  return '632'; // Media > Music & Sound Recordings (default)
}

function getProductType(product: Product): string {
  const tags = product.tags || [];
  const categories = product.categories || [];

  if (tags.includes('poster')) return 'Music Poster';
  if (tags.includes('canvas')) return 'Canvas Art';
  if (tags.includes('metal-print')) return 'Metal Print';
  if (tags.includes('tshirts')) return 'Music T-Shirt';
  if (tags.includes('socks')) return 'Music Socks';
  if (tags.includes('buttons')) return 'Music Button';
  if (categories.includes('vinyl')) return 'Vinyl Record';
  if (categories.includes('cd')) return 'CD';

  return 'Music Merchandise';
}
