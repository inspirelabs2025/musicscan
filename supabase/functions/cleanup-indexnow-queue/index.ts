import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧹 Starting IndexNow queue cleanup');

    // Step 1: Delete all processed items
    const { data: deletedProcessed, error: deleteProcessedError } = await supabase
      .from('indexnow_queue')
      .delete()
      .eq('processed', true);

    if (deleteProcessedError) {
      console.error('Error deleting processed items:', deleteProcessedError);
    } else {
      console.log('✅ Deleted processed items');
    }

    // Step 2: Delete invalid URLs (relative paths, wrong domains)
    const { data: allUrls, error: fetchError } = await supabase
      .from('indexnow_queue')
      .select('id, url');

    if (fetchError) throw fetchError;

    const invalidIds = allUrls
      ?.filter(item => 
        !item.url.startsWith('https://www.musicscan.app/') ||
        item.url.includes('vinylvault.app')
      )
      .map(item => item.id) || [];

    if (invalidIds.length > 0) {
      const { error: deleteInvalidError } = await supabase
        .from('indexnow_queue')
        .delete()
        .in('id', invalidIds);

      if (deleteInvalidError) {
        console.error('Error deleting invalid URLs:', deleteInvalidError);
      } else {
        console.log(`✅ Deleted ${invalidIds.length} invalid URLs`);
      }
    }

    // Step 3: Get all published blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('is_published', true);

    if (blogError) throw blogError;

    console.log(`📝 Found ${blogPosts?.length || 0} published blog posts`);

    // Step 4: Add them to queue (on conflict do nothing)
    const urlsToAdd = blogPosts?.map(post => ({
      url: `https://www.musicscan.app/plaat-verhaal/${post.slug}`,
      content_type: 'blog_post',
      processed: false,
    })) || [];

    if (urlsToAdd.length > 0) {
      const { error: insertError } = await supabase
        .from('indexnow_queue')
        .upsert(urlsToAdd, {
          onConflict: 'url',
          ignoreDuplicates: true,
        });

      if (insertError) {
        console.error('Error adding blog posts:', insertError);
      } else {
        console.log(`✅ Added/updated ${urlsToAdd.length} blog post URLs`);
      }
    }

    // Step 5: Get final stats
    const { count: totalCount } = await supabase
      .from('indexnow_queue')
      .select('*', { count: 'exact', head: true });

    const { count: pendingCount } = await supabase
      .from('indexnow_queue')
      .select('*', { count: 'exact', head: true })
      .eq('processed', false);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalInQueue: totalCount || 0,
          pendingProcessing: pendingCount || 0,
          blogPostsAdded: urlsToAdd.length,
          invalidUrlsRemoved: invalidIds.length,
        },
        message: 'IndexNow queue cleaned up successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in cleanup-indexnow-queue:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
