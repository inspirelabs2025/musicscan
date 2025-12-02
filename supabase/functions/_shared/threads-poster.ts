import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface ThreadsPostParams {
  title: string;
  content: string;
  url?: string;
  image_url?: string;
  artist?: string;
  content_type: string;
}

export async function postToThreads(params: ThreadsPostParams): Promise<{ success: boolean; post_id?: string; error?: string }> {
  const { title, content, url, image_url, artist, content_type } = params;
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Threads credentials from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['THREADS_ACCESS_TOKEN', 'THREADS_USER_ID']);

    if (secretsError || !secrets || secrets.length < 2) {
      console.log('🧵 Threads not configured, skipping...');
      return { success: false, error: 'Threads credentials not configured' };
    }

    const credentials: Record<string, string> = {};
    secrets.forEach(s => { credentials[s.secret_key] = s.secret_value; });

    const accessToken = credentials['THREADS_ACCESS_TOKEN'];
    const userId = credentials['THREADS_USER_ID'];

    if (!accessToken || !userId) {
      console.log('🧵 Threads credentials incomplete, skipping...');
      return { success: false, error: 'Missing Threads credentials' };
    }

    // Build post message (shorter for Threads - 500 char limit)
    let postMessage = `${title}\n\n`;
    
    const maxContentLength = url ? 350 : 450;
    if (content.length > maxContentLength) {
      postMessage += content.substring(0, maxContentLength).trim() + '...';
    } else {
      postMessage += content;
    }
    
    if (url) {
      postMessage += `\n\n🔗 ${url}`;
    }

    // Add minimal hashtags for Threads
    const hashtags = ['#MusicScan'];
    if (artist) {
      const artistTag = artist.replace(/[^a-zA-Z0-9]/g, '');
      if (artistTag.length > 2) {
        hashtags.push(`#${artistTag}`);
      }
    }
    postMessage += '\n\n' + hashtags.slice(0, 3).join(' ');

    console.log('🧵 Posting to Threads...');

    // Step 1: Create media container
    const createUrl = `https://graph.threads.net/v1.0/${userId}/threads`;
    
    const createParams: Record<string, string> = {
      text: postMessage,
      access_token: accessToken,
    };

    if (image_url) {
      createParams.media_type = 'IMAGE';
      createParams.image_url = image_url;
    } else {
      createParams.media_type = 'TEXT';
    }

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(createParams),
    });

    const createResult = await createResponse.json();

    if (!createResponse.ok || createResult.error) {
      console.error('🧵 Threads create container error:', createResult);
      
      await supabase.from('threads_post_log').insert({
        content_type,
        title,
        content: postMessage.substring(0, 500),
        status: 'failed',
        error_message: createResult.error?.message || 'Failed to create container',
        threads_response: createResult
      });
      
      return { success: false, error: createResult.error?.message };
    }

    const containerId = createResult.id;

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
      console.error('🧵 Threads publish error:', publishResult);
      
      await supabase.from('threads_post_log').insert({
        content_type,
        title,
        content: postMessage.substring(0, 500),
        status: 'failed',
        error_message: publishResult.error?.message || 'Failed to publish',
        threads_response: publishResult
      });
      
      return { success: false, error: publishResult.error?.message };
    }

    console.log(`✅ Posted to Threads: ${publishResult.id}`);

    // Log successful post
    await supabase.from('threads_post_log').insert({
      content_type,
      title,
      content: postMessage.substring(0, 500),
      status: 'success',
      threads_post_id: publishResult.id,
      threads_response: publishResult
    });

    return { success: true, post_id: publishResult.id };

  } catch (error: any) {
    console.error('🧵 Error posting to Threads:', error);
    return { success: false, error: error.message };
  }
}
