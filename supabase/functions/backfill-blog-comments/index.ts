import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 10, min_comments = 1, max_comments = 3 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get blog posts without AI-generated comments
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        slug,
        album_id,
        album_type,
        yaml_frontmatter,
        markdown_content,
        is_published
      `)
      .eq('is_published', true)
      .limit(batch_size);

    if (postsError) {
      throw new Error(`Failed to fetch blog posts: ${postsError.message}`);
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No posts to process',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      details: [] as any[]
    };

    console.log(`📝 Processing ${posts.length} blog posts...`);

    for (const post of posts) {
      try {
        // Check if post already has AI comments
        const { data: existingComments } = await supabase
          .from('blog_comments')
          .select('id')
          .eq('blog_post_id', post.id)
          .eq('is_ai_generated', true);

        if (existingComments && existingComments.length > 0) {
          console.log(`⏭️  Post ${post.slug} already has AI comments, skipping`);
          results.details.push({
            slug: post.slug,
            status: 'skipped',
            reason: 'already_has_comments'
          });
          continue;
        }

        // Extract metadata from yaml_frontmatter
        const frontmatter = post.yaml_frontmatter || {};
        const artist = frontmatter.artist || 'Unknown Artist';
        const title = frontmatter.single_name || frontmatter.album_title || frontmatter.title || 'Unknown Title';
        const genre = frontmatter.genre;
        const year = frontmatter.year;

        // Extract excerpt from markdown (first 200 chars)
        let excerpt = post.markdown_content?.substring(0, 200) || '';
        excerpt = excerpt.replace(/[#*_`\[\]]/g, '').trim();

        // Determine number of comments (weighted random)
        const rand = Math.random();
        let numComments;
        if (rand < 0.3) numComments = min_comments; // 30%
        else if (rand < 0.8) numComments = min_comments + 1; // 50%
        else numComments = max_comments; // 20%

        console.log(`🎯 Generating ${numComments} comments for: ${artist} - ${title}`);

        // Call generate-ai-comment function
        const { data: generateResult, error: generateError } = await supabase.functions.invoke(
          'generate-ai-comment',
          {
            body: {
              blog_post_id: post.id,
              artist,
              single_name: frontmatter.single_name,
              album_title: frontmatter.album_title,
              album_type: post.album_type,
              genre,
              year,
              story_excerpt: excerpt,
              num_comments: numComments
            }
          }
        );

        if (generateError || !generateResult?.success) {
          console.error(`Failed to generate comments for ${post.slug}:`, generateError);
          results.failed++;
          results.details.push({
            slug: post.slug,
            status: 'failed',
            error: generateError?.message || 'Unknown error'
          });
          continue;
        }

        results.successful++;
        results.details.push({
          slug: post.slug,
          status: 'success',
          comments_generated: generateResult.comments_generated
        });

        console.log(`✅ Successfully processed post: ${post.slug}`);

        // Small delay between posts to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing post ${post.slug}:`, error);
        results.failed++;
        results.details.push({
          slug: post.slug,
          status: 'failed',
          error: error.message
        });
      }

      results.processed++;
    }

    console.log(`📊 Batch complete: ${results.successful}/${results.processed} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        ...results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in backfill-blog-comments:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});