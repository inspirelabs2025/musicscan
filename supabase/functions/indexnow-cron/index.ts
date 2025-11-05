import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXNOW_KEY = 'a8f68f8ba2ae44bf9a20fe14bd8dd42b';
const INDEXNOW_API = 'https://api.indexnow.org/IndexNow';
const BASE_URL = 'https://www.musicscan.app';

interface IndexNowRequest {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CRON] IndexNow processor started');
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch unprocessed URLs from queue (max 100 per batch)
    const { data: queueItems, error: queueError } = await supabaseClient
      .from('indexnow_queue')
      .select('id, url')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (queueError) {
      console.error('[CRON] Error fetching queue:', queueError);
      throw queueError;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('[CRON] No URLs to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No URLs to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CRON] Processing ${queueItems.length} URLs`);

    // Construct full URLs
    const urlList = queueItems.map(item => `${BASE_URL}${item.url}`);

    // Prepare IndexNow request
    const indexNowPayload: IndexNowRequest = {
      host: 'www.musicscan.app',
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/indexnow-key.txt`,
      urlList: urlList,
    };

    console.log('[CRON] Submitting to IndexNow:', JSON.stringify(indexNowPayload, null, 2));

    // Submit to IndexNow
    const indexNowResponse = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(indexNowPayload),
    });

    const statusCode = indexNowResponse.status;
    let responseBody = '';
    
    try {
      responseBody = await indexNowResponse.text();
    } catch (e) {
      console.log('[CRON] No response body');
    }

    console.log(`[CRON] IndexNow response: ${statusCode}`, responseBody);

    // Log submission to database
    const { error: logError } = await supabaseClient
      .from('indexnow_submissions')
      .insert({
        urls: urlList,
        urls_count: urlList.length,
        status_code: statusCode,
        response_body: responseBody || null,
        submitted_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('[CRON] Error logging submission:', logError);
    }

    // Mark URLs as processed
    const queueIds = queueItems.map(item => item.id);
    const { error: updateError } = await supabaseClient
      .from('indexnow_queue')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .in('id', queueIds);

    if (updateError) {
      console.error('[CRON] Error updating queue:', updateError);
      throw updateError;
    }

    console.log(`[CRON] Successfully processed ${queueItems.length} URLs`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        urlsSubmitted: urlList.length,
        statusCode: statusCode,
        message: statusCode === 200 
          ? 'URLs successfully submitted to IndexNow'
          : statusCode === 202
          ? 'URLs accepted by IndexNow'
          : `IndexNow returned status ${statusCode}`,
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('[CRON] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
