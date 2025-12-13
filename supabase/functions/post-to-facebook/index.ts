import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
import { 
  randomPick, 
  introVariations, 
  ctaVariations, 
  buildSmartHashtags,
  buildChristmasHashtags,
  isChristmasContent,
  getArtistTag, 
  getStudioTag, 
  detectGenre,
  artistFacebookPages,
  profileMention 
} from '../_shared/facebook-content-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostRequest {
  content_type: 'anecdote' | 'news' | 'blog' | 'product' | 'youtube_discovery' | 'test';
  title: string;
  content: string;
  url?: string;
  image_url?: string;
  video_url?: string; // GIF/MP4 video URL - takes priority over image_url
  artist?: string;
  year?: number;
  hashtags?: string[]; // Deprecated - smart hashtags are now always used
  usePage2?: boolean; // Post to Page 2 (MusicScan Dance) instead of Page 1
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

    const { content_type, title, content, url, image_url, video_url, artist, year, usePage2 }: PostRequest = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetPage = usePage2 ? 'Page 2 (MusicScan Dance)' : 'Page 1 (MusicScan)';
    console.log(`📘 Posting to Facebook ${targetPage}: ${content_type} - ${title}`);
    console.log(`🎬 Video URL: ${video_url || 'GEEN VIDEO'}`);
    console.log(`📸 Image URL: ${image_url || 'GEEN AFBEELDING'}`);

    // Determine which credentials to fetch based on usePage2
    const tokenKey = usePage2 ? 'FACEBOOK_PAGE_2_ACCESS_TOKEN' : 'FACEBOOK_PAGE_ACCESS_TOKEN';
    const pageIdKey = usePage2 ? 'FACEBOOK_PAGE_2_ID' : 'FACEBOOK_PAGE_ID';

    // Get Facebook credentials from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', [tokenKey, 'FACEBOOK_APP_SECRET', pageIdKey]);

    if (secretsError || !secrets || secrets.length === 0) {
      console.error('Failed to fetch Facebook credentials:', secretsError);
      throw new Error(`Facebook credentials not configured for ${targetPage}`);
    }

    const credentials: Record<string, string> = {};
    secrets.forEach(s => {
      credentials[s.secret_key] = s.secret_value;
    });

    const pageAccessToken = credentials[tokenKey];
    const appSecret = credentials['FACEBOOK_APP_SECRET'];
    const pageId = credentials[pageIdKey];

    if (!pageAccessToken || !appSecret || !pageId) {
      throw new Error(`Missing Facebook credentials for ${targetPage} (${tokenKey}, APP_SECRET, or ${pageIdKey})`);
    }

    // Generate appsecret_proof for secure API calls
    const appsecretProof = createHmac('sha256', appSecret)
      .update(pageAccessToken)
      .digest('hex');

    // Detect if this is Christmas content
    const isChristmas = isChristmasContent(title, artist, content);
    console.log(`🎄 Christmas content detected: ${isChristmas}`);

    // Format the post content with appropriate intro
    const intro = isChristmas 
      ? randomPick(introVariations.christmas)
      : randomPick(introVariations.generic);
    
    // Use Christmas emoji in title for Christmas content
    const formattedTitle = isChristmas 
      ? `🎄 ${title.replace(/^🎵\s*/, '')}` 
      : title;
    
    let postMessage = `${intro} ${formattedTitle}\n\n`;
    postMessage += content;
    
    // Artiest @tag detecteren in content
    let foundArtistTag = false;
    for (const [artist, page] of Object.entries(artistFacebookPages)) {
      if (content.toLowerCase().includes(artist.toLowerCase()) || 
          title.toLowerCase().includes(artist.toLowerCase())) {
        postMessage += `\n\n🎤 @${page}`;
        foundArtistTag = true;
        break; // Alleen eerste match
      }
    }
    
    // Studio @tag detectie
    const studioTag = getStudioTag(content);
    if (studioTag) {
      postMessage += foundArtistTag ? `\n🎹 ${studioTag}` : `\n\n🎹 ${studioTag}`;
    }
    
    // Use Christmas hashtags for Christmas content, otherwise smart hashtags
    let smartHashtags: string[];
    if (isChristmas) {
      smartHashtags = buildChristmasHashtags({
        artist: artist,
        year: year,
      });
    } else {
      // Genre detectie MET artiest voor betere nauwkeurigheid
      const genre = detectGenre(artist || '', content);
      smartHashtags = buildSmartHashtags({
        artist: artist,
        genre: genre,
        year: year,
        category: content_type === 'anecdote' ? 'story' : 
                  content_type === 'news' ? 'history' : 
                  content_type === 'youtube_discovery' ? 'video' : 'release',
        isVinyl: content.toLowerCase().includes('vinyl') || content.toLowerCase().includes('plaat'),
      });
    }
    
    postMessage += '\n\n' + smartHashtags.join(' ');
    
    // URL met appropriate CTA
    if (url) {
      const cta = isChristmas 
        ? randomPick(ctaVariations.christmas)
        : randomPick(ctaVariations.generic);
      postMessage += `\n\n${cta} ${url}`;
    }
    
    // Profiel link
    postMessage += profileMention;

    // Post to Facebook Page
    const fbApiUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    
    const postBody: Record<string, string> = {
      message: postMessage,
      access_token: pageAccessToken,
      appsecret_proof: appsecretProof,
    };

    // Priority: image_url > text only (video/GIF disabled for now)
    let response;
    let usedMediaType = 'text';
    
    if (image_url) {
      // Post as photo
      const photoApiUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      response = await fetch(photoApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          ...postBody,
          url: image_url,
          caption: postMessage,
        }),
      });
      usedMediaType = 'image';
    } else {
      // Text only post
      response = await fetch(fbApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(postBody),
      });
    }
    
    console.log(`📤 Posted using: ${usedMediaType}`);

    const result = await response.json();

    if (!response.ok) {
      console.error('Facebook API error:', result);
      
      // Log the failed post
      await supabase.from('facebook_post_log').insert({
        content_type,
        title,
        content: postMessage.substring(0, 500),
        status: 'failed',
        error_message: result.error?.message || 'Unknown error',
        facebook_response: result
      });
      
      throw new Error(result.error?.message || 'Failed to post to Facebook');
    }

    console.log(`✅ Successfully posted to Facebook: ${result.id || result.post_id}`);

    // Log successful post
    await supabase.from('facebook_post_log').insert({
      content_type,
      title,
      content: postMessage.substring(0, 500),
      status: 'success',
      facebook_post_id: result.id || result.post_id,
      facebook_response: result
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        post_id: result.id || result.post_id,
        message: 'Successfully posted to Facebook'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error posting to Facebook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
