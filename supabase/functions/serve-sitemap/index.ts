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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const sitemapType = url.searchParams.get('type') || 'index';
    const baseUrl = 'https://musicscan.app';
    const now = new Date().toISOString().split('T')[0];

    let content = '';

    if (sitemapType === 'index') {
      // Main sitemap index
      content = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemaps/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/sitemap-blog.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/sitemap-music-stories.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/sitemap-products.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/sitemap-images-blogs.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/sitemap-images-stories.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemaps/sitemap-images-products.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
    } else if (sitemapType === 'static') {
      // Static routes
      const staticRoutes = [
        { path: '/', priority: '1.0' },
        { path: '/scanner', priority: '0.9' },
        { path: '/public-catalog', priority: '0.9' },
        { path: '/public-shops-overview', priority: '0.8' },
        { path: '/music-news', priority: '0.8' },
        { path: '/verhalen', priority: '0.8' },
        { path: '/podcasts', priority: '0.7' },
        { path: '/community', priority: '0.7' },
        { path: '/forum', priority: '0.7' },
        { path: '/pricing', priority: '0.6' },
      ];

      content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map(route => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    } else if (sitemapType === 'blog') {
      // Blog posts
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;

      content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts?.map(post => `  <url>
    <loc>${baseUrl}/plaat-verhaal/${post.slug}</loc>
    <lastmod>${post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n') || ''}
</urlset>`;
    } else if (sitemapType === 'music-stories') {
      // Music stories
      const { data: stories, error } = await supabase
        .from('music_stories')
        .select('slug, updated_at, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;

      content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${stories?.map(story => `  <url>
    <loc>${baseUrl}/muziek-verhaal/${story.slug}</loc>
    <lastmod>${story.updated_at ? new Date(story.updated_at).toISOString().split('T')[0] : now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n') || ''}
</urlset>`;
    } else if (sitemapType === 'products') {
      // Platform products
      const { data: products, error } = await supabase
        .from('platform_products')
        .select('slug, updated_at, published_at')
        .eq('status', 'active')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      if (error) throw error;

      content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products?.map(product => `  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n') || ''}
</urlset>`;
    } else if (sitemapType === 'images-blogs') {
      // Blog images
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('slug, album_cover_url, yaml_frontmatter')
        .eq('is_published', true)
        .not('album_cover_url', 'is', null);

      if (error) throw error;

      content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${posts?.map(post => `  <url>
    <loc>${baseUrl}/plaat-verhaal/${post.slug}</loc>
    <image:image>
      <image:loc>${post.album_cover_url}</image:loc>
      <image:title>${post.yaml_frontmatter?.title || 'Album cover'}</image:title>
      <image:caption>${post.yaml_frontmatter?.artist || ''} - ${post.yaml_frontmatter?.title || ''}</image:caption>
    </image:image>
  </url>`).join('\n') || ''}
</urlset>`;
    } else if (sitemapType === 'images-stories') {
      // Music story images
      const { data: stories, error } = await supabase
        .from('music_stories')
        .select('slug, artwork_url, title, artist')
        .eq('is_published', true)
        .not('artwork_url', 'is', null);

      if (error) throw error;

      content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${stories?.map(story => `  <url>
    <loc>${baseUrl}/muziek-verhaal/${story.slug}</loc>
    <image:image>
      <image:loc>${story.artwork_url}</image:loc>
      <image:title>${story.title || 'Music story'}</image:title>
      <image:caption>${story.artist || ''} - ${story.title || ''}</image:caption>
    </image:image>
  </url>`).join('\n') || ''}
</urlset>`;
    } else if (sitemapType === 'images-products') {
      // Product images
      const { data: products, error } = await supabase
        .from('platform_products')
        .select('slug, primary_image, title, artist')
        .eq('status', 'active')
        .not('published_at', 'is', null)
        .not('primary_image', 'is', null);

      if (error) throw error;

      content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${products?.map(product => `  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <image:image>
      <image:loc>${product.primary_image}</image:loc>
      <image:title>${product.title || 'Product'}</image:title>
      <image:caption>${product.artist || ''} - ${product.title || ''}</image:caption>
    </image:image>
  </url>`).join('\n') || ''}
</urlset>`;
    } else {
      throw new Error('Invalid sitemap type');
    }

    console.log(`Generated ${sitemapType} sitemap with ${content.split('<url>').length - 1} URLs`);

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
