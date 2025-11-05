import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXNOW_KEY = 'd0dd9f8c31634b4094bfc54d5c5e77d1';
const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
const BASE_URL = 'https://vinylvault.app';

interface IndexNowRequest {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔄 IndexNow Processor: Starting batch processing...');

    // Fetch up to 100 unprocessed URLs from the queue
    const { data: queueItems, error: fetchError } = await supabaseClient
      .from('indexnow_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      console.error('Error fetching queue:', fetchError);
      throw fetchError;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('✅ No URLs in queue to process');
      return new Response(
        JSON.stringify({ message: 'No URLs to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📊 Found ${queueItems.length} URLs to submit`);

    // Construct full URLs
    const urls = queueItems.map(item => {
      const url = item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`;
      return url;
    });

    // Create IndexNow payload
    const indexNowPayload: IndexNowRequest = {
      host: new URL(BASE_URL).hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/indexnow-key.txt`,
      urlList: urls,
    };

    console.log('📤 Submitting to IndexNow API...', {
      urlCount: urls.length,
      host: indexNowPayload.host,
    });

    // Submit to IndexNow
    const indexNowResponse = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(indexNowPayload),
    });

    const statusCode = indexNowResponse.status;
    let responseBody = null;
    
    try {
      responseBody = await indexNowResponse.text();
    } catch (e) {
      console.log('No response body');
    }

    console.log(`📥 IndexNow API Response: ${statusCode}`);

    // Log submission to database
    const { error: logError } = await supabaseClient
      .from('indexnow_submissions')
      .insert({
        urls: urls,
        content_type: 'batch_processor',
        status_code: statusCode,
        response_body: responseBody,
      });

    if (logError) {
      console.error('Error logging submission:', logError);
    }

    // Mark queue items as processed
    const queueIds = queueItems.map(item => item.id);
    const { error: updateError } = await supabaseClient
      .from('indexnow_queue')
      .update({ 
        processed: true,
        processed_at: new Date().toISOString()
      })
      .in('id', queueIds);

    if (updateError) {
      console.error('Error updating queue:', updateError);
      throw updateError;
    }

    console.log(`✅ Successfully processed ${queueItems.length} URLs`);

    // Return appropriate response based on IndexNow status
    if (statusCode === 200 || statusCode === 202) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: queueItems.length,
          statusCode,
          message: statusCode === 200 ? 'URLs submitted successfully' : 'URLs received for processing'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else if (statusCode === 429) {
      console.warn('⚠️ Rate limited by IndexNow');
      return new Response(
        JSON.stringify({ 
          success: false, 
          processed: queueItems.length,
          statusCode,
          message: 'Rate limited - will retry later'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      console.error(`❌ IndexNow error: ${statusCode}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          processed: queueItems.length,
          statusCode,
          message: `IndexNow returned status ${statusCode}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

  } catch (error) {
    console.error('❌ Error in indexnow-processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
