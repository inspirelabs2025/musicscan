import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { postToThreads } from '../_shared/threads-poster.ts';

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('💿 Album Facebook queue processor started');

    // Get next item from queue (highest priority first, then oldest)
    const { data: queueItem, error: fetchError } = await supabase
      .from('album_facebook_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!queueItem) {
      console.log('✅ No pending albums in Facebook queue');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending albums'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`💿 Posting album: ${queueItem.artist} - ${queueItem.album_title} (priority: ${queueItem.priority})`);

    // Mark as processing (to prevent double processing)
    await supabase
      .from('album_facebook_queue')
      .update({ status: 'processing' })
      .eq('id', queueItem.id);

    // Get the full blog post content for summary
    const { data: blogPost } = await supabase
      .from('blog_posts')
      .select('markdown_content, album_cover_url, yaml_frontmatter')
      .eq('id', queueItem.blog_post_id)
      .maybeSingle();

    const content = blogPost?.markdown_content || '';
    const artworkUrl = queueItem.artwork_url || blogPost?.album_cover_url;
    const frontmatter = blogPost?.yaml_frontmatter as any;
    const year = frontmatter?.year;
    
    // Create a clean summary (strip markdown)
    const cleanContent = content
      .replace(/^---[\s\S]*?---/m, '') // Remove YAML frontmatter
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    const summary = cleanContent.substring(0, 280).trim() + '...';
    const albumUrl = `https://www.musicscan.app/plaat-verhaal/${queueItem.slug}`;

    console.log(`🖼️ Artwork URL: ${artworkUrl ? 'found' : 'missing'}`);

    // Post to Facebook
    try {
      const fbResponse = await fetch(`${supabaseUrl}/functions/v1/post-to-facebook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: 'blog',
          title: `💿 ${queueItem.artist} - ${queueItem.album_title}`,
          content: summary,
          url: albumUrl,
          image_url: artworkUrl,
          artist: queueItem.artist,
          year: year
        })
      });

      const fbResult = await fbResponse.json();

      if (fbResponse.ok && fbResult.success) {
        // Mark as posted
        await supabase
          .from('album_facebook_queue')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            facebook_post_id: fbResult.post_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', queueItem.id);

        console.log(`✅ Posted to Facebook: ${fbResult.post_id}`);

        // Also post to Threads (non-blocking)
        try {
          const threadsResult = await postToThreads({
            title: `💿 ${queueItem.artist} - ${queueItem.album_title}`,
            content: summary,
            url: albumUrl,
            image_url: artworkUrl,
            artist: queueItem.artist,
            content_type: 'blog'
          });
          
          if (threadsResult.success) {
            console.log(`✅ Posted to Threads: ${threadsResult.post_id}`);
          }
        } catch (threadsError) {
          console.log('🧵 Threads posting skipped or failed:', threadsError.message);
        }

        return new Response(JSON.stringify({
          success: true,
          posted: queueItem.id,
          facebook_post_id: fbResult.post_id,
          artist: queueItem.artist,
          album: queueItem.album_title
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error(fbResult.error || 'Facebook post failed');
      }

    } catch (postError) {
      console.error(`❌ Facebook post error:`, postError);

      // Mark as failed
      await supabase
        .from('album_facebook_queue')
        .update({
          status: 'failed',
          error_message: postError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      throw postError;
    }

  } catch (error) {
    console.error('❌ Album queue processor error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
