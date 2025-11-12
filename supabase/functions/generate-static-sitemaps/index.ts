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

    // Fetch all published blog posts with pagination (batches of 1000)
    let blogPosts: Array<{ slug: string; updated_at: string; album_cover_url?: string; yaml_frontmatter?: any }> = [];
    const pageSize = 1000;
    let from = 0;
    let to = pageSize - 1;
    let totalCount: number | null = null;

    while (true) {
      const { data, error, count } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, album_cover_url, yaml_frontmatter', { count: 'exact' })
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Failed to fetch blog posts: ${error.message}`);
      }

      if (data && data.length > 0) {
        blogPosts = blogPosts.concat(data);
      }

      if (totalCount === null) totalCount = count ?? data?.length ?? 0;

      if (!data || data.length < pageSize || (blogPosts.length >= (totalCount ?? 0))) {
        break;
      }

      from += pageSize;
      to += pageSize;
    }

    // Fetch all published music stories (albums only - exclude singles)
    const { data: musicStories, error: storiesError } = await supabase
      .from('music_stories')
      .select('slug, updated_at, artwork_url, yaml_frontmatter, artist, album, title')
      .eq('is_published', true)
      .is('single_name', null)
      .order('updated_at', { ascending: false });

    if (storiesError) {
      throw new Error(`Failed to fetch music stories: ${storiesError.message}`);
    }

    // Fetch all published singles
    const { data: singles, error: singlesError } = await supabase
      .from('music_stories')
      .select('slug, updated_at, artwork_url, artist, single_name, title')
      .eq('is_published', true)
      .not('single_name', 'is', null)
      .order('updated_at', { ascending: false });

    if (singlesError) {
      throw new Error(`Failed to fetch singles: ${singlesError.message}`);
    }

    // Fetch all active music anecdotes
    const { data: anecdotes, error: anecdotesError } = await supabase
      .from('music_anecdotes')
      .select('slug, created_at, anecdote_date, anecdote_title')
      .eq('is_active', true)
      .order('anecdote_date', { ascending: false });

    if (anecdotesError) {
      throw new Error(`Failed to fetch anecdotes: ${anecdotesError.message}`);
    }

    // Fetch all active art products (metal prints) with images
    const { data: artProducts, error: productsError } = await supabase
      .from('platform_products')
      .select('slug, updated_at, primary_image, title, artist, tags, categories')
      .eq('media_type', 'art')
      .eq('status', 'active')
      .not('published_at', 'is', null)
      .order('updated_at', { ascending: false });

    if (productsError) {
      throw new Error(`Failed to fetch art products: ${productsError.message}`);
    }

    // Fetch all active T-shirt products (merchandise)
    const { data: tshirtProducts, error: tshirtsError } = await supabase
      .from('platform_products')
      .select('slug, updated_at, primary_image, title, artist, tags, categories')
      .eq('media_type', 'merchandise')
      .contains('categories', ['tshirts'])
      .eq('status', 'active')
      .not('published_at', 'is', null)
      .order('updated_at', { ascending: false });

    if (tshirtsError) {
      throw new Error(`Failed to fetch T-shirt products: ${tshirtsError.message}`);
    }

    // Fetch all active Canvas products
    const { data: canvasProducts, error: canvasError } = await supabase
      .from('platform_products')
      .select('slug, updated_at, primary_image, title, artist, tags, categories')
      .eq('media_type', 'art')
      .contains('categories', ['CANVAS'])
      .eq('status', 'active')
      .not('published_at', 'is', null)
      .order('updated_at', { ascending: false });

    if (canvasError) {
      throw new Error(`Failed to fetch canvas products: ${canvasError.message}`);
    }

    // Separate POSTER products from other art products
    const posterProducts = (artProducts || []).filter(p => p.categories?.includes('POSTER'));
    const metalPrintProducts = (artProducts || []).filter(p => !p.categories?.includes('POSTER'));

    console.log(`Found ${blogPosts?.length || 0} blog posts, ${anecdotes?.length || 0} anecdotes, ${musicStories?.length || 0} music stories, ${singles?.length || 0} singles, ${posterProducts?.length || 0} posters, ${metalPrintProducts?.length || 0} metal prints, ${tshirtProducts?.length || 0} t-shirts, and ${canvasProducts?.length || 0} canvas doeken`);

    // Generate regular sitemaps (single files, no pagination)
    const staticSitemapXml = generateStaticSitemapXml();
    const blogSitemapXml = generateSitemapXml(blogPosts || [], 'https://www.musicscan.app/plaat-verhaal');
    const anecdotesSitemapXml = generateSitemapXml(
      (anecdotes || []).map(a => ({
        slug: a.slug,
        updated_at: a.created_at
      })),
      'https://www.musicscan.app/anekdotes'
    );
    const storiesSitemapXml = generateSitemapXml(musicStories || [], 'https://www.musicscan.app/muziek-verhaal');
    const singlesSitemapXml = generateSitemapXml(singles || [], 'https://www.musicscan.app/singles');
    const metalPrintsSitemapXml = generateSitemapXml(metalPrintProducts || [], 'https://www.musicscan.app/product');
    const postersSitemapXml = generatePosterSitemapXml(posterProducts || []);
    const tshirtsSitemapXml = generateSitemapXml(tshirtProducts || [], 'https://www.musicscan.app/product');
    const canvasSitemapXml = generateSitemapXml(canvasProducts || [], 'https://www.musicscan.app/product');

    // Image sitemaps
    const blogImageSitemapXml = generateImageSitemapXml(blogPosts || [], 'https://www.musicscan.app/plaat-verhaal', 'album_cover_url');
    const storiesImageSitemapXml = generateImageSitemapXml(musicStories || [], 'https://www.musicscan.app/muziek-verhaal', 'artwork_url');
    const singlesImageSitemapXml = generateImageSitemapXml(singles || [], 'https://www.musicscan.app/singles', 'artwork_url');
    const metalPrintsImageSitemapXml = generateImageSitemapXml(metalPrintProducts || [], 'https://www.musicscan.app/product', 'primary_image');
    const postersImageSitemapXml = generatePosterImageSitemapXml(posterProducts || []);
    const tshirtsImageSitemapXml = generateImageSitemapXml(tshirtProducts || [], 'https://www.musicscan.app/product', 'primary_image');
    const canvasImageSitemapXml = generateImageSitemapXml(canvasProducts || [], 'https://www.musicscan.app/product', 'primary_image');

    // Build uploads list (18 files total - added singles sitemaps)
    const uploads = [
      { name: 'sitemap-static.xml', data: staticSitemapXml },
      { name: 'sitemap-blog.xml', data: blogSitemapXml },
      { name: 'sitemap-anecdotes.xml', data: anecdotesSitemapXml },
      { name: 'sitemap-music-stories.xml', data: storiesSitemapXml },
      { name: 'sitemap-singles.xml', data: singlesSitemapXml },
      { name: 'sitemap-metal-prints.xml', data: metalPrintsSitemapXml },
      { name: 'sitemap-posters.xml', data: postersSitemapXml },
      { name: 'sitemap-tshirts.xml', data: tshirtsSitemapXml },
      { name: 'sitemap-canvas.xml', data: canvasSitemapXml },
      { name: 'sitemap-images-blogs.xml', data: blogImageSitemapXml },
      { name: 'sitemap-images-stories.xml', data: storiesImageSitemapXml },
      { name: 'sitemap-images-singles.xml', data: singlesImageSitemapXml },
      { name: 'sitemap-images-metal-prints.xml', data: metalPrintsImageSitemapXml },
      { name: 'sitemap-images-posters.xml', data: postersImageSitemapXml },
      { name: 'sitemap-images-tshirts.xml', data: tshirtsImageSitemapXml },
      { name: 'sitemap-images-canvas.xml', data: canvasImageSitemapXml },
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

    // Cleanup old paginated blog sitemap files (sitemap-blog-v3-part*.xml)
    try {
      console.log('🧹 Cleaning up old paginated blog sitemaps...');
      const { data: existingFiles } = await supabase.storage.from('sitemaps').list();
      const oldPartFiles = (existingFiles || [])
        .filter(file => /^sitemap-blog-v3-part\d+\.xml$/.test(file.name));
      
      for (const file of oldPartFiles) {
        const { error: deleteError } = await supabase.storage
          .from('sitemaps')
          .remove([file.name]);
        
        if (deleteError) {
          console.error(`Failed to delete ${file.name}:`, deleteError);
        } else {
          console.log(`✅ Deleted old file: ${file.name}`);
        }
      }
      console.log(`🧹 Cleaned up ${oldPartFiles.length} old paginated sitemap files`);
    } catch (cleanupError) {
      console.error('Cleanup error (non-fatal):', cleanupError);
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
const sitemapBaseUrl = 'https://www.musicscan.app/sm';
const allSitemaps = [...uploads.map(u => u.name), 'sitemap-index.xml'];

for (const sitemapName of allSitemaps) {
  try {
    const checkUrl = sitemapName === 'sitemap-index.xml'
      ? 'https://www.musicscan.app/sitemap.xml'
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
          singles: singles?.length || 0,
          posterProducts: posterProducts?.length || 0,
          metalPrintProducts: metalPrintProducts?.length || 0,
          tshirtProducts: tshirtProducts?.length || 0,
          canvasProducts: canvasProducts?.length || 0,
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
  // Temporarily point to /sm alias to bypass any stale cache on /sitemaps
  const baseUrl = 'https://www.musicscan.app/sm';
  const now = new Date().toISOString();
  
  const sitemaps = uploads.map(u => 
    `  <sitemap>
    <loc>${baseUrl}/${u.name}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
  ).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
}

