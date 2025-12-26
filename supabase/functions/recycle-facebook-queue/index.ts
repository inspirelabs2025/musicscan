import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueConfig {
  queueTable: string;
  contentTable: string;
  contentIdField: string;
  postedAtField?: string;
  minPending: number;
  batchSize: number;
  priorityField?: string;
  contentFilter?: string;
}

const QUEUE_CONFIGS: QueueConfig[] = [
  {
    queueTable: 'singles_facebook_queue',
    contentTable: 'music_stories',
    contentIdField: 'music_story_id',
    postedAtField: 'facebook_posted_at',
    minPending: 5,
    batchSize: 10,
    contentFilter: "is_published = true AND single_name IS NOT NULL",
  },
  {
    queueTable: 'album_facebook_queue',
    contentTable: 'blog_posts',
    contentIdField: 'blog_post_id',
    postedAtField: 'social_post', // Use social_post field as indicator
    minPending: 5,
    batchSize: 10,
    contentFilter: "is_published = true",
  },
  {
    queueTable: 'music_history_facebook_queue',
    contentTable: 'music_history_events',
    contentIdField: 'event_id',
    postedAtField: 'facebook_posted_at',
    minPending: 3,
    batchSize: 5,
    contentFilter: "is_published = true",
  },
  {
    queueTable: 'youtube_facebook_queue',
    contentTable: 'youtube_music_videos',
    contentIdField: 'video_id',
    postedAtField: 'facebook_posted_at',
    minPending: 3,
    batchSize: 5,
    contentFilter: "is_published = true",
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: any[] = [];

    for (const config of QUEUE_CONFIGS) {
      try {
        console.log(`Processing queue: ${config.queueTable}`);

        // Check current queue size
        const { count: pendingCount, error: countError } = await supabase
          .from(config.queueTable)
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (countError) {
          console.error(`Error checking ${config.queueTable}:`, countError);
          continue;
        }

        console.log(`${config.queueTable} has ${pendingCount} pending items`);

        // Skip if queue has enough items
        if (pendingCount && pendingCount >= config.minPending) {
          results.push({
            queue: config.queueTable,
            action: 'skipped',
            reason: `Already has ${pendingCount} pending items`,
            added: 0,
          });
          continue;
        }

        // Get content that has never been posted
        let query = supabase
          .from(config.contentTable)
          .select('id')
          .is(config.postedAtField || 'facebook_posted_at', null);

        // Apply content filter if specified
        // Note: For complex filters, we'll handle them separately

        const { data: neverPosted, error: neverPostedError } = await query.limit(config.batchSize);

        if (neverPostedError) {
          console.error(`Error fetching unposted content from ${config.contentTable}:`, neverPostedError);
          continue;
        }

        let contentToQueue = neverPosted || [];
        console.log(`Found ${contentToQueue.length} never-posted items in ${config.contentTable}`);

        // If not enough never-posted content, get oldest posted content (>30 days ago)
        if (contentToQueue.length < config.batchSize) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: oldPosted, error: oldPostedError } = await supabase
            .from(config.contentTable)
            .select('id')
            .lt(config.postedAtField || 'facebook_posted_at', thirtyDaysAgo.toISOString())
            .order(config.postedAtField || 'facebook_posted_at', { ascending: true })
            .limit(config.batchSize - contentToQueue.length);

          if (!oldPostedError && oldPosted) {
            console.log(`Found ${oldPosted.length} old-posted items to recycle`);
            contentToQueue = [...contentToQueue, ...oldPosted];
          }
        }

        if (contentToQueue.length === 0) {
          results.push({
            queue: config.queueTable,
            action: 'no_content',
            reason: 'No content available to queue',
            added: 0,
          });
          continue;
        }

        // Add content to queue
        let addedCount = 0;
        for (const content of contentToQueue) {
          // Check if already in queue
          const { count: existsCount } = await supabase
            .from(config.queueTable)
            .select('*', { count: 'exact', head: true })
            .eq(config.contentIdField, content.id)
            .in('status', ['pending', 'processing']);

          if (existsCount && existsCount > 0) {
            console.log(`Content ${content.id} already in queue ${config.queueTable}`);
            continue;
          }

          // Schedule for next available slot
          const scheduledFor = new Date();
          scheduledFor.setMinutes(scheduledFor.getMinutes() + (addedCount * 30)); // 30 min intervals

          // Build insert data based on queue type
          let insertData: any = {
            [config.contentIdField]: content.id,
            status: 'pending',
            scheduled_for: scheduledFor.toISOString(),
            priority: 5, // Lower priority than fresh content
          };

          // For album_facebook_queue, we need to fetch blog post details
          if (config.queueTable === 'album_facebook_queue') {
            const { data: blogPost } = await supabase
              .from('blog_posts')
              .select('slug, album_cover_url, yaml_frontmatter')
              .eq('id', content.id)
              .maybeSingle();

            if (blogPost) {
              const frontmatter = blogPost.yaml_frontmatter as any;
              insertData = {
                ...insertData,
                artist: frontmatter?.artist || 'Onbekend',
                album_title: frontmatter?.title || 'Onbekend',
                slug: blogPost.slug,
                artwork_url: blogPost.album_cover_url,
              };
            }
          }

          const { error: insertError } = await supabase
            .from(config.queueTable)
            .insert(insertData);

          if (insertError) {
            console.error(`Error adding to ${config.queueTable}:`, insertError);
            continue;
          }

          addedCount++;
          console.log(`Added content ${content.id} to ${config.queueTable}`);
        }

        results.push({
          queue: config.queueTable,
          action: 'recycled',
          added: addedCount,
          from_never_posted: neverPosted?.length || 0,
        });

      } catch (queueError) {
        console.error(`Error processing queue ${config.queueTable}:`, queueError);
        results.push({
          queue: config.queueTable,
          action: 'error',
          error: queueError.message,
        });
      }
    }

    // Also recycle blog posts to a general Facebook queue or log
    try {
      // Check how many blog posts have never been posted
      const { count: unpostedBlogs } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .is('social_post', null);

      results.push({
        queue: 'blog_posts_info',
        unposted_count: unpostedBlogs || 0,
        note: 'Blog posts available for manual Facebook posting',
      });

    } catch (blogError) {
      console.error('Error checking blog posts:', blogError);
    }

    console.log('Recycling complete:', JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Queue recycling complete',
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recycle-facebook-queue:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
