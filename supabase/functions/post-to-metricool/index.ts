import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricoolPostRequest {
  content_type: string;
  title: string;
  content: string;
  media_url?: string;
  target_platforms: string[];
  url?: string;
  artist?: string;
  year?: number;
}

// Platform-specific content formatters
function formatForTikTok(content: string, title: string, artist?: string): string {
  let caption = `🎵 ${title}\n\n${content}`;
  
  // TikTok max ~2200 chars, keep it punchy
  if (caption.length > 1500) {
    caption = caption.substring(0, 1450) + '...';
  }
  
  // Add hashtags
  const hashtags = ['#MusicScan', '#Muziek'];
  if (artist) hashtags.push(`#${artist.replace(/\s+/g, '')}`);
  hashtags.push('#MuziekGeschiedenis', '#FYP');
  
  return `${caption}\n\n${hashtags.slice(0, 5).join(' ')}`;
}

function formatForInstagram(content: string, title: string, artist?: string): string {
  let caption = `🎵 ${title}\n\n${content}`;
  
  // Instagram max 2200 chars
  if (caption.length > 2000) {
    caption = caption.substring(0, 1950) + '...';
  }
  
  // Instagram loves hashtags in comments, but we include some in caption
  const hashtags = ['#MusicScan', '#Muziek', '#MuziekGeschiedenis'];
  if (artist) hashtags.push(`#${artist.replace(/\s+/g, '')}`);
  
  return `${caption}\n\n${hashtags.slice(0, 10).join(' ')}`;
}

function formatForTwitter(content: string, title: string, url?: string): string {
  // Twitter/X max 280 chars
  let tweet = `🎵 ${title}`;
  
  const urlPart = url ? `\n${url}` : '';
  const hashtagPart = '\n#MusicScan #Muziek';
  const availableChars = 280 - tweet.length - urlPart.length - hashtagPart.length - 5;
  
  if (content.length > availableChars) {
    tweet += `\n${content.substring(0, availableChars - 3)}...`;
  } else {
    tweet += `\n${content}`;
  }
  
  return `${tweet}${urlPart}${hashtagPart}`;
}

function formatForLinkedIn(content: string, title: string, url?: string): string {
  // LinkedIn max 3000 chars, more professional tone
  let post = `🎵 ${title}\n\n${content}`;
  
  if (post.length > 2800) {
    post = post.substring(0, 2750) + '...';
  }
  
  if (url) {
    post += `\n\n🔗 ${url}`;
  }
  
  post += '\n\n#MusicScan #MuziekIndustrie #Muziekgeschiedenis';
  
  return post;
}

