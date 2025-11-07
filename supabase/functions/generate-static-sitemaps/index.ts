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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting static sitemap generation...');

    // Fetch all published blog posts with images
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, album_cover_url, yaml_frontmatter')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (blogError) {
      throw new Error(`Failed to fetch blog posts: ${blogError.message}`);
    }

    // Fetch all published music stories with images
    const { data: musicStories, error: storiesError } = await supabase
      .from('music_stories')
      .select('slug, updated_at, artwork_url, yaml_frontmatter, artist, album, title')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (storiesError) {
      throw new Error(`Failed to fetch music stories: ${storiesError.message}`);
    }

    // Fetch all active art products (metal prints) with images
    const { data: artProducts, error: productsError } = await supabase
      .from('platform_products')
      .select('slug, updated_at, primary_image, title, artist')
      .eq('media_type', 'art')
      .eq('status', 'active')
      .not('published_at', 'is', null)
      .order('updated_at', { ascending: false });

    if (productsError) {
      throw new Error(`Failed to fetch art products: ${productsError.message}`);
    }

    console.log(`Found ${blogPosts?.length || 0} blog posts, ${musicStories?.length || 0} music stories, and ${artProducts?.length || 0} art products`);

    // Generate regular sitemaps
    const blogSitemapXml = generateSitemapXml(blogPosts || [], 'https://musicscan.app/plaat-verhaal');
    const storiesSitemapXml = generateSitemapXml(musicStories || [], 'https://musicscan.app/muziek-verhaal');
    const productsSitemapXml = generateSitemapXml(artProducts || [], 'https://musicscan.app/product');

    // Generate image sitemaps
    const blogImageSitemapXml = generateImageSitemapXml(blogPosts || [], 'https://musicscan.app/plaat-verhaal', 'album_cover_url');
    const storiesImageSitemapXml = generateImageSitemapXml(musicStories || [], 'https://musicscan.app/muziek-verhaal', 'artwork_url');
    const productsImageSitemapXml = generateImageSitemapXml(artProducts || [], 'https://musicscan.app/product', 'primary_image');

    // Upload all sitemaps
    const uploads = [
      { name: 'sitemap-blog.xml', data: blogSitemapXml },
      { name: 'sitemap-music-stories.xml', data: storiesSitemapXml },
      { name: 'sitemap-products.xml', data: productsSitemapXml },
      { name: 'sitemap-images-blogs.xml', data: blogImageSitemapXml },
      { name: 'sitemap-images-stories.xml', data: storiesImageSitemapXml },
      { name: 'sitemap-images-products.xml', data: productsImageSitemapXml },
    ];

    for (const upload of uploads) {
      const result = await supabase.storage
        .from('sitemaps')
        .upload(upload.name, new Blob([upload.data], { type: 'application/xml' }), {
          contentType: 'application/xml',
          cacheControl: '0',
          upsert: true,
        });

      if (result.error) {
        console.error(`Error uploading ${upload.name}:`, result.error);
        throw new Error(`Failed to upload ${upload.name}: ${result.error.message}`);
      }
      console.log(`✅ Uploaded ${upload.name}`);
    }

    // Generate dynamic sitemap index
    const sitemapIndexXml = await generateSitemapIndex(uploads);
    const indexUpload = await supabase.storage
      .from('sitemaps')
      .upload('sitemap-index.xml', new Blob([sitemapIndexXml], { type: 'application/xml' }), {
        contentType: 'application/xml; charset=utf-8',
        cacheControl: '0',
        upsert: true,
      });

    if (indexUpload.error) {
      console.error('Error uploading sitemap-index.xml:', indexUpload.error);
    } else {
      console.log('✅ Uploaded sitemap-index.xml');
    }

    // Perform health checks on all sitemaps
    const healthChecks: Record<string, any> = {};
    const sitemapBaseUrl = 'https://musicscan.app/sitemaps';
    const allSitemaps = [...uploads.map(u => u.name), 'sitemap-index.xml', 'sitemap-static.xml'];

    for (const sitemapName of allSitemaps) {
      try {
        const checkUrl = sitemapName === 'sitemap-index.xml'
          ? 'https://musicscan.app/sitemap.xml'
          : `${sitemapBaseUrl}/${sitemapName}`;
        
        const response = await fetch(checkUrl, { method: 'HEAD' });
        healthChecks[sitemapName] = {
          status: response.status,
          ok: response.ok,
          content_type: response.headers.get('content-type'),
          last_modified: response.headers.get('last-modified'),
          checked_at: new Date().toISOString()
        };
        
        if (!response.ok) {
          console.error(`⚠️ Health check failed for ${sitemapName}: ${response.status}`);
        }
      } catch (err) {
        healthChecks[sitemapName] = { error: err.message, checked_at: new Date().toISOString() };
      }
    }

    // Submit to Google Search Console API
    let gscSubmitted = false;
    let gscResponse = null;

    try {
      console.log('🔔 Calling GSC sitemap submission...');
      const { data: gscResult, error: gscError } = await supabase.functions.invoke('gsc-sitemap-submit');
      
      if (gscError) {
        console.error('❌ GSC submission error:', gscError);
        gscResponse = { error: gscError.message, details: gscError };
      } else {
        gscSubmitted = gscResult?.success || false;
        gscResponse = gscResult;
        console.log(`✅ GSC submission result:`, { 
          success: gscSubmitted, 
          submitted: gscResult?.submitted || 0,
          failed: gscResult?.failed || 0 
        });
      }
    } catch (err) {
      console.error('❌ GSC submission exception:', err);
      gscResponse = { error: err.message, stack: err.stack };
    }

    console.log('All sitemaps uploaded successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Static sitemaps generated successfully',
        sitemaps_updated: [...uploads.map(u => u.name), 'sitemap-index.xml'],
        health_checks: healthChecks,
        gsc_submitted: gscSubmitted,
        gsc_response: gscResponse,
        stats: {
          blogPosts: blogPosts?.length || 0,
          musicStories: musicStories?.length || 0,
          artProducts: artProducts?.length || 0,
          sitemaps: uploads.map(u => ({
            name: u.name,
            url: `${supabaseUrl}/storage/v1/object/public/sitemaps/${u.name}`
          }))
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating static sitemaps:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateSitemapXml(items: Array<{ slug: string; updated_at: string }>, baseUrl: string): string {
  const urls = items
    .map((item) => {
      const lastmod = new Date(item.updated_at).toISOString().split('T')[0];
      return `  <url>
    <loc>${baseUrl}/${item.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateImageSitemapXml(items: Array<any>, baseUrl: string, imageField: string): string {
  const urls = items
    .filter(item => item[imageField]) // Only include items with images
    .map((item) => {
      const imageUrl = item[imageField];
      const metadata = item.yaml_frontmatter || {};
      const title = metadata.title || item.title || '';
      const artist = metadata.artist || item.artist || '';
      const caption = artist && title ? `${artist} - ${title}` : title || artist || 'Album Cover';
      
      return `  <url>
    <loc>${baseUrl}/${item.slug}</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:caption>${caption}</image:caption>
      <image:title>${caption}</image:title>
    </image:image>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}

function generateSitemapIndex(uploads: Array<{ name: string }>): string {
  const baseUrl = 'https://musicscan.app/sitemaps';
  const now = new Date().toISOString();
  
  const dynamicSitemaps = uploads.map(u => 
    `  <sitemap>
    <loc>${baseUrl}/${u.name}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  ).join('\n');
  
  const staticEntry = `  <sitemap>
    <loc>https://musicscan.app/sitemaps/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntry}
${dynamicSitemaps}
</sitemapindex>`;
}
