const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping van name → storage filename
const SITEMAP_MAP: Record<string, string> = {
  'index': 'sitemap-index.xml',
  'blog': 'sitemap-blog.xml',
  'products': 'sitemap-products.xml',
  'music-stories': 'sitemap-music-stories.xml',
  'static': 'sitemap-static.xml',
  'images-blogs': 'sitemap-images-blogs.xml',
  'images-products': 'sitemap-images-products.xml',
  'images-stories': 'sitemap-images-stories.xml',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    
    if (!name || !SITEMAP_MAP[name]) {
      console.error('❌ Invalid sitemap name:', name);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><error>Invalid sitemap name</error>`,
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/xml; charset=utf-8' 
          } 
        }
      );
    }
    
    const sitemapFile = SITEMAP_MAP[name];
    console.log('🗺️ Proxying sitemap:', name, '→', sitemapFile);
    
    const storageUrl = `https://ssxbpyqnjfiyubsuonar.supabase.co/storage/v1/object/public/sitemaps/${sitemapFile}`;
    
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
        'X-Sitemaps-Proxy': '1',
        'X-Upstream': sitemapFile,
      }
    });
    
  } catch (error) {
    console.error('❌ Sitemaps proxy error:', error);
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