function formatForBluesky(content: string, title: string): string {
  // Bluesky max 300 chars
  let post = `🎵 ${title}`;
  const availableChars = 280 - post.length;
  
  if (content.length > availableChars) {
    post += `\n${content.substring(0, availableChars - 3)}...`;
  } else {
    post += `\n${content}`;
  }
  
  return post;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const postRequest: MetricoolPostRequest = await req.json();
    console.log('Metricool post request:', JSON.stringify(postRequest, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Metricool credentials from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['METRICOOL_USER_TOKEN', 'METRICOOL_USER_ID', 'METRICOOL_BLOG_ID']);

    if (secretsError || !secrets || secrets.length === 0) {
      console.error('Failed to retrieve Metricool credentials:', secretsError);
      throw new Error('Metricool credentials not configured');
    }

    const credentials: Record<string, string> = {};
    secrets.forEach(s => { credentials[s.secret_key] = s.secret_value; });

    const userToken = credentials['METRICOOL_USER_TOKEN'];
    const userId = credentials['METRICOOL_USER_ID'];
    const blogId = credentials['METRICOOL_BLOG_ID'];

    if (!userToken || !userId || !blogId) {
      throw new Error('Missing Metricool credentials (USER_TOKEN, USER_ID, or BLOG_ID)');
    }

    // Prepare platform-specific content
    const platformContent: Record<string, string> = {};
    for (const platform of postRequest.target_platforms) {
      switch (platform) {
        case 'tiktok':
          platformContent[platform] = formatForTikTok(postRequest.content, postRequest.title, postRequest.artist);
          break;
        case 'instagram':
          platformContent[platform] = formatForInstagram(postRequest.content, postRequest.title, postRequest.artist);
          break;
        case 'twitter':
          platformContent[platform] = formatForTwitter(postRequest.content, postRequest.title, postRequest.url);
          break;
        case 'linkedin':
          platformContent[platform] = formatForLinkedIn(postRequest.content, postRequest.title, postRequest.url);
          break;
        case 'bluesky':
          platformContent[platform] = formatForBluesky(postRequest.content, postRequest.title);
          break;
        default:
          platformContent[platform] = postRequest.content;
      }
    }

    // Build Metricool API request
    // First, if we have media, normalize it
    let normalizedMediaUrl = postRequest.media_url;
    if (postRequest.media_url) {
      try {
        const normalizeResponse = await fetch(
          `https://api.metricool.com/normalize/image/url?userId=${userId}&blogId=${blogId}&userToken=${userToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: postRequest.media_url })
          }
        );
        
        if (normalizeResponse.ok) {
          const normalizeData = await normalizeResponse.json();
          normalizedMediaUrl = normalizeData.url || postRequest.media_url;
          console.log('Media normalized:', normalizedMediaUrl);
        }
      } catch (normalizeError) {
        console.warn('Media normalization failed, using original URL:', normalizeError);
      }
    }

    // Build post data for each platform
    const postResults: Record<string, any> = {};
    let overallSuccess = true;
    let lastError = '';

    for (const platform of postRequest.target_platforms) {
      const platformType = getPlatformType(platform);
      if (!platformType) {
        console.warn(`Unknown platform: ${platform}`);
        continue;
      }

      const postData: any = {
        text: platformContent[platform],
        networks: [platformType],
        date: new Date().toISOString(),
      };

      // Add media if available
      if (normalizedMediaUrl) {
        postData.media = [{ url: normalizedMediaUrl }];
      }

      // TikTok specific options
      if (platform === 'tiktok') {
        postData.tiktokData = {
          privacy: 'PUBLIC_TO_EVERYONE',
          allowComment: true,
          allowDuet: false,
          allowStitch: false
        };
      }

      console.log(`Posting to ${platform}:`, JSON.stringify(postData, null, 2));

      try {
        const response = await fetch(
          `https://api.metricool.com/post?userId=${userId}&blogId=${blogId}&userToken=${userToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
          }
        );

        const responseData = await response.json();
        console.log(`${platform} response:`, JSON.stringify(responseData, null, 2));

        if (response.ok && responseData.success !== false) {
          postResults[platform] = { success: true, data: responseData };
        } else {
          postResults[platform] = { success: false, error: responseData };
          overallSuccess = false;
          lastError = responseData.message || JSON.stringify(responseData);
        }
      } catch (platformError) {
        console.error(`Error posting to ${platform}:`, platformError);
        postResults[platform] = { success: false, error: platformError.message };
        overallSuccess = false;
        lastError = platformError.message;
      }
    }

    // Log the post attempt
    await supabase.from('metricool_post_log').insert({
      content_type: postRequest.content_type,
      title: postRequest.title,
      content: postRequest.content,
      target_platforms: postRequest.target_platforms,
      metricool_response: postResults,
      status: overallSuccess ? 'posted' : 'failed',
      error_message: overallSuccess ? null : lastError,
      posted_at: overallSuccess ? new Date().toISOString() : null
    });

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        results: postResults,
        message: overallSuccess ? 'Posted to all platforms' : `Some platforms failed: ${lastError}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in post-to-metricool:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getPlatformType(platform: string): string | null {
  const platformMap: Record<string, string> = {
    'tiktok': 'TIKTOK',
    'instagram': 'INSTAGRAM',
    'facebook': 'FACEBOOK',
    'twitter': 'TWITTER',
    'linkedin': 'LINKEDIN',
    'bluesky': 'BLUESKY',
    'youtube': 'YOUTUBE',
    'pinterest': 'PINTEREST',
    'threads': 'THREADS'
  };
  return platformMap[platform.toLowerCase()] || null;
}
