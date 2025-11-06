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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting blog processing from import log...');

    // Fetch items where blog_id is null and we have a product_id OR status is completed/skipped
    // Prioritize recent items (last 7 days) to avoid old failed items blocking new ones
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: itemsToProcess, error: fetchError } = await supabase
      .from('discogs_import_log')
      .select('*')
      .is('blog_id', null)
      .or('and(product_id.not.is.null),and(status.in.(completed,skipped))')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false }) // Process newest first
      .limit(10);

    if (fetchError) {
      console.error('Error fetching items:', fetchError);
      throw fetchError;
    }

    if (!itemsToProcess || itemsToProcess.length === 0) {
      console.log('✅ No items to process for blogs');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending items for blog generation',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${itemsToProcess.length} items to process for blogs`);

    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const item of itemsToProcess) {
      try {
        console.log(`\n📝 Processing blog for release ${item.discogs_release_id} (${item.artist} - ${item.title})`);

        // ✅ STRICT VALIDATION: Ensure release ID is valid
        if (!item.discogs_release_id || typeof item.discogs_release_id !== 'number' || item.discogs_release_id <= 0) {
          console.error(`  ❌ Invalid release ID: ${item.discogs_release_id}, skipping`);
          errorCount++;
          errors.push({
            item_id: item.id,
            artist: item.artist,
            title: item.title,
            error: `Invalid release ID: ${item.discogs_release_id} (must be positive integer)`
          });
          
          await supabase
            .from('discogs_import_log')
            .update({
              error_message: `Invalid release ID: ${item.discogs_release_id} (must be positive integer)`,
              retry_count: (item.retry_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          
          continue;
        }

        console.log(`  ✅ Validated Release ID: ${item.discogs_release_id}`);

        let albumId: string | null = null;
        let albumType: 'product' | 'release' = 'product';

        // If we have a product_id, use that
        if (item.product_id) {
          albumId = item.product_id;
          albumType = 'product';
          console.log(`  Using product_id: ${albumId}`);
        } else {
          // Try to find or create a release record
          console.log(`  No product_id, finding/creating release...`);
          
          const { data: releaseData, error: releaseError } = await supabase.functions.invoke(
            'find-or-create-release',
            {
              body: {
                discogs_id: item.discogs_release_id,
                artist: item.artist,
                title: item.title,
                label: item.label,
                catalog_number: item.catalog_number,
                year: item.year,
                format: item.format,
                country: item.country,
                master_id: item.master_id
              }
            }
          );

          if (releaseError) {
            console.error('  ❌ Error creating release:', releaseError);
            throw releaseError;
          }

          albumId = releaseData.release_id;
          albumType = 'release';
          console.log(`  Created/found release: ${albumId}`);
        }

        if (!albumId) {
          console.error('  ❌ No album_id available, skipping');
          continue;
        }

        // Check if blog already exists for this discogs_id
        const { data: existingBlog } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('yaml_frontmatter->>discogs_id', item.discogs_release_id.toString())
          .maybeSingle();

        if (existingBlog) {
          console.log(`  ℹ️ Blog already exists: ${existingBlog.id}`);
          
          // Update import log with existing blog_id
          await supabase
            .from('discogs_import_log')
            .update({ blog_id: existingBlog.id })
            .eq('id', item.id);
          
          successCount++;
          continue;
        }

        // Generate blog via plaat-verhaal-generator
        console.log(`  🎨 Generating blog...`);
        const { data: blogData, error: blogError } = await supabase.functions.invoke(
          'plaat-verhaal-generator',
          {
            body: {
              albumId: albumId,
              albumType: albumType,
              autoPublish: true,
              forceRegenerate: false
            }
          }
        );

        if (blogError) {
          console.error('  ❌ Error generating blog:', blogError);
          throw blogError;
        }

        const blogId = blogData?.blog_post?.id || blogData?.id;
        
        if (!blogId) {
          console.error('  ❌ No blog_id returned from generator');
          throw new Error('No blog_id returned from plaat-verhaal-generator');
        }

        console.log(`  ✅ Blog created: ${blogId}`);

        // Update import log with blog_id
        const { error: updateError } = await supabase
          .from('discogs_import_log')
          .update({ 
            blog_id: blogId,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateError) {
          console.error('  ⚠️ Error updating import log:', updateError);
        }

        // Add to IndexNow queue
        try {
          const blogSlug = blogData?.blog_post?.slug || blogData?.slug;
          if (blogSlug) {
            await supabase
              .from('indexnow_queue')
              .insert({
                url: `/plaat-verhaal/${blogSlug}`,
                content_type: 'blog_post'
              });
            console.log(`  📤 Added to IndexNow queue`);
          }
        } catch (indexError) {
          console.error('  ⚠️ Error adding to IndexNow:', indexError);
        }

        successCount++;

        // Rate limiting: 2 seconds between items
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (itemError: any) {
        console.error(`  ❌ Error processing item ${item.id}:`, itemError);
        errorCount++;
        errors.push({
          item_id: item.id,
          discogs_release_id: item.discogs_release_id,
          error: itemError.message
        });

        // Update error in import log
        const newRetryCount = (item.retry_count || 0) + 1;
        const newStatus = newRetryCount >= (item.max_retries || 3) ? 'failed' : 'pending';
        
        await supabase
          .from('discogs_import_log')
          .update({ 
            error_message: itemError.message,
            retry_count: newRetryCount,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }
    }

    console.log(`\n✅ Blog processing complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: itemsToProcess.length,
        successful: successCount,
        failed: errorCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Fatal error in process-blogs-from-import-log:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
