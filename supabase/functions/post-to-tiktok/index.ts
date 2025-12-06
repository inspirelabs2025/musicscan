import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildSmartHashtags, getArtistTag, detectGenre } from '../_shared/facebook-content-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostRequest {
  content_type: string;
  title: string;
  caption?: string;
  media_url?: string;
  video_url?: string;
  artist?: string;
  year?: number;
  url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const postRequest: PostRequest = await req.json();
    console.log('TikTok post request:', postRequest.content_type, postRequest.title);

    // Get TikTok credentials
    const { data: secrets } = await supabaseClient
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['TIKTOK_ACCESS_TOKEN', 'TIKTOK_OPEN_ID', 'TIKTOK_TOKEN_EXPIRES_AT']);

    const secretsMap = (secrets || []).reduce((acc, s) => {
      acc[s.secret_key] = s.secret_value;
      return acc;
    }, {} as Record<string, string>);

    const accessToken = secretsMap['TIKTOK_ACCESS_TOKEN'];
    const openId = secretsMap['TIKTOK_OPEN_ID'];
    const expiresAt = parseInt(secretsMap['TIKTOK_TOKEN_EXPIRES_AT'] || '0');

    if (!accessToken || !openId) {
      throw new Error('TikTok credentials not configured');
    }

    // Check if token is expired
    if (expiresAt < Date.now()) {
      console.log('Token expired, attempting refresh...');
      // Trigger token refresh
      await supabaseClient.functions.invoke('tiktok-token-refresh');
      
      // Re-fetch the new token
      const { data: newSecrets } = await supabaseClient
        .from('app_secrets')
        .select('secret_key, secret_value')
        .eq('secret_key', 'TIKTOK_ACCESS_TOKEN')
        .single();
      
      if (!newSecrets) {
        throw new Error('Failed to refresh TikTok token');
      }
    }

    // Build caption with hashtags
    const genre = postRequest.artist ? detectGenre(postRequest.artist, postRequest.caption || '') : null;
    const hashtags = buildSmartHashtags({
      artist: postRequest.artist,
      genre,
      year: postRequest.year,
      category: postRequest.content_type === 'music_history' ? 'history' : 
                postRequest.content_type === 'youtube' ? 'video' : 'story',
    });

    // Build the caption
    let caption = postRequest.caption || postRequest.title;
    
    // Add artist tag if available
    if (postRequest.artist) {
      const artistTag = getArtistTag(postRequest.artist);
      if (artistTag) {
        caption = `${artistTag} ${caption}`;
      }
    }
    
    // Add URL if provided
    if (postRequest.url) {
      caption += `\n\n🔗 ${postRequest.url}`;
    }
    
    // Add hashtags
    caption += '\n\n' + hashtags.join(' ');

    // Ensure caption doesn't exceed TikTok's limit (2200 chars)
    if (caption.length > 2200) {
      const hashtagsString = '\n\n' + hashtags.join(' ');
      const maxContentLength = 2200 - hashtagsString.length - 10;
      caption = caption.substring(0, maxContentLength) + '...' + hashtagsString;
    }

    let tiktokPostId: string | null = null;
    let postStatus = 'success';
    let errorMessage: string | null = null;

    // TikTok Photo/Video posting via Content Posting API
    if (postRequest.media_url || postRequest.video_url) {
      const mediaUrl = postRequest.video_url || postRequest.media_url;
      const isVideo = !!postRequest.video_url;

      console.log(`Posting ${isVideo ? 'video' : 'photo'} to TikTok...`);

      // Step 1: Initialize the upload
      const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_info: {
            title: caption.substring(0, 150), // TikTok title limit
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: mediaUrl,
          },
        }),
      });

      const initData = await initResponse.json();
      console.log('TikTok init response:', initData);

      if (initData.error?.code) {
        postStatus = 'failed';
        errorMessage = initData.error?.message || 'Failed to initialize TikTok post';
        console.error('TikTok post failed:', errorMessage);
      } else {
        tiktokPostId = initData.data?.publish_id;
        console.log('TikTok post initiated:', tiktokPostId);
      }
    } else {
      // Text-only posts are not supported by TikTok API
      postStatus = 'skipped';
      errorMessage = 'TikTok requires media content (photo or video)';
      console.log('Skipping TikTok post - no media provided');
    }

    // Log the post attempt
    await supabaseClient
      .from('tiktok_post_log')
      .insert({
        content_type: postRequest.content_type,
        title: postRequest.title,
        caption: caption,
        media_url: postRequest.media_url || postRequest.video_url,
        tiktok_post_id: tiktokPostId,
        status: postStatus,
        error_message: errorMessage,
        response_data: { hashtags },
      });

    if (postStatus === 'failed') {
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        post_id: tiktokPostId,
        status: postStatus,
        caption_length: caption.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in post-to-tiktok:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
