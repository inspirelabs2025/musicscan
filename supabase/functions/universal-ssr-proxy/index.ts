import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.musicscan.app';

// Normalize URL by removing trailing slashes
const normalizeSlug = (slug: string): string => {
  return slug.replace(/\/$/, '').trim();
};

// Find canonical slug for blog posts (handles year variants)
const findCanonicalBlogSlug = async (supabaseClient: any, requestedSlug: string): Promise<string | null> => {
  // Helper: parse base and year from slug pattern "<base>-<year|unknown>"
  const parseSlug = (s: string) => {
    const m = s.match(/^(.*)-((?:\d{4})|unknown)$/);
    if (m) {
      return { base: m[1], year: m[2] };
    }
    return { base: s, year: null };
  };

  const { base, year: yearPart } = parseSlug(requestedSlug);

  // 1) Try exact slug first
  let { data: blogData } = await supabaseClient
    .from('blog_posts')
    .select('slug')
    .eq('slug', requestedSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (blogData) return blogData.slug;

  // 2) Try same base with -unknown
  if (yearPart && yearPart !== 'unknown') {
    const altUnknown = `${base}-unknown`;
    const { data: unknownData } = await supabaseClient
      .from('blog_posts')
      .select('slug')
      .eq('slug', altUnknown)
      .eq('is_published', true)
      .maybeSingle();
    if (unknownData) return unknownData.slug;
  }

  // 3) Try any slug with same base prefix
  const { data: prefixList } = await supabaseClient
    .from('blog_posts')
    .select('slug')
    .ilike('slug', `${base}-%`)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1);
  if (prefixList && prefixList.length > 0) return prefixList[0].slug;

  // 4) Try base without year
  const { data: baseData } = await supabaseClient
    .from('blog_posts')
    .select('slug')
    .eq('slug', base)
    .eq('is_published', true)
    .maybeSingle();
  if (baseData) return baseData.slug;

  return null;
};

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
  
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${BASE_URL}/product/${product.slug}">
  <meta property="og:site_name" content="MusicScan">
  
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
    "sku": "${product.id || product.slug}",
    "brand": { "@type": "Brand", "name": "${artist || 'MusicScan'}" },
    "offers": {
      "@type": "Offer",
      "url": "${BASE_URL}/product/${product.slug}",
      "priceCurrency": "EUR",
      "price": "${price}",
      "priceValidUntil": "${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}",
      "itemCondition": "https://schema.org/NewCondition",
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

    // Strip all possible SSR proxy prefixes from pathname
    let cleanPathname = url.pathname
      .replace(/^\/functions\/v1\/universal-ssr-proxy/, '')
      .replace(/^\/universal-ssr-proxy/, '');
    
    console.log(`[SSR] Original pathname: ${url.pathname}, Cleaned: ${cleanPathname}`);

    // Handle sitemap-llm.xml requests
    if (cleanPathname === '/sitemap-llm.xml') {
      console.log('[SSR] Serving LLM sitemap, forwarding to edge function');
      
      try {
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-llm-sitemap`, {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch LLM sitemap: ${response.status}`);
        }
        
        const sitemapContent = await response.text();
        
        return new Response(sitemapContent, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (error) {
        console.error('[SSR] Error fetching LLM sitemap:', error);
        return new Response('Error generating sitemap', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
    }

    // Handle .well-known/llms.txt requests - serve static content
    if (cleanPathname === '/.well-known/llms.txt' || cleanPathname === '/llms.txt') {
      console.log('[SSR] Serving llms.txt');
      
      // Read the llms.txt file from public directory or return inline content
      const llmsContent = `# MusicScan - AI-Powered Music Collection Platform

> MusicScan is een Nederlands platform voor muziekverzamelaars die hun vinyl platen 
> en CD's willen digitaliseren, waarderen en beheren met behulp van AI-technologie.

## Site Beschrijving

MusicScan helpt muziekliefhebbers en verzamelaars om:
- Vinyl platen en CD's te scannen met AI-herkenning
- Collecties digitaal te beheren en catalogiseren
- Actuele prijswaarderingen te krijgen via Discogs
- Muziekgeschiedenis te ontdekken via verhalen en anekdotes
- Unieke muziek art producten te kopen (posters, metaalprints, sokken, t-shirts)

## Belangrijkste Features

### AI Scanner
- Automatische herkenning van albums via foto's
- Directe koppeling met Discogs database
- Conditie beoordeling en waardering

### Collectie Management
- Persoonlijke vinyl en CD collecties
- Publieke en private verzamelingen
- Gedetailleerde album informatie

### Art Shop
- Album cover posters (standaard en metaal)
- Songtekst posters
- Album t-shirts en sokken
- Custom designs op basis van albums

### Content Platform
- Muziekverhalen en geschiedenis
- Artiesten biografie en verhalen
- Muziek anekdotes
- Nieuws en reviews

## Content Categorieën

### Artiesten & Muziek
- /artists - Database met artiesten
- /singles - Singles en releases overzicht
- /muziek-verhaal - Uitgebreide muziekverhalen
- /plaat-verhaal - Album verhalen en achtergronden
- /anekdotes - Muziek anekdotes en weetjes
- /nieuws - Muziek nieuws en updates
- /vandaag-in-de-muziekgeschiedenis - Dagelijkse muziekgeschiedenis

### Shop & Producten
- /art-shop - Overzicht van alle art producten
- /posters - Album cover posters
- /product/[slug] - Individuele product pagina's
- /lyric-posters - Songtekst posters

### Tools & Scanner
- /scanner - AI vinyl en CD scanner
- /public-catalog - Publieke collecties catalogus
- /collection/[username] - Persoonlijke collecties

## Primaire Doelgroep

- Vinyl verzamelaars en liefhebbers
- CD verzamelaars
- Muziekgeschiedenis enthousiastelingen
- Muziek art kopers
- Nederlandse en internationale gebruikers

## Talen

- Nederlands (primair)
- Engels (secundair)

## Contact & Links

- Website: https://www.musicscan.app
- Support: info@musicscan.app
- Sitemaps: https://www.musicscan.app/sitemap.xml

## Technologie

- AI-powered muziekherkenning
- Discogs integratie voor prijzen en data
- Real-time collectie synchronisatie
- E-commerce platform voor art producten

## Best Content voor LLM Indexatie

Prioriteit content voor LLM crawlers:
1. Artiesten database (/artists/*)
2. Muziekverhalen (/muziek-verhaal/*)
3. Album verhalen (/plaat-verhaal/*)
4. Anekdotes (/anekdotes/*)
5. Singles database (/singles/*)
6. Nieuws artikelen (/nieuws/*)

---

Last updated: 2025-01
Version: 1.0

## LLM-Optimized Sitemap

Voor een complete lijst van alle content in machine-readable formaat:
- Sitemap: https://www.musicscan.app/sitemap-llm.xml
- Bevat Markdown versies van alle content voor optimale LLM indexatie
`;
      
      return new Response(llmsContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // If not a crawler, redirect to main app (fallback safety)
    if (!isCrawler(userAgent)) {
      console.log('[SSR] Not a crawler, redirecting to app');
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${BASE_URL}${cleanPathname}`,
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Parse the path using cleanPathname (after prefix removal)
    const pathParts = cleanPathname.split('/').filter(Boolean);
    console.log(`[SSR] Path parts:`, pathParts);
    
    if (pathParts.length < 2) {
      console.error(`[SSR] Invalid path format: ${cleanPathname}`);
      throw new Error('Invalid path format');
    }

    const contentType = pathParts[pathParts.length - 2]; // 'plaat-verhaal', 'muziek-verhaal', 'product'
    const rawSlug = pathParts[pathParts.length - 1];
    const slug = normalizeSlug(rawSlug);
    
    console.log(`[SSR] Content type: ${contentType}, slug: ${slug}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // For blog posts, check if we need to redirect to canonical slug
    if (contentType === 'plaat-verhaal') {
      const canonicalSlug = await findCanonicalBlogSlug(supabaseClient, slug);
      if (canonicalSlug && canonicalSlug !== slug) {
        console.log(`[SSR] Redirecting ${slug} -> ${canonicalSlug}`);
        return new Response(null, {
          status: 301,
          headers: {
            ...corsHeaders,
            'Location': `${BASE_URL}/plaat-verhaal/${canonicalSlug}`,
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }
    }

    // Validate content type
    const validContentTypes = ['plaat-verhaal', 'muziek-verhaal', 'product', 'singles', 'artists', 'anekdotes', 'nieuws'];
    if (!validContentTypes.includes(contentType)) {
      console.error(`[SSR] Invalid content type: ${contentType}`);
      throw new Error(`Unknown content type: ${contentType}`);
    }

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

      case 'singles': {
        const { data: single, error } = await supabaseClient
          .from('music_stories')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .not('single_name', 'is', null)
          .single();

        if (error || !single) {
          throw new Error('Single not found');
        }

        const singleTitle = `${single.artist || ''} - ${single.single_name || single.title}`;
        const singleDesc = single.meta_description || single.story_content?.replace(/[#*\n]/g, ' ').trim().substring(0, 160) || '';
        const singleImage = single.artwork_url || `${BASE_URL}/placeholder.svg`;
        const singleContent = single.story_content?.replace(/<[^>]*>/g, '').replace(/[#*]/g, '').replace(/\n+/g, ' ').trim().substring(0, 500) || '';

        html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${singleTitle}: Het Verhaal achter de Hit | MusicScan</title>
  <meta name="description" content="${singleDesc}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="${singleTitle}">
  <meta property="og:description" content="${singleDesc}">
  <meta property="og:image" content="${singleImage}">
  <meta property="og:url" content="${BASE_URL}/singles/${slug}">
  <meta property="og:site_name" content="MusicScan">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${singleTitle}">
  <meta name="twitter:description" content="${singleDesc}">
  <meta name="twitter:image" content="${singleImage}">
  <link rel="canonical" href="${BASE_URL}/singles/${slug}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": "${singleTitle}",
    "description": "${singleDesc}",
    "image": "${singleImage}",
    "byArtist": { "@type": "MusicGroup", "name": "${single.artist || ''}" },
    "url": "${BASE_URL}/singles/${slug}"
  }
  </script>
  <style>body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; } img { max-width: 100%; border-radius: 8px; }</style>
</head>
<body>
  <article>
    <h1>${singleTitle}</h1>
    ${singleImage !== `${BASE_URL}/placeholder.svg` ? `<img src="${singleImage}" alt="${singleTitle}" loading="eager">` : ''}
    ${singleDesc ? `<p><strong>${singleDesc}</strong></p>` : ''}
    ${singleContent ? `<p>${singleContent}...</p>` : ''}
  </article>
</body>
</html>`;
        break;
      }

      case 'artists': {
        const { data: artist, error } = await supabaseClient
          .from('artist_stories')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !artist) {
          throw new Error('Artist not found');
        }

        const artistDesc = artist.meta_description || artist.biography || artist.story_content?.substring(0, 160) || '';
        const artistImage = artist.artwork_url || `${BASE_URL}/placeholder.svg`;
        const artistContent = artist.story_content?.replace(/<[^>]*>/g, '').replace(/[#*]/g, '').replace(/\n+/g, ' ').trim().substring(0, 500) || '';
        const artistGenres = artist.music_style?.join(', ') || '';

        html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artist.artist_name}: Biografie, Muziek & Verhaal | MusicScan</title>
  <meta name="description" content="${artistDesc}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${artist.artist_name}: Biografie & Carrièreverhaal">
  <meta property="og:description" content="${artistDesc}">
  <meta property="og:image" content="${artistImage}">
  <meta property="og:url" content="${BASE_URL}/artists/${slug}">
  <meta property="og:site_name" content="MusicScan">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${artist.artist_name}: Biografie & Carrièreverhaal">
  <meta name="twitter:description" content="${artistDesc}">
  <meta name="twitter:image" content="${artistImage}">
  <link rel="canonical" href="${BASE_URL}/artists/${slug}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "name": "${artist.artist_name}",
    "description": "${artistDesc}",
    "image": "${artistImage}",
    ${artistGenres ? `"genre": "${artistGenres}",` : ''}
    "url": "${BASE_URL}/artists/${slug}"
  }
  </script>
  <style>body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; } img { max-width: 100%; border-radius: 8px; }</style>
</head>
<body>
  <article>
    <h1>${artist.artist_name}</h1>
    ${artistImage !== `${BASE_URL}/placeholder.svg` ? `<img src="${artistImage}" alt="${artist.artist_name}" loading="eager">` : ''}
    ${artist.biography ? `<p><strong>${artist.biography}</strong></p>` : ''}
    ${artistContent ? `<p>${artistContent}...</p>` : ''}
  </article>
</body>
</html>`;
        break;
      }

      case 'anekdotes': {
        const { data: anecdote, error } = await supabaseClient
          .from('music_anecdotes')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !anecdote) {
          throw new Error('Anecdote not found');
        }

        const anecTitle = anecdote.title || 'Muziek Anekdote';
        const anecDesc = anecdote.meta_description || anecdote.content?.replace(/[#*\n]/g, ' ').trim().substring(0, 160) || '';
        const anecImage = anecdote.image_url || `${BASE_URL}/placeholder.svg`;
        const anecContent = anecdote.content?.replace(/<[^>]*>/g, '').replace(/[#*]/g, '').replace(/\n+/g, ' ').trim().substring(0, 500) || '';

        html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${anecTitle} | Muziek Anekdotes | MusicScan</title>
  <meta name="description" content="${anecDesc}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${anecTitle}">
  <meta property="og:description" content="${anecDesc}">
  <meta property="og:image" content="${anecImage}">
  <meta property="og:url" content="${BASE_URL}/anekdotes/${slug}">
  <meta property="og:site_name" content="MusicScan">
  <link rel="canonical" href="${BASE_URL}/anekdotes/${slug}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${anecTitle}",
    "description": "${anecDesc}",
    "image": "${anecImage}",
    "author": { "@type": "Organization", "name": "MusicScan" },
    "publisher": { "@type": "Organization", "name": "MusicScan" },
    "url": "${BASE_URL}/anekdotes/${slug}"
  }
  </script>
  <style>body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; } img { max-width: 100%; border-radius: 8px; }</style>
</head>
<body>
  <article>
    <h1>${anecTitle}</h1>
    ${anecImage !== `${BASE_URL}/placeholder.svg` ? `<img src="${anecImage}" alt="${anecTitle}" loading="eager">` : ''}
    ${anecDesc ? `<p><strong>${anecDesc}</strong></p>` : ''}
    ${anecContent ? `<p>${anecContent}...</p>` : ''}
  </article>
</body>
</html>`;
        break;
      }

      case 'nieuws': {
        const { data: news, error } = await supabaseClient
          .from('news_blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !news) {
          throw new Error('News article not found');
        }

        const newsTitle = news.title || 'Muzieknieuws';
        const newsDesc = news.meta_description || news.summary || news.content?.replace(/[#*\n]/g, ' ').trim().substring(0, 160) || '';
        const newsImage = news.featured_image || `${BASE_URL}/placeholder.svg`;
        const newsContent = news.content?.replace(/<[^>]*>/g, '').replace(/[#*]/g, '').replace(/\n+/g, ' ').trim().substring(0, 500) || '';

        html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${newsTitle} | Muzieknieuws | MusicScan</title>
  <meta name="description" content="${newsDesc}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${newsTitle}">
  <meta property="og:description" content="${newsDesc}">
  <meta property="og:image" content="${newsImage}">
  <meta property="og:url" content="${BASE_URL}/nieuws/${slug}">
  <meta property="og:site_name" content="MusicScan">
  <link rel="canonical" href="${BASE_URL}/nieuws/${slug}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${newsTitle}",
    "description": "${newsDesc}",
    "image": "${newsImage}",
    "author": { "@type": "Organization", "name": "MusicScan" },
    "publisher": { "@type": "Organization", "name": "MusicScan" },
    "datePublished": "${news.published_at || news.created_at}",
    "url": "${BASE_URL}/nieuws/${slug}"
  }
  </script>
  <style>body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; } img { max-width: 100%; border-radius: 8px; }</style>
</head>
<body>
  <article>
    <h1>${newsTitle}</h1>
    ${newsImage !== `${BASE_URL}/placeholder.svg` ? `<img src="${newsImage}" alt="${newsTitle}" loading="eager">` : ''}
    ${newsDesc ? `<p><strong>${newsDesc}</strong></p>` : ''}
    ${newsContent ? `<p>${newsContent}...</p>` : ''}
  </article>
</body>
</html>`;
        break;
      }

      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }

    // Return SEO-friendly HTML (canonical in HTML points to real URL)
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
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
