import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🎬 Processing TikTok video queue (server-side GIF)...');

    // Get pending items - process 1 at a time, highest priority first
    const { data: pendingItems, error: fetchError } = await supabase
      .from('tiktok_video_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching pending items:', fetchError);
      throw fetchError;
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('✅ No pending video items to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending items', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${pendingItems.length} pending video items`);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const item of pendingItems) {
      try {
        console.log(`🎥 Processing: ${item.artist} - ${item.title}`);

        if (!item.album_cover_url) {
          throw new Error('No album cover URL available');
        }

        // Update status to processing
        await supabase
          .from('tiktok_video_queue')
          .update({
            status: 'processing',
            attempts: item.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Try GIF generation, fallback to static image if it fails
        let videoUrl: string | null = null;
        let useStaticImage = false;
        
        try {
          console.log(`📹 Generating GIF for ${item.id}...`);
          
          const { data: videoResult, error: videoError } = await supabase.functions.invoke('generate-mp4-video', {
            body: {
              imageUrl: item.album_cover_url,
              queueItemId: item.id,
              durationSeconds: 3,
              fps: 2  // Ultra-low: 6 frames total to stay within CPU limits
            }
          });

          if (videoError || !videoResult?.success) {
            console.warn(`⚠️ GIF generation failed, falling back to static image: ${videoError?.message || videoResult?.error}`);
            useStaticImage = true;
          } else {
            videoUrl = videoResult.video_url;
            console.log(`✅ GIF generated: ${videoUrl} (${videoResult.size_bytes} bytes)`);
          }
        } catch (gifError) {
          console.warn(`⚠️ GIF generation error, falling back to static image:`, gifError);
          useStaticImage = true;
        }

        // Update queue item status to completed (with video or image fallback)
        await supabase
          .from('tiktok_video_queue')
          .update({
            status: 'completed',
            video_url: videoUrl, // Will be null if using static image
            error_message: useStaticImage ? 'Fallback to static image' : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Post to Facebook with GIF or static image - handle both blog posts AND singles
        const imageForFacebook = item.album_cover_url;
        
        if (item.blog_id) {
          // ALBUM BLOG: Update blog post and post to Facebook
          if (videoUrl) {
            await supabase
              .from('blog_posts')
              .update({ tiktok_video_url: videoUrl })
              .eq('id', item.blog_id);
            console.log(`✅ Updated blog post ${item.blog_id} with video URL`);
          }

          const { data: blogData } = await supabase
            .from('blog_posts')
            .select('slug, yaml_frontmatter, markdown_content, album_cover_url')
            .eq('id', item.blog_id)
            .single();

          if (blogData) {
            try {
              const title = blogData.yaml_frontmatter?.title || `${item.artist} - ${item.title}`;
              let summary = blogData.yaml_frontmatter?.description || 
                            blogData.yaml_frontmatter?.summary || 
                            blogData.markdown_content?.substring(0, 280) || '';
              
              summary = summary
                .replace(/^---[\s\S]*?---\n?/m, '')
                .replace(/```[\s\S]*?```/g, '')
                .replace(/\*\*([^*]+)\*\*/g, '$1')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .trim()
                .substring(0, 280);
              
              const blogUrl = `https://www.musicscan.app/plaat-verhaal/${blogData.slug}`;
              
              const mediaType = videoUrl ? 'GIF' : 'static image';
              console.log(`📱 Posting ALBUM to Facebook with ${mediaType}: ${title}`);
              
              await supabase.functions.invoke('post-to-facebook', {
                body: {
                  content_type: 'blog',
                  title: title,
                  content: summary,
                  url: blogUrl,
                  video_url: videoUrl, // Will be null if using static image
                  image_url: blogData.album_cover_url || imageForFacebook,
                  artist: item.artist
                }
              });
              
              console.log(`✅ Facebook post created with ${mediaType} for album: ${title}`);
            } catch (fbError) {
              console.warn(`⚠️ Facebook post failed for album (non-blocking):`, fbError);
            }
          }
        } else if (item.music_story_id) {
          // SINGLE: Update music_story and post to Facebook
          if (videoUrl) {
            await supabase
              .from('music_stories')
              .update({ video_url: videoUrl })
              .eq('id', item.music_story_id);
            console.log(`✅ Updated music_story ${item.music_story_id} with video URL`);
          }

          const { data: storyData } = await supabase
            .from('music_stories')
            .select('slug, title, single_name, artist, artwork_url, markdown_content')
            .eq('id', item.music_story_id)
            .single();

          if (storyData) {
            try {
              const singleTitle = storyData.single_name || storyData.title || item.title;
              const artistName = storyData.artist || item.artist;
              let summary = storyData.markdown_content?.substring(0, 280) || '';
              
              summary = summary
                .replace(/^---[\s\S]*?---\n?/m, '')
                .replace(/```[\s\S]*?```/g, '')
                .replace(/\*\*([^*]+)\*\*/g, '$1')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .trim()
                .substring(0, 280);
              
              const singleUrl = `https://www.musicscan.app/singles/${storyData.slug}`;
              
              const mediaType = videoUrl ? 'GIF' : 'static image';
              console.log(`📱 Posting SINGLE to Facebook with ${mediaType}: ${artistName} - ${singleTitle}`);
              
              await supabase.functions.invoke('post-to-facebook', {
                body: {
                  content_type: 'single',
                  title: `${artistName} - ${singleTitle}`,
                  content: summary,
                  url: singleUrl,
                  video_url: videoUrl, // Will be null if using static image
                  image_url: storyData.artwork_url || imageForFacebook,
                  artist: artistName
                }
              });
              
              console.log(`✅ Facebook post created with ${mediaType} for single: ${artistName} - ${singleTitle}`);
            } catch (fbError) {
              console.warn(`⚠️ Facebook post failed for single (non-blocking):`, fbError);
            }
          }
        }

        successCount++;
        console.log(`✅ Completed: ${item.artist} - ${item.title}`);

      } catch (itemError) {
        console.error(`❌ Error processing item ${item.id}:`, itemError);

        await supabase
          .from('tiktok_video_queue')
          .update({
            status: item.attempts >= 2 ? 'failed' : 'pending',
            error_message: itemError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        failedCount++;
      }

      processedCount++;
    }

    console.log(`📊 Queue processing complete: ${processedCount} processed, ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        succeeded: successCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-tiktok-video-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
