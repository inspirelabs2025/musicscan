const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const sitemapName = pathParts[pathParts.length - 1]; // e.g., "sitemap-blog.xml"
    
    console.log('🗺️ Proxying sitemap:', sitemapName);
    
    const storageUrl = `https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/${sitemapName}`;
    
    const response = await fetch(storageUrl, {
      headers: { 'Accept': 'application/xml' }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch sitemap:', response.status);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><error>Sitemap not found</error>`,
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
    console.error('❌ Sitemap proxy error:', error);
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
