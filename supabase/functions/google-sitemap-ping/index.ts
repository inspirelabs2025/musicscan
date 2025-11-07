import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Google sitemap ping...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const sitemapUrl = 'https://www.musicscan.app/sitemap.xml';
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

    console.log('Pinging Google with sitemap:', sitemapUrl);

    // Ping Google
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'MusicScan Sitemap Notifier'
      }
    });

    const success = response.ok;
    const statusCode = response.status;

    console.log('Google ping response:', { statusCode, success });

    // Log the ping attempt
    const { error: logError } = await supabase
      .from('indexnow_submissions')
      .insert({
        urls: [sitemapUrl],
        status_code: statusCode,
        response_body: { 
          service: 'google',
          success,
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('Error logging ping:', logError);
    }

    return new Response(
      JSON.stringify({
        success,
        statusCode,
        message: success ? 'Google notified successfully' : 'Google ping failed',
        sitemapUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: success ? 200 : 500
      }
    );

  } catch (error) {
    console.error('Error in google-sitemap-ping:', error);
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
