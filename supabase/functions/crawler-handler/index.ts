import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect if request is from a crawler/bot
function isCrawler(userAgent: string): boolean {
  const crawlerPatterns = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'facebot',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'applebot',
    'discordbot',
    'slackbot',
    'pinterestbot',
  ];
  
  const ua = userAgent.toLowerCase();
  return crawlerPatterns.some(pattern => ua.includes(pattern));
}

// Generate full HTML with server-side rendered meta tags for blog posts
function generateBlogHTML(blog: any, slug: string): string {
  const frontmatter = blog.yaml_frontmatter || {};
  const title = `${frontmatter.artist || 'Unknown Artist'} - ${frontmatter.album || blog.slug} | MusicScan Plaatverhaal`;
  const description = frontmatter.description || `Ontdek het verhaal achter ${frontmatter.album || 'dit album'} van ${frontmatter.artist || 'deze artiest'}. Lees de volledige recensie, geschiedenis, en waardering op MusicScan.`;
  
  // Prefer album cover, but ensure it's a valid URL, otherwise use fallback
  const image = blog.album_cover_url && blog.album_cover_url.startsWith('http') 
    ? blog.album_cover_url 
    : (frontmatter.og_image || frontmatter.image || 'https://www.musicscan.app/images/default-product-og.jpg');
  
  const url = `https://www.musicscan.app/plaat-verhaal/${slug}`;
  const publishDate = blog.published_at || blog.created_at;

  console.log('🖼️ Generating HTML for crawler:', {
    slug,
    image,
    hasAlbumCoverUrl: !!blog.album_cover_url,
    hasFrontmatterImage: !!frontmatter.og_image,
    artist: frontmatter.artist,
    album: frontmatter.album
  });

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta name="googlebot" content="index, follow">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:secure_url" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="MusicScan">
  <meta property="article:published_time" content="${publishDate}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:site" content="@musicscan_app">
  
  <link rel="canonical" href="${url}">
  
  <!-- Redirect to SPA after meta tags are read -->
  <meta http-equiv="refresh" content="0;url=${url}">
  
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .loading {
      text-align: center;
      color: #666;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="loading">
    <h1>${frontmatter.artist || 'Album'} - ${frontmatter.album || 'Verhaal'}</h1>
    <img src="${image}" alt="${frontmatter.album}" />
    <p>Loading full story...</p>
    <p><a href="${url}">Click here if not redirected</a></p>
  </div>
  
  <script>
    // Immediate redirect for non-crawler browsers
    if (!/bot|crawler|spider|facebookexternalhit|twitterbot/i.test(navigator.userAgent)) {
      window.location.href = '${url}';
    }
  </script>
</body>
</html>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    
    console.log('🔍 Crawler Handler Request:', {
      path: url.pathname,
      userAgent: userAgent.substring(0, 100),
      isCrawlerRequest: isCrawler(userAgent)
    });

    // Only handle blog post URLs for crawlers
    const blogMatch = url.pathname.match(/\/plaat-verhaal\/([^\/]+)/);
    
    if (!blogMatch) {
      return new Response(JSON.stringify({ 
        error: 'Not a blog post URL',
        usage: 'This endpoint handles /plaat-verhaal/{slug} URLs for crawlers'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const slug = blogMatch[1];

    // Check if request is from a crawler
    if (!isCrawler(userAgent)) {
      console.log('⏭️ Not a crawler, redirecting to SPA');
      return Response.redirect(`https://www.musicscan.app/plaat-verhaal/${slug}`, 302);
    }

    console.log('🤖 Crawler detected, serving SSR HTML for:', slug);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch blog post
    const { data: blog, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!blog) {
      console.log('❌ Blog post not found:', slug);
      return new Response('Blog post not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    console.log('✅ Blog found, generating HTML with image:', blog.album_cover_url);

    // Generate and return HTML
    const html = generateBlogHTML(blog, slug);
    
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Robots-Tag': 'index, follow',
      },
    });

  } catch (error) {
    console.error('Error in crawler-handler:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to serve crawler content'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
