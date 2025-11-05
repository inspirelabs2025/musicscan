import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlogPost {
  slug: string;
  updated_at: string;
  views_count: number;
  is_published: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Starting auto-submit blogs to IndexNow');

    // Get recently updated blogs (last 7 days) OR top 20 most viewed blogs
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentBlogs, error: recentError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, views_count, is_published')
      .eq('is_published', true)
      .gte('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(30);

    if (recentError) {
      console.error('Error fetching recent blogs:', recentError);
      throw recentError;
    }

    const { data: topBlogs, error: topError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, views_count, is_published')
      .eq('is_published', true)
      .order('views_count', { ascending: false })
      .limit(20);

    if (topError) {
      console.error('Error fetching top blogs:', topError);
      throw topError;
    }

    // Combine and deduplicate
    const allBlogSlugs = new Set<string>();
    const blogsToSubmit: BlogPost[] = [];

    [...(recentBlogs || []), ...(topBlogs || [])].forEach((blog) => {
      if (!allBlogSlugs.has(blog.slug)) {
        allBlogSlugs.add(blog.slug);
        blogsToSubmit.push(blog);
      }
    });

    console.log(`📊 Found ${blogsToSubmit.length} unique blogs to submit`);

    // Add URLs to IndexNow queue
    const urlsToQueue = blogsToSubmit.map((blog) => ({
      url: `https://www.musicscan.app/plaat-verhaal/${blog.slug}`,
      content_type: 'blog_post',
    }));

    // Insert into queue (on conflict do nothing to avoid duplicates)
    const { data: queueData, error: queueError } = await supabase
      .from('indexnow_queue')
      .upsert(
        urlsToQueue.map((item) => ({
          url: item.url,
          content_type: item.content_type,
          processed: false,
        })),
        {
          onConflict: 'url',
          ignoreDuplicates: true,
        }
      );

    if (queueError) {
      console.error('Error adding to queue:', queueError);
      throw queueError;
    }

    console.log(`✅ Added ${blogsToSubmit.length} URLs to IndexNow queue`);

    // Trigger the indexnow-processor to process the queue
    console.log('🔄 Triggering IndexNow processor...');
    
    const { data: processorData, error: processorError } = await supabase.functions.invoke(
      'indexnow-processor',
      {
        body: { batchSize: 50 },
      }
    );

    if (processorError) {
      console.warn('IndexNow processor warning:', processorError);
    } else {
      console.log('✅ IndexNow processor triggered successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        blogsFound: blogsToSubmit.length,
        urlsQueued: blogsToSubmit.length,
        processorTriggered: !processorError,
        message: `Successfully queued ${blogsToSubmit.length} blog URLs for IndexNow submission`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in auto-submit-blogs-indexnow:', error);
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
