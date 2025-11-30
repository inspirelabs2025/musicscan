import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostRequest {
  content_type: 'anecdote' | 'news' | 'blog' | 'product' | 'youtube_discovery';
  title: string;
  content: string;
  url?: string;
  image_url: string; // Required for Instagram
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

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required for Instagram posts' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📸 Posting to Instagram: ${content_type} - ${title}`);

    // Get Instagram credentials from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['FACEBOOK_PAGE_ACCESS_TOKEN', 'INSTAGRAM_BUSINESS_ACCOUNT_ID']);

    if (secretsError || !secrets || secrets.length === 0) {
      console.error('Failed to fetch Instagram credentials:', secretsError);
      throw new Error('Instagram credentials not configured');
    }

    const credentials: Record<string, string> = {};
    secrets.forEach(s => {
      credentials[s.secret_key] = s.secret_value;
    });

    const accessToken = credentials['FACEBOOK_PAGE_ACCESS_TOKEN'];
    const instagramAccountId = credentials['INSTAGRAM_BUSINESS_ACCOUNT_ID'];

    if (!accessToken || !instagramAccountId) {
      throw new Error('Missing Instagram credentials (PAGE_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID)');
    }

    // Format the caption
    let caption = '';
    
    // Add emoji based on content type
    const emojis: Record<string, string> = {
      anecdote: '🎵',
      news: '📰',
      blog: '📖',
      product: '🛒',
      youtube_discovery: '🎬'
    };
    
    caption += `${emojis[content_type] || '🎶'} ${title}\n\n`;
    
    // Instagram has a 2200 character limit for captions
    const maxContentLength = 1800; // Leave room for hashtags and URL
    if (content.length > maxContentLength) {
      caption += content.substring(0, maxContentLength) + '...';
    } else {
      caption += content;
    }
    
    // Add URL if provided
    if (url) {
      caption += `\n\n🔗 Link in bio of bezoek:\n${url}`;
    }
    
    // Add hashtags
    if (hashtags && hashtags.length > 0) {
      caption += '\n\n' + hashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
    } else {
      // Default hashtags
      caption += '\n\n#MusicScan #MuziekGeschiedenis #Vinyl #Muziek #VinylCollectie #MuziekLiefhebber';
    }

    // Step 1: Create media container
    console.log('📦 Creating Instagram media container...');
    const containerUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media`;
    
    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        image_url: image_url,
        caption: caption,
        access_token: accessToken,
      }),
    });

    const containerResult = await containerResponse.json();

    if (!containerResponse.ok || containerResult.error) {
      console.error('Instagram container creation error:', containerResult);
      
      // Log the failed post
      await supabase.from('instagram_post_log').insert({
        content_type,
        title,
        content: caption.substring(0, 500),
        status: 'failed',
        error_message: containerResult.error?.message || 'Container creation failed',
        instagram_response: containerResult
      });
      
      throw new Error(containerResult.error?.message || 'Failed to create Instagram media container');
    }

    const containerId = containerResult.id;
    console.log(`✅ Container created: ${containerId}`);

    // Step 2: Wait a moment for Instagram to process the image
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Publish the media
    console.log('📤 Publishing Instagram media...');
    const publishUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`;
    
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    const publishResult = await publishResponse.json();

    if (!publishResponse.ok || publishResult.error) {
      console.error('Instagram publish error:', publishResult);
      
      // Log the failed post
      await supabase.from('instagram_post_log').insert({
        content_type,
        title,
        content: caption.substring(0, 500),
        status: 'failed',
        error_message: publishResult.error?.message || 'Publish failed',
        instagram_response: publishResult
      });
      
      throw new Error(publishResult.error?.message || 'Failed to publish Instagram media');
    }

    console.log(`✅ Successfully posted to Instagram: ${publishResult.id}`);

    // Log successful post
    await supabase.from('instagram_post_log').insert({
      content_type,
      title,
      content: caption.substring(0, 500),
      image_url,
      status: 'success',
      instagram_post_id: publishResult.id,
      instagram_response: publishResult
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        post_id: publishResult.id,
        message: 'Successfully posted to Instagram'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error posting to Instagram:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
