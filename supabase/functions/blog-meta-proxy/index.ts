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
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'applebot',
    'discordbot',
  ];
  
  const ua = userAgent.toLowerCase();
  return crawlerPatterns.some(pattern => ua.includes(pattern));
}

// Generate full HTML with server-side rendered meta tags
function generateBlogHTML(blog: any): string {
  const frontmatter = blog.yaml_frontmatter || {};
  const title = `${frontmatter.artist || 'Unknown Artist'} - ${frontmatter.album || blog.slug} | MusicScan Plaatverhaal`;
  const description = frontmatter.description || `Ontdek het verhaal achter ${frontmatter.album || 'dit album'} van ${frontmatter.artist || 'deze artiest'}. Lees de volledige recensie, geschiedenis, en waardering op MusicScan.`;
  const image = blog.album_cover_url || frontmatter.image || 'https://www.musicscan.app/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png';
  const url = `https://www.musicscan.app/plaat-verhaal/${blog.slug}`;
  const publishDate = blog.published_at || blog.created_at;
  const price = frontmatter.estimated_price || frontmatter.price;

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "datePublished": publishDate,
    "dateModified": blog.updated_at || publishDate,
    "author": {
      "@type": "Organization",
      "name": "MusicScan AI"
    },
    "publisher": {
      "@type": "Organization",
      "name": "MusicScan",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.musicscan.app/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png"
      }
    },
    "image": image,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "keywords": [
      frontmatter.artist,
      frontmatter.album,
      frontmatter.genre,
      'vinyl',
      'cd',
      'muziek',
      'album recensie',
      'plaat verhaal'
    ].filter(Boolean).join(', ')
  };

  if (frontmatter.artist && frontmatter.album) {
    structuredData["about"] = {
      "@type": "MusicAlbum",
      "name": frontmatter.album,
      "byArtist": {
        "@type": "MusicGroup",
        "name": frontmatter.artist
      },
      ...(frontmatter.genre && { genre: frontmatter.genre }),
      ...(price && {
        offers: {
          "@type": "Offer",
          "price": price.toString(),
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock"
        }
      })
    };
  }

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="keywords" content="${structuredData.keywords}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta name="googlebot" content="index, follow">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="MusicScan">
  <meta property="article:published_time" content="${publishDate}">
  <meta property="article:modified_time" content="${blog.updated_at || publishDate}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:site" content="@musicscan_app">
  
  <!-- Canonical -->
  <link rel="canonical" href="${url}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
  </script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    img { max-width: 100%; height: auto; }
    .content { line-height: 1.6; }
  </style>
</head>
<body>
  <article>
    <header>
      <h1>${frontmatter.artist || 'Unknown'} - ${frontmatter.album || blog.slug}</h1>
      ${image ? `<img src="${image}" alt="${frontmatter.album} album cover" loading="eager">` : ''}
    </header>
    <div class="content">
      ${blog.markdown_content ? `<p>${blog.markdown_content.substring(0, 500)}...</p>` : ''}
    </div>
  </article>
  
  <!-- Redirect to full SPA after crawler has indexed -->
  <noscript>
    <meta http-equiv="refresh" content="0; url=${url}">
  </noscript>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userAgent = req.headers.get('user-agent') || '';
    const url = new URL(req.url);
    
    // Extract slug from path like /plaat-verhaal/:slug
    const pathMatch = url.pathname.match(/\/plaat-verhaal\/([^/]+)/);
    if (!pathMatch) {
      return new Response(JSON.stringify({ error: 'Invalid path' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const slug = pathMatch[1];

    // Check if request is from a crawler
    if (!isCrawler(userAgent)) {
      console.log(`Non-crawler detected (${userAgent}), proxying to SPA`);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `https://www.musicscan.app/plaat-verhaal/${slug}`,
        },
      });
    }

    console.log(`Crawler detected: ${userAgent} for slug: ${slug}`);

    // Fetch blog post from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: blog, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) throw error;

    if (!blog) {
      return new Response('Blog post not found', {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Generate and return HTML with server-side rendered meta tags
    const html = generateBlogHTML(blog);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error in blog-meta-proxy:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
