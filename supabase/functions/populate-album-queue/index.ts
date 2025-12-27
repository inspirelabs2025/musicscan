import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 populate-album-queue function INVOKED at:', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get parameters from request
    const { batch_size = 500, offset = 0 } = await req.json().catch(() => ({}));

    console.log(`📊 Batch size: ${batch_size}, Offset: ${offset}`);

    // Get albums already in queue (with pagination to get all)
    let allExistingIds: string[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: existingIds, error: existingError } = await supabase
        .from('album_facebook_queue')
        .select('blog_post_id')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (existingError) {
        console.error('Error fetching existing IDs:', existingError);
        break;
      }
      
      if (!existingIds || existingIds.length === 0) break;
      
      allExistingIds = [...allExistingIds, ...existingIds.map(e => e.blog_post_id).filter(Boolean)];
      
      if (existingIds.length < pageSize) break;
      page++;
    }
    
    const existingBlogPostIds = new Set(allExistingIds);
    console.log(`📊 Already in queue: ${existingBlogPostIds.size} albums`);

    // Get published album stories not in queue using range
    const { data: blogPosts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, slug, album_cover_url, yaml_frontmatter')
      .eq('is_published', true)
      .in('album_type', ['product', 'release', 'ai', 'vinyl', 'cd'])
      .order('created_at', { ascending: false })
      .range(offset, offset + batch_size + existingBlogPostIds.size);

    if (fetchError) {
      console.error('❌ Error fetching blog posts:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Fetched ${blogPosts?.length || 0} blog posts from offset ${offset}`);

    // Filter out already queued
    const newPosts = (blogPosts || []).filter(p => !existingBlogPostIds.has(p.id)).slice(0, batch_size);
    console.log(`📊 New posts to add (after filter): ${newPosts.length}`);

    if (newPosts.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No new albums to add to queue',
        added: 0,
        total_in_queue: existingBlogPostIds.size
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare queue items
    const queueItems = newPosts.map(post => {
      const frontmatter = post.yaml_frontmatter as any || {};
      return {
        blog_post_id: post.id,
        artist: frontmatter.artist || 'Unknown Artist',
        album_title: frontmatter.title || 'Unknown Album',
        slug: post.slug,
        artwork_url: post.album_cover_url,
        status: 'pending',
        priority: 5,
        created_at: new Date().toISOString()
      };
    });

    // Insert in batches of 100
    let totalAdded = 0;
    for (let i = 0; i < queueItems.length; i += 100) {
      const batch = queueItems.slice(i, i + 100);
      const { error: insertError } = await supabase
        .from('album_facebook_queue')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Error inserting batch ${i / 100 + 1}:`, insertError);
      } else {
        totalAdded += batch.length;
        console.log(`✅ Inserted batch ${i / 100 + 1}: ${batch.length} items`);
      }
    }

    console.log(`✅ Total added to queue: ${totalAdded}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Added ${totalAdded} albums to Facebook queue`,
      added: totalAdded,
      total_in_queue: existingBlogPostIds.size + totalAdded,
      next_offset: offset + batch_size,
      sample: queueItems.slice(0, 5).map(q => `${q.artist} - ${q.album_title}`)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
