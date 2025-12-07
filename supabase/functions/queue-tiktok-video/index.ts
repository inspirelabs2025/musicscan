import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueVideoRequest {
  blogId?: string;
  albumCoverUrl: string;
  artist: string;
  title: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: QueueVideoRequest = await req.json();
    const { blogId, albumCoverUrl, artist, title } = body;

    if (!albumCoverUrl || !artist || !title) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: albumCoverUrl, artist, title' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Queueing TikTok video for:', { artist, title, blogId });

    // Check if a video is already queued or completed for this blog
    if (blogId) {
      const { data: existing } = await supabase
        .from('tiktok_video_queue')
        .select('id, status')
        .eq('blog_id', blogId)
        .in('status', ['pending', 'processing', 'completed'])
        .maybeSingle();

      if (existing) {
        console.log('Video already exists in queue for blog:', blogId, 'status:', existing.status);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Video already ${existing.status} for this blog`,
            queueItemId: existing.id,
            alreadyExists: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert into queue
    const { data: queueItem, error: insertError } = await supabase
      .from('tiktok_video_queue')
      .insert({
        blog_id: blogId || null,
        album_cover_url: albumCoverUrl,
        artist,
        title,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert queue item: ${insertError.message}`);
    }

    console.log('Video queued successfully:', queueItem.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video queued for generation',
        queueItemId: queueItem.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error queueing TikTok video:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
