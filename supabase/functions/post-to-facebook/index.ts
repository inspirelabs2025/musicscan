import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostRequest {
  content_type: 'anecdote' | 'news' | 'blog' | 'product';
  title: string;
  content: string;
  url?: string;
  image_url?: string;
  hashtags?: string[];
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

    const { content_type, title, content, url, image_url, hashtags }: PostRequest = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📘 Posting to Facebook: ${content_type} - ${title}`);

    // Get Facebook credentials from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['FACEBOOK_PAGE_ACCESS_TOKEN', 'FACEBOOK_APP_SECRET', 'FACEBOOK_PAGE_ID']);

    if (secretsError || !secrets || secrets.length === 0) {
      console.error('Failed to fetch Facebook credentials:', secretsError);
      throw new Error('Facebook credentials not configured');
    }

    const credentials: Record<string, string> = {};
    secrets.forEach(s => {
      credentials[s.secret_key] = s.secret_value;
    });

    const pageAccessToken = credentials['FACEBOOK_PAGE_ACCESS_TOKEN'];
    const appSecret = credentials['FACEBOOK_APP_SECRET'];
    const pageId = credentials['FACEBOOK_PAGE_ID'];

    if (!pageAccessToken || !appSecret || !pageId) {
      throw new Error('Missing Facebook credentials (PAGE_ACCESS_TOKEN, APP_SECRET, or PAGE_ID)');
    }

    // Generate appsecret_proof for secure API calls
    const appsecretProof = createHmac('sha256', appSecret)
      .update(pageAccessToken)
      .digest('hex');

    // Format the post content
    let postMessage = '';
    
    // Add emoji based on content type
    const emojis: Record<string, string> = {
      anecdote: '🎵',
      news: '📰',
      blog: '📖',
      product: '🛒'
    };
    
    postMessage += `${emojis[content_type] || '🎶'} ${title}\n\n`;
    postMessage += content;
    
    // Add hashtags
    if (hashtags && hashtags.length > 0) {
      postMessage += '\n\n' + hashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
    } else {
      // Default hashtags
      postMessage += '\n\n#MusicScan #MuziekGeschiedenis #Vinyl #Muziek';
    }
    
    // Add URL if provided
    if (url) {
      postMessage += `\n\n🔗 Lees meer: ${url}`;
    }

    // Post to Facebook Page
    const fbApiUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    
    const postBody: Record<string, string> = {
      message: postMessage,
      access_token: pageAccessToken,
      appsecret_proof: appsecretProof,
    };

    // If there's an image, post as photo instead
    let response;
    if (image_url) {
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
    } else {
      response = await fetch(fbApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(postBody),
      });
    }

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
