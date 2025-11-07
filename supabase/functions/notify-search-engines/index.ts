import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  url: string;
  contentType: string;
  triggerSitemapPing?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, contentType, triggerSitemapPing = false }: NotificationRequest = await req.json();
    
    console.log('Notifying search engines for:', { url, contentType, triggerSitemapPing });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      indexnow: false,
      googlePing: false
    };

    // 1. Add to IndexNow queue (for Bing, Yandex, etc.)
    try {
      const { error: queueError } = await supabase
        .from('indexnow_queue')
        .insert({
          url,
          content_type: contentType,
          processed: false
        });

      if (!queueError) {
        results.indexnow = true;
        console.log('Added to IndexNow queue');

        // Trigger immediate processing
        await supabase.functions.invoke('indexnow-processor');
      } else {
        console.error('IndexNow queue error:', queueError);
      }
    } catch (error) {
      console.error('IndexNow error:', error);
    }

    // 2. Ping Google sitemap (if requested)
    if (triggerSitemapPing) {
      try {
        const pingResponse = await supabase.functions.invoke('google-sitemap-ping');
        results.googlePing = pingResponse.error === null;
        console.log('Google sitemap ping:', results.googlePing ? 'success' : 'failed');
      } catch (error) {
        console.error('Google ping error:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: 'Search engines notified'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in notify-search-engines:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
