import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreadsPostRequest {
  content_type: 'anecdote' | 'news' | 'blog' | 'product' | 'youtube_discovery' | 'music_history';
  title: string;
  content: string;
  url?: string;
  image_url?: string;
  artist?: string;
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

    const { content_type, title, content, url, image_url, artist }: ThreadsPostRequest = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🧵 Posting to Threads: ${content_type} - ${title}`);

    // Get Threads credentials from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['THREADS_ACCESS_TOKEN', 'THREADS_USER_ID']);

    if (secretsError || !secrets || secrets.length === 0) {
      console.error('Failed to fetch Threads credentials:', secretsError);
      throw new Error('Threads credentials not configured');
    }

    const credentials: Record<string, string> = {};
    secrets.forEach(s => {
      credentials[s.secret_key] = s.secret_value;
    });

    const accessToken = credentials['THREADS_ACCESS_TOKEN'];
    const userId = credentials['THREADS_USER_ID'];

    if (!accessToken || !userId) {
      throw new Error('Missing Threads credentials (ACCESS_TOKEN or USER_ID)');
    }

    // Build the post message (shorter for Threads - 500 char limit)
    let postMessage = `${title}\n\n`;
    
    // Truncate content for Threads (max ~400 chars to leave room for URL)
    const maxContentLength = url ? 350 : 450;
    if (content.length > maxContentLength) {
      postMessage += content.substring(0, maxContentLength).trim() + '...';
    } else {
      postMessage += content;
    }
    
    // Add URL if provided
    if (url) {
      postMessage += `\n\n🔗 ${url}`;
    }

    // Add hashtags (max 3 for Threads - keep it clean)
    const hashtags = ['#MusicScan'];
    if (artist) {
      const artistTag = artist.replace(/[^a-zA-Z0-9]/g, '');
      if (artistTag.length > 2) {
        hashtags.push(`#${artistTag}`);
      }
    }
    if (content_type === 'music_history') {
      hashtags.push('#MuziekGeschiedenis');
    } else if (content_type === 'youtube_discovery') {
      hashtags.push('#MuziekVideo');
    }
    
    postMessage += '\n\n' + hashtags.slice(0, 3).join(' ');

    // Step 1: Create media container
    const createUrl = `https://graph.threads.net/v1.0/${userId}/threads`;
    
    const createParams: Record<string, string> = {
      text: postMessage,
      access_token: accessToken,
    };

    // Add image if provided (Threads supports single image posts)
    if (image_url) {
      createParams.media_type = 'IMAGE';
      createParams.image_url = image_url;
    } else {
      createParams.media_type = 'TEXT';
    }

    console.log('🧵 Creating Threads media container...');
    
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(createParams),
    });

    const createResult = await createResponse.json();

    if (!createResponse.ok || createResult.error) {
      console.error('Threads create container error:', createResult);
      
      // Log failed post
      await supabase.from('threads_post_log').insert({
        content_type,
        title,
        content: postMessage.substring(0, 500),
        status: 'failed',
        error_message: createResult.error?.message || 'Failed to create container',
        threads_response: createResult
      });
      
      throw new Error(createResult.error?.message || 'Failed to create Threads container');
    }

    const containerId = createResult.id;
    console.log(`🧵 Container created: ${containerId}`);

    // Step 2: Publish the container
    const publishUrl = `https://graph.threads.net/v1.0/${userId}/threads_publish`;
    
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
      console.error('Threads publish error:', publishResult);
      
      await supabase.from('threads_post_log').insert({
        content_type,
        title,
        content: postMessage.substring(0, 500),
        status: 'failed',
        error_message: publishResult.error?.message || 'Failed to publish',
        threads_response: publishResult
      });
      
      throw new Error(publishResult.error?.message || 'Failed to publish to Threads');
    }

    console.log(`✅ Successfully posted to Threads: ${publishResult.id}`);

    // Log successful post
    await supabase.from('threads_post_log').insert({
      content_type,
      title,
      content: postMessage.substring(0, 500),
      status: 'success',
      threads_post_id: publishResult.id,
      threads_response: publishResult
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        post_id: publishResult.id,
        message: 'Successfully posted to Threads'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error posting to Threads:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

