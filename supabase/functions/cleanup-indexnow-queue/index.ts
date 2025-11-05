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

    // Optional: full clear of entire queue via query param ?full=true
    const urlObj = new URL(req.url);
    let fullClear = urlObj.searchParams.get('full') === 'true' || urlObj.searchParams.get('full') === '1';
    try {
      const body = await req.json();
      if (body && (body.full === true || body.full === 'true' || body.full === 1)) {
        fullClear = true;
      }
    } catch (_) {}
    let fullQueueDeleted = 0;

    if (fullClear) {
      const { data: allItems, error: fetchAllError } = await supabase
        .from('indexnow_queue')
        .select('id');

      if (fetchAllError) {
        console.error('Error fetching all queue items for full clear:', fetchAllError);
      } else if (allItems && allItems.length > 0) {
        const ids = allItems.map((i: any) => i.id);
        const { error: deleteAllError } = await supabase
          .from('indexnow_queue')
          .delete()
          .in('id', ids);

        if (deleteAllError) {
          console.error('Error performing full queue clear:', deleteAllError);
        } else {
          fullQueueDeleted = ids.length;
          console.log(`🧨 Fully cleared queue: deleted ${fullQueueDeleted} items`);
        }
      }
    }

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

    // Step 5: Clean up old submission logs with vinylvault URLs
    const { data: oldSubmissions, error: fetchSubmissionsError } = await supabase
      .from('indexnow_submissions')
      .select('id, urls');

    if (fetchSubmissionsError) {
      console.error('Error fetching submissions:', fetchSubmissionsError);
    }

    const submissionsToDelete = oldSubmissions
      ?.filter(submission => 
        submission.urls.some((url: string) => url.includes('vinylvault.app'))
      )
      .map(submission => submission.id) || [];

    let deletedSubmissions = 0;
    if (submissionsToDelete.length > 0) {
      const { error: deleteSubmissionsError } = await supabase
        .from('indexnow_submissions')
        .delete()
        .in('id', submissionsToDelete);

      if (deleteSubmissionsError) {
        console.error('Error deleting old submissions:', deleteSubmissionsError);
      } else {
        deletedSubmissions = submissionsToDelete.length;
        console.log(`✅ Deleted ${deletedSubmissions} old submission logs with vinylvault URLs`);
      }
    }

    // Step 6: Get final stats
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
          oldSubmissionsDeleted: deletedSubmissions,
          fullQueueDeleted: fullQueueDeleted,
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