function generatePosterSitemapXml(items: Array<any>): string {
  const urls = items
    .map((item) => {
      const lastmod = new Date(item.updated_at).toISOString().split('T')[0];
      const style = item.tags?.find((t: string) => 
        ['posterize', 'vectorcartoon', 'oilpainting', 'watercolor', 'pencilsketch', 'comicbook', 'abstract'].includes(t.toLowerCase())
      ) || 'AI-generated';
      
      return `  <url>
    <loc>https://www.musicscan.app/product/${item.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <image:image>
      <image:loc>${item.primary_image}</image:loc>
      <image:caption>${item.artist} - ${item.title} (${style} poster)</image:caption>
      <image:title>${item.artist} - ${item.title}</image:title>
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

function generatePosterImageSitemapXml(items: Array<any>): string {
  const urls = items
    .filter(item => item.primary_image)
    .map((item) => {
      const style = item.tags?.find((t: string) => 
        ['posterize', 'vectorcartoon', 'oilpainting', 'watercolor', 'pencilsketch', 'comicbook', 'abstract'].includes(t.toLowerCase())
      ) || 'AI-generated';
      
      return `  <url>
    <loc>https://www.musicscan.app/product/${item.slug}</loc>
    <image:image>
      <image:loc>${item.primary_image}</image:loc>
      <image:caption>${item.artist} - ${item.title} | ${style} poster | MusicScan Art</image:caption>
      <image:title>${item.artist} - ${item.title} Poster</image:title>
      <image:license>https://www.musicscan.app/terms</image:license>
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

function generateStaticSitemapXml(): string {
  const baseUrl = 'https://www.musicscan.app';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const staticPages = [
    { url: baseUrl, priority: 1.0, changefreq: 'daily' },
    { url: `${baseUrl}/scanner`, priority: 0.9, changefreq: 'weekly' },
    { url: `${baseUrl}/posters`, priority: 0.9, changefreq: 'daily' },
    { url: `${baseUrl}/art-shop`, priority: 0.8, changefreq: 'weekly' },
    { url: `${baseUrl}/public-catalog`, priority: 0.8, changefreq: 'daily' },
    { url: `${baseUrl}/public-shops-overview`, priority: 0.8, changefreq: 'daily' },
    { url: `${baseUrl}/nieuws`, priority: 0.8, changefreq: 'hourly' },
    { url: `${baseUrl}/plaat-verhaal`, priority: 0.8, changefreq: 'daily' },
    { url: `${baseUrl}/muziek-verhaal`, priority: 0.8, changefreq: 'daily' },
    { url: `${baseUrl}/podcasts`, priority: 0.7, changefreq: 'weekly' },
    { url: `${baseUrl}/auth`, priority: 0.6, changefreq: 'monthly' }
  ];
  
  const urls = staticPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
