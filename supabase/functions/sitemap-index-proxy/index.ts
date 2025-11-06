const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🗺️ Proxying sitemap index');
    
    const storageUrl = 'https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/sitemap-index.xml';
    
    const response = await fetch(storageUrl, {
      headers: { 'Accept': 'application/xml' }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch sitemap index:', response.status);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><error>Sitemap index not found</error>`,
        { 
          status: 404, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/xml; charset=utf-8' 
          } 
        }
      );
    }
    
    const xml = await response.text();
    
    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      }
    });
    
  } catch (error) {
    console.error('❌ Sitemap index proxy error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>${error.message}</error>`,
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/xml; charset=utf-8' 
        } 
      }
    );
  }
});
