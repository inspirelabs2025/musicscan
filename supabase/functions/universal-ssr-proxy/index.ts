import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.musicscan.app';

// Detect if request is from a crawler
const isCrawler = (userAgent: string): boolean => {
  const crawlerPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'facebookexternalhit', 'linkedinbot', 'twitterbot',
    'whatsapp', 'telegrambot', 'bot', 'crawler', 'spider'
  ];
  const ua = userAgent.toLowerCase();
  return crawlerPatterns.some(pattern => ua.includes(pattern));
};

// Generate blog post HTML
const generateBlogHTML = (blog: any): string => {
  const frontmatter = blog.yaml_frontmatter || {};
  const title = frontmatter.title || blog.title || 'Album Story';
  const artist = frontmatter.artist || '';
  const album = frontmatter.album || '';
  const description = frontmatter.description || blog.excerpt || '';
  const imageUrl = blog.album_cover_url || frontmatter.image || `${BASE_URL}/placeholder.svg`;
  const genre = frontmatter.genre || '';
  const year = frontmatter.year || '';
  
  // Generate clean content preview
  const contentPreview = blog.markdown_content
    ?.replace(/<[^>]*>/g, '')
    ?.replace(/\n+/g, ' ')
    ?.trim()
    ?.substring(0, 500) || '';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artist} - ${album} | ${title} | MusicScan</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  
  <meta property="og:type" content="article">
  <meta property="og:title" content="${artist} - ${album}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${BASE_URL}/plaat-verhaal/${blog.slug}">
  <meta property="og:site_name" content="MusicScan">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${artist} - ${album}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <link rel="canonical" href="${BASE_URL}/plaat-verhaal/${blog.slug}">
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${description}",
    "image": "${imageUrl}",
    "author": { "@type": "Organization", "name": "MusicScan" },
    "publisher": { "@type": "Organization", "name": "MusicScan", "logo": { "@type": "ImageObject", "url": "${BASE_URL}/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" } },
    "datePublished": "${blog.published_at || blog.created_at}",
    "dateModified": "${blog.updated_at || blog.published_at || blog.created_at}",
    "mainEntityOfPage": "${BASE_URL}/plaat-verhaal/${blog.slug}"
  }
  </script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    .content { margin-top: 2rem; }
  </style>
</head>
<body>
  <article>
    <header>
      <h1>${artist} - ${album}</h1>
      ${imageUrl && imageUrl !== `${BASE_URL}/placeholder.svg` ? `<img src="${imageUrl}" alt="${album} album cover" loading="eager">` : ''}
    </header>
    <div class="content">
      ${description ? `<p><strong>${description}</strong></p>` : ''}
      ${contentPreview ? `<p>${contentPreview}...</p>` : ''}
    </div>
  </article>
  
  <noscript>
    <p><a href="${BASE_URL}/plaat-verhaal/${blog.slug}">Klik hier voor de volledige ervaring op MusicScan</a></p>
  </noscript>
</body>
</html>`;
};

// Generate music story HTML
const generateStoryHTML = (story: any): string => {
  const frontmatter = story.yaml_frontmatter || {};
  const title = frontmatter.title || story.title || 'Music Story';
  const artist = frontmatter.artist || '';
  const description = frontmatter.description || story.excerpt || '';
  const imageUrl = story.artwork_url || story.cover_image_url || frontmatter.image || `${BASE_URL}/placeholder.svg`;
  
  // Generate clean content preview
  const contentPreview = story.story_content
    ?.replace(/<[^>]*>/g, '')
    ?.replace(/\n+/g, ' ')
    ?.trim()
    ?.substring(0, 500) || '';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | MusicScan Muziekverhalen</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${BASE_URL}/muziek-verhaal/${story.slug}">
  <meta property="og:site_name" content="MusicScan">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <link rel="canonical" href="${BASE_URL}/muziek-verhaal/${story.slug}">
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${description}",
    "image": "${imageUrl}",
    "author": { "@type": "Organization", "name": "MusicScan" },
    "publisher": { "@type": "Organization", "name": "MusicScan", "logo": { "@type": "ImageObject", "url": "${BASE_URL}/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png" } },
    "datePublished": "${story.published_at || story.created_at}",
    "dateModified": "${story.updated_at || story.published_at || story.created_at}",
    "mainEntityOfPage": "${BASE_URL}/muziek-verhaal/${story.slug}"
  }
  </script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    .content { margin-top: 2rem; }
  </style>
</head>
<body>
  <article>
    <header>
      <h1>${title}</h1>
      ${imageUrl && imageUrl !== `${BASE_URL}/placeholder.svg` ? `<img src="${imageUrl}" alt="${title}" loading="eager">` : ''}
    </header>
    <div class="content">
      ${artist ? `<p><strong>Artiest: ${artist}</strong></p>` : ''}
      ${description ? `<p><strong>${description}</strong></p>` : ''}
      ${contentPreview ? `<p>${contentPreview}...</p>` : ''}
    </div>
  </article>
  
  <noscript>
    <p><a href="${BASE_URL}/muziek-verhaal/${story.slug}">Klik hier voor de volledige ervaring op MusicScan</a></p>
  </noscript>
</body>
</html>`;
};

