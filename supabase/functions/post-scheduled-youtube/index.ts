import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content type emoji mapping
const contentTypeEmojis: Record<string, string> = {
  'interview': '🎤',
  'studio': '🎵',
  'live_session': '🎸',
  'documentary': '🎬',
  'other': '🎥'
};

interface VideoData {
  title: string;
  description?: string;
  channel_name?: string;
  thumbnail_url?: string;
  artist_name?: string;
  content_type?: string;
  quality_score?: number;
  view_count?: number;
  tags?: string[];
}

function formatFacebookPost(videoId: string, video: VideoData): string {
  const emoji = contentTypeEmojis[video.content_type || 'other'] || contentTypeEmojis['other'];
  const contentTypeLabels: Record<string, string> = {
    'interview': 'Interview',
    'studio': 'Studio Sessie',
    'live_session': 'Live Sessie',
    'documentary': 'Documentaire',
    'other': 'Video'
  };
  const typeLabel = contentTypeLabels[video.content_type || 'other'] || 'Video';
  
  let post = `${emoji} ${typeLabel}: ${video.title}\n\n`;
  
  if (video.artist_name) {
    post += `🎵 Artiest: ${video.artist_name}\n`;
  }
  
  if (video.channel_name) {
    post += `📺 Kanaal: ${video.channel_name}\n`;
  }
  
  post += `\n▶️ Bekijk hier: https://www.youtube.com/watch?v=${videoId}\n\n`;
  
  // Add hashtags
  const hashtags = ['#YouTube', '#Muziek', '#MusicScan'];
  
  if (video.artist_name) {
    const artistHashtag = video.artist_name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    if (artistHashtag) {
      hashtags.push(`#${artistHashtag}`);
    }
  }
  
  if (video.content_type) {
    const typeHashtags: Record<string, string> = {
      'interview': '#Interview',
      'studio': '#StudioSession',
      'live_session': '#LiveSession',
      'documentary': '#Documentary'
    };
    if (typeHashtags[video.content_type]) {
      hashtags.push(typeHashtags[video.content_type]);
    }
  }
  
  post += `🎧 ${hashtags.join(' ')}\n\n`;
  post += `👉 Ontdek meer op musicscan.app/youtube-discoveries`;
  
  return post;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🕐 Checking for scheduled YouTube posts...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // Find posts that are due (scheduled_time <= now and status = pending)
    const { data: duePosts, error: fetchError } = await supabase
      .from('youtube_facebook_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now.toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching due posts:', fetchError);
      throw fetchError;
    }

    if (!duePosts || duePosts.length === 0) {
      console.log('✅ No YouTube posts due at this time');
      return new Response(JSON.stringify({
        success: true,
        message: 'No posts due',
        posted: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const post = duePosts[0];
    const videoData = post.video_data as VideoData;

    console.log(`📤 Processing YouTube video post: ${videoData.title?.substring(0, 50)}...`);

    // Format the Facebook post content
    const postContent = formatFacebookPost(post.video_id, videoData);
    console.log('📝 Formatted post content:', postContent.substring(0, 100) + '...');

    // Get Facebook credentials from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['FACEBOOK_PAGE_ACCESS_TOKEN', 'FACEBOOK_APP_SECRET', 'FACEBOOK_PAGE_ID']);

    if (secretsError || !secrets || secrets.length < 3) {
      console.error('Error fetching Facebook credentials:', secretsError);
      throw new Error('Facebook credentials not configured');
    }

    const credentials: Record<string, string> = {};
    secrets.forEach(s => { credentials[s.secret_key] = s.secret_value; });

    const pageAccessToken = credentials['FACEBOOK_PAGE_ACCESS_TOKEN'];
    const appSecret = credentials['FACEBOOK_APP_SECRET'];
    const pageId = credentials['FACEBOOK_PAGE_ID'];

    // Generate app secret proof
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(pageAccessToken));
    const appsecretProof = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    let facebookPostId = null;
    let postError = null;

    // Post to Facebook
    try {
      const thumbnailUrl = videoData.thumbnail_url;
      
      let fbResponse;
      if (thumbnailUrl) {
        // Post with photo (thumbnail)
        console.log('📸 Posting with thumbnail:', thumbnailUrl);
        const photoUrl = `https://graph.facebook.com/v19.0/${pageId}/photos`;
        fbResponse = await fetch(photoUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: thumbnailUrl,
            message: postContent,
            access_token: pageAccessToken,
            appsecret_proof: appsecretProof
          })
        });
      } else {
        // Post text only with link
        console.log('📝 Posting with link');
        const feedUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
        fbResponse = await fetch(feedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: postContent,
            link: `https://www.youtube.com/watch?v=${post.video_id}`,
            access_token: pageAccessToken,
            appsecret_proof: appsecretProof
          })
        });
      }

      const fbResult = await fbResponse.json();
      
      if (fbResult.error) {
        throw new Error(fbResult.error.message || 'Facebook API error');
      }

      facebookPostId = fbResult.id || fbResult.post_id;
      console.log(`✅ Posted to Facebook: ${facebookPostId}`);

    } catch (fbError) {
      console.error('❌ Facebook posting error:', fbError);
      postError = fbError.message;
    }

    // Update queue status
    const { error: updateError } = await supabase
      .from('youtube_facebook_queue')
      .update({
        status: facebookPostId ? 'posted' : 'failed',
        posted_at: facebookPostId ? now.toISOString() : null,
        facebook_post_id: facebookPostId,
        error_message: postError,
        updated_at: now.toISOString()
      })
      .eq('id', post.id);

    if (updateError) {
      console.warn('Warning updating queue status:', updateError);
    }

    // Log to facebook_post_log
    await supabase.from('facebook_post_log').insert({
      content_type: 'youtube_video',
      title: videoData.title,
      content: postContent.substring(0, 500),
      image_url: videoData.thumbnail_url,
      url: `https://www.youtube.com/watch?v=${post.video_id}`,
      status: facebookPostId ? 'posted' : 'failed',
      facebook_post_id: facebookPostId,
      error_message: postError,
      posted_at: facebookPostId ? now.toISOString() : null
    });

    return new Response(JSON.stringify({
      success: !!facebookPostId,
      posted: facebookPostId ? 1 : 0,
      facebook_post_id: facebookPostId,
      video_title: videoData.title,
      error: postError
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error processing scheduled YouTube posts:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