// Generate product HTML
const generateProductHTML = (product: any): string => {
  const title = product.title || 'Metal Print';
  const artist = product.artist || '';
  const description = product.description || '';
  const imageUrl = product.primary_image || `${BASE_URL}/placeholder.svg`;
  const price = product.price || 0;
  
  // Generate clean content preview
  const contentPreview = description
    ?.replace(/<[^>]*>/g, '')
    ?.replace(/\n+/g, ' ')
    ?.trim()
    ?.substring(0, 500) || '';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Metal Print Album Cover | MusicScan</title>
  <meta name="description" content="${description || `Bestel ${title} als premium metalen albumcover print. Hoogwaardige kunst voor muziekliefhebbers.`}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  
  <meta property="og:type" content="product">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${BASE_URL}/product/${product.slug}">
  <meta property="og:site_name" content="MusicScan">
  <meta property="product:price:amount" content="${price}">
  <meta property="product:price:currency" content="EUR">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <link rel="canonical" href="${BASE_URL}/product/${product.slug}">
  
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "${title}",
    "description": "${description}",
    "image": "${imageUrl}",
    "brand": { "@type": "Brand", "name": "${artist || 'MusicScan'}" },
    "offers": {
      "@type": "Offer",
      "url": "${BASE_URL}/product/${product.slug}",
      "priceCurrency": "EUR",
      "price": "${price}",
      "availability": "${product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}",
      "seller": { "@type": "Organization", "name": "MusicScan" }
    }
  }
  </script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    .content { margin-top: 2rem; }
    .price { font-size: 1.5rem; font-weight: bold; color: #059669; margin-top: 1rem; }
  </style>
</head>
<body>
  <article>
    <header>
      <h1>${title}</h1>
      ${imageUrl && imageUrl !== `${BASE_URL}/placeholder.svg` ? `<img src="${imageUrl}" alt="${title}" loading="eager">` : ''}
    </header>
    <div class="content">
      ${artist ? `<p><strong>Artiest: ${artist}</strong></p>` : ''}
      ${contentPreview ? `<p>${contentPreview}${contentPreview.length < description?.length ? '...' : ''}</p>` : ''}
      <div class="price">€${price}</div>
      ${product.stock_quantity > 0 ? '<p><strong>Op voorraad</strong></p>' : '<p><strong>Uitverkocht</strong></p>'}
    </div>
  </article>
  
  <noscript>
    <p><a href="${BASE_URL}/product/${product.slug}">Klik hier voor de volledige ervaring op MusicScan</a></p>
  </noscript>
</body>
</html>`;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    
    console.log(`[SSR] Request: ${url.pathname}, UA: ${userAgent}`);

    // If not a crawler, redirect to main app
    if (!isCrawler(userAgent)) {
      console.log('[SSR] Not a crawler, redirecting to app');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${BASE_URL}${url.pathname}`,
          'Cache-Control': 'public, max-age=60'
        }
      });
    }

    // Parse the path to determine content type
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      throw new Error('Invalid path format');
    }

    const contentType = pathParts[0]; // 'plaat-verhaal', 'muziek-verhaal', 'product'
    const slug = pathParts[1];

    console.log(`[SSR] Content type: ${contentType}, slug: ${slug}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    let html = '';

    // Fetch and generate HTML based on content type
    switch (contentType) {
      case 'plaat-verhaal': {
        const { data: blog, error } = await supabaseClient
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !blog) {
          throw new Error('Blog post not found');
        }

        html = generateBlogHTML(blog);
        break;
      }

      case 'muziek-verhaal': {
        const { data: story, error } = await supabaseClient
          .from('music_stories')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !story) {
          throw new Error('Music story not found');
        }

        html = generateStoryHTML(story);
        break;
      }

      case 'product': {
        const { data: product, error } = await supabaseClient
          .from('platform_products')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .single();

        if (error || !product) {
          throw new Error('Product not found');
        }

        html = generateProductHTML(product);
        break;
      }

      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }

    // Return SEO-friendly HTML
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400'
      }
    });

  } catch (error) {
    console.error('[SSR] Error:', error);
    
    // Fallback to main app on error
    const url = new URL(req.url);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${BASE_URL}${url.pathname}`
      }
    });
  }
});
