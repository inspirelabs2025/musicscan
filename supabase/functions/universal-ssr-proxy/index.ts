import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.musicscan.app';
const LOGO_URL = `${BASE_URL}/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png`;

// Cache index.html in memory for the lifetime of the edge function instance
let cachedIndexHtml: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 300_000; // 5 minutes

const fetchIndexHtml = async (): Promise<string> => {
  const now = Date.now();
  if (cachedIndexHtml && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedIndexHtml;
  }
  console.log('[SSR] Fetching fresh index.html');
  const resp = await fetch(`${BASE_URL}/index.html`, {
    headers: { 'User-Agent': 'MusicScan-SSR-Proxy/1.0' }
  });
  if (!resp.ok) throw new Error(`Failed to fetch index.html: ${resp.status}`);
  cachedIndexHtml = await resp.text();
  cacheTimestamp = now;
  return cachedIndexHtml;
};

const normalizeSlug = (slug: string): string => slug.replace(/\/$/, '').trim();

const optimizeImageUrl = (url: string): string => {
  if (!url || url === LOGO_URL) return url;
  // Add Supabase Storage transform for optimal OG image size
  if (url.includes('supabase.co/storage')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=1200&height=630&resize=cover`;
  }
  // For Discogs images, use the URL as-is (already sized)
  return url;
};

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const stripMarkdown = (text: string): string =>
  text.replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/[#*>\-\[\]!`_~]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

const makeDescription = (text: string, maxLen = 155): string => {
  const clean = stripMarkdown(text);
  if (clean.length <= maxLen) return clean;
  return clean.substring(0, maxLen - 3) + '...';
};

// Find canonical slug for blog posts (handles year variants)
const findCanonicalBlogSlug = async (sb: any, requestedSlug: string): Promise<string | null> => {
  const m = requestedSlug.match(/^(.*)-((?:\d{4})|unknown)$/);
  const base = m ? m[1] : requestedSlug;

  const { data } = await sb.from('blog_posts').select('slug').eq('slug', requestedSlug).eq('is_published', true).maybeSingle();
  if (data) return data.slug;

  if (m && m[2] !== 'unknown') {
    const { data: d2 } = await sb.from('blog_posts').select('slug').eq('slug', `${base}-unknown`).eq('is_published', true).maybeSingle();
    if (d2) return d2.slug;
  }

  const { data: d3 } = await sb.from('blog_posts').select('slug').ilike('slug', `${base}-%`).eq('is_published', true).order('created_at', { ascending: false }).limit(1);
  if (d3?.length) return d3[0].slug;

  const { data: d4 } = await sb.from('blog_posts').select('slug').eq('slug', base).eq('is_published', true).maybeSingle();
  if (d4) return d4.slug;

  return null;
};

interface MetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  jsonLd?: string;
}

const injectMetaTags = (html: string, meta: MetaData): string => {
  let result = html;
  const ogImage = optimizeImageUrl(meta.image);
  const escapedImage = escapeHtml(ogImage);

  // Replace <title>
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`);

  // Replace meta description
  result = result.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(meta.description)}">`
  );

  // Replace OG tags
  result = result.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(meta.title)}">`);
  result = result.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(meta.description)}">`);
  result = result.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${escapedImage}">`);
  result = result.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${escapeHtml(meta.url)}">`);
  result = result.replace(/<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${escapeHtml(meta.type)}">`);

  // Inject og:image dimensions and type after og:image
  const ogImageDimensions = `<meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">\n    <meta property="og:image:type" content="image/jpeg">`;
  result = result.replace(
    /(<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>)/,
    `$1\n    ${ogImageDimensions}`
  );

  // Replace Twitter tags
  result = result.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(meta.title)}">`);
  result = result.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`);
  result = result.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${escapedImage}">`);
  result = result.replace(/<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/, `<meta name="twitter:url" content="${escapeHtml(meta.url)}">`);

  // Replace canonical URL
  result = result.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${escapeHtml(meta.url)}">`);

  // Replace hreflang tags
  result = result.replace(/<link\s+rel="alternate"\s+hreflang="nl"\s+href="[^"]*"\s*\/?>/, `<link rel="alternate" hreflang="nl" href="${escapeHtml(meta.url)}">`);
  result = result.replace(/<link\s+rel="alternate"\s+hreflang="x-default"\s+href="[^"]*"\s*\/?>/, `<link rel="alternate" hreflang="x-default" href="${escapeHtml(meta.url)}">`);

  // Inject page-specific JSON-LD before closing </head> (keep the existing Organization schema)
  if (meta.jsonLd) {
    result = result.replace('</head>', `<script type="application/ld+json">${meta.jsonLd}</script>\n</head>`);
  }

  return result;
};

const getMetaForContent = async (sb: any, contentType: string, slug: string): Promise<MetaData | null> => {
  switch (contentType) {
    case 'plaat-verhaal': {
      const { data: blog } = await sb.from('blog_posts').select('slug, yaml_frontmatter, markdown_content, album_cover_url, published_at, created_at, updated_at').eq('slug', slug).eq('is_published', true).maybeSingle();
      if (!blog) return null;
      const fm = blog.yaml_frontmatter || {};
      const artist = fm.artist || '';
      const album = fm.album || '';
      const title = artist && album ? `${artist} - ${album} | Het verhaal achter de plaat | MusicScan` : (fm.title || 'Album Verhaal | MusicScan');
      const desc = fm.description || (blog.markdown_content ? makeDescription(blog.markdown_content) : '');
      const image = blog.album_cover_url || fm.image || LOGO_URL;
      return {
        title, description: desc, image: image.startsWith('http') ? image : `${BASE_URL}${image}`,
        url: `${BASE_URL}/plaat-verhaal/${slug}`, type: 'article',
        jsonLd: JSON.stringify({
          "@context": "https://schema.org", "@type": "Article",
          "headline": title, "description": desc,
          "image": image.startsWith('http') ? image : `${BASE_URL}${image}`,
          "author": { "@type": "Organization", "name": "MusicScan" },
          "publisher": { "@type": "Organization", "name": "MusicScan", "logo": { "@type": "ImageObject", "url": LOGO_URL } },
          "datePublished": blog.published_at || blog.created_at,
          "dateModified": blog.updated_at || blog.published_at || blog.created_at,
          "mainEntityOfPage": `${BASE_URL}/plaat-verhaal/${slug}`
        })
      };
    }

    case 'muziek-verhaal': {
      // First try music_stories without single_name filter (matches client-side useMuziekVerhaal hook)
      let { data: story } = await sb.from('music_stories').select('slug, title, story_content, artwork_url, meta_description, meta_title, artist, published_at, created_at, updated_at').eq('slug', slug).eq('is_published', true).maybeSingle();
      if (!story) {
        console.log(`[SSR] muziek-verhaal: No music_story found for slug "${slug}", trying blog_posts...`);
        // Fallback: check blog_posts table (plaat-verhaal content)
        const { data: blog } = await sb.from('blog_posts').select('slug, yaml_frontmatter, markdown_content, album_cover_url, published_at, created_at, updated_at').eq('slug', slug).eq('is_published', true).maybeSingle();
        if (blog) {
          console.log(`[SSR] muziek-verhaal: Found in blog_posts, redirecting to plaat-verhaal`);
          return {
            title: `${(blog.yaml_frontmatter as any)?.artist || ''} - ${(blog.yaml_frontmatter as any)?.album || 'Verhaal'} | Het verhaal achter de plaat | MusicScan`,
            description: (blog.yaml_frontmatter as any)?.meta_description || (blog.markdown_content ? makeDescription(blog.markdown_content) : ''),
            image: blog.album_cover_url || LOGO_URL,
            url: `${BASE_URL}/muziek-verhaal/${slug}`, type: 'article'
          };
        }
        console.log(`[SSR] muziek-verhaal: slug "${slug}" not found in any table`);
        return null;
      }
      const title = story.meta_title || story.title || 'Muziekverhaal | MusicScan';
      const desc = story.meta_description || (story.story_content ? makeDescription(story.story_content) : '');
      const image = story.artwork_url || LOGO_URL;
      return {
        title: `${title} | MusicScan`, description: desc, image, url: `${BASE_URL}/muziek-verhaal/${slug}`, type: 'article',
        jsonLd: JSON.stringify({
          "@context": "https://schema.org", "@type": "Article",
          "headline": title, "description": desc, "image": image,
          "author": { "@type": "Organization", "name": "MusicScan" },
          "publisher": { "@type": "Organization", "name": "MusicScan", "logo": { "@type": "ImageObject", "url": LOGO_URL } },
          "datePublished": story.published_at || story.created_at,
          "mainEntityOfPage": `${BASE_URL}/muziek-verhaal/${slug}`
        })
      };
    }

    case 'singles': {
      const { data: single } = await sb.from('music_stories').select('slug, title, single_name, artist, story_content, artwork_url, meta_description, meta_title, year, genre, created_at').eq('slug', slug).eq('is_published', true).not('single_name', 'is', null).maybeSingle();
      if (!single) return null;
      const singleTitle = `${single.artist || ''} - ${single.single_name || single.title}`;
      const desc = single.meta_description || (single.story_content ? makeDescription(single.story_content) : '');
      const image = single.artwork_url || LOGO_URL;
      return {
        title: `${singleTitle} | Het verhaal achter de hit | MusicScan`, description: desc, image,
        url: `${BASE_URL}/singles/${slug}`, type: 'music.song',
        jsonLd: JSON.stringify({
          "@context": "https://schema.org", "@type": "MusicRecording",
          "name": singleTitle, "description": desc, "image": image,
          "byArtist": { "@type": "MusicGroup", "name": single.artist || '' },
          "url": `${BASE_URL}/singles/${slug}`
        })
      };
    }

    case 'artists': {
      const { data: artist } = await sb.from('artist_stories').select('slug, artist_name, biography, story_content, artwork_url, meta_description, meta_title, music_style, created_at').eq('slug', slug).eq('is_published', true).maybeSingle();
      if (!artist) return null;
      const desc = artist.meta_description || artist.biography || (artist.story_content ? makeDescription(artist.story_content) : '');
      const image = artist.artwork_url || LOGO_URL;
      return {
        title: `${artist.artist_name}: Biografie, Muziek & Verhaal | MusicScan`, description: desc, image,
        url: `${BASE_URL}/artists/${slug}`, type: 'article',
        jsonLd: JSON.stringify({
          "@context": "https://schema.org", "@type": "MusicGroup",
          "name": artist.artist_name, "description": desc, "image": image,
          ...(artist.music_style?.length ? { "genre": artist.music_style.join(', ') } : {}),
          "url": `${BASE_URL}/artists/${slug}`
        })
      };
    }

    case 'artist-spotlight': {
      const { data: artist } = await sb.from('artist_stories').select('slug, artist_name, biography, story_content, artwork_url, meta_description, meta_title, music_style, created_at').eq('slug', slug).eq('is_published', true).maybeSingle();
      if (!artist) return null;
      const desc = artist.meta_description || artist.biography || (artist.story_content ? makeDescription(artist.story_content) : '');
      const image = artist.artwork_url || LOGO_URL;
      return {
        title: `${artist.artist_name}: Spotlight & Carrièreverhaal | MusicScan`, description: desc, image,
        url: `${BASE_URL}/artist-spotlight/${slug}`, type: 'article',
        jsonLd: JSON.stringify({
          "@context": "https://schema.org", "@type": "MusicGroup",
          "name": artist.artist_name, "description": desc, "image": image,
          "url": `${BASE_URL}/artist-spotlight/${slug}`
        })
      };
    }

    case 'product': {
      const { data: product } = await sb.from('platform_products').select('slug, title, artist, description, primary_image, price, stock_quantity, id, category').eq('slug', slug).eq('status', 'active').maybeSingle();
      if (!product) return null;
      const desc = product.description || `Bestel ${product.title} als premium muziekproduct bij MusicScan.`;
      const image = product.primary_image || LOGO_URL;
      return {
        title: `${product.title} | MusicScan Shop`, description: makeDescription(desc), image,
        url: `${BASE_URL}/product/${slug}`, type: 'product',
        jsonLd: JSON.stringify({
          "@context": "https://schema.org", "@type": "Product",
          "name": product.title, "description": desc, "image": image,
          "sku": product.id || product.slug,
          "brand": { "@type": "Brand", "name": product.artist || 'MusicScan' },
          "offers": {
            "@type": "Offer", "url": `${BASE_URL}/product/${slug}`,
            "priceCurrency": "EUR", "price": String(product.price || 0),
            "itemCondition": "https://schema.org/NewCondition",
            "availability": (product.stock_quantity ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": { "@type": "Organization", "name": "MusicScan" }
          }
        })
      };
    }

    case 'anekdotes': {
      const { data: anec } = await sb.from('music_anecdotes').select('slug, title, content, image_url, meta_description, created_at').eq('slug', slug).eq('is_published', true).maybeSingle();
      if (!anec) return null;
      const title = anec.title || 'Muziek Anekdote';
      const desc = anec.meta_description || (anec.content ? makeDescription(anec.content) : '');
      const image = anec.image_url || LOGO_URL;
      return {
        title: `${title} | Muziek Anekdotes | MusicScan`, description: desc, image,
        url: `${BASE_URL}/anekdotes/${slug}`, type: 'article',
        jsonLd: JSON.stringify({
          "@context": "https://schema.org", "@type": "Article",
          "headline": title, "description": desc, "image": image,
          "author": { "@type": "Organization", "name": "MusicScan" },
          "publisher": { "@type": "Organization", "name": "MusicScan" },
          "url": `${BASE_URL}/anekdotes/${slug}`
        })
      };
    }

    case 'nieuws': {
      const { data: news } = await sb.from('news_blog_posts').select('slug, title, summary, content, featured_image, meta_description, published_at, created_at').eq('slug', slug).eq('is_published', true).maybeSingle();
      if (!news) return null;
      const title = news.title || 'Muzieknieuws';
      const desc = news.meta_description || news.summary || (news.content ? makeDescription(news.content) : '');
      const image = news.featured_image || LOGO_URL;
      return {
        title: `${title} | Muzieknieuws | MusicScan`, description: desc, image,
        url: `${BASE_URL}/nieuws/${slug}`, type: 'article',
        jsonLd: JSON.stringify({
          "@context": "https://schema.org", "@type": "NewsArticle",
          "headline": title, "description": desc, "image": image,
          "author": { "@type": "Organization", "name": "MusicScan" },
          "publisher": { "@type": "Organization", "name": "MusicScan" },
          "datePublished": news.published_at || news.created_at,
          "url": `${BASE_URL}/nieuws/${slug}`
        })
      };
    }

    case 'new-release': {
      const { data: release } = await sb.from('spotify_new_releases_processed').select('slug, title, artist_name, description, cover_image_url, created_at').eq('slug', slug).maybeSingle();
      if (!release) return null;
      const title = `${release.artist_name || ''} - ${release.title || 'Nieuwe Release'}`;
      const desc = release.description || `Ontdek ${title} op MusicScan.`;
      const image = release.cover_image_url || LOGO_URL;
      return {
        title: `${title} | Nieuwe Release | MusicScan`, description: makeDescription(desc), image,
        url: `${BASE_URL}/new-release/${slug}`, type: 'music.album',
        jsonLd: JSON.stringify({
          "@context": "https://schema.org", "@type": "MusicAlbum",
          "name": release.title, "byArtist": { "@type": "MusicGroup", "name": release.artist_name || '' },
          "image": image, "url": `${BASE_URL}/new-release/${slug}`
        })
      };
    }

    case 'nummer': {
      // nummer pages use music_stories like singles
      const { data: single } = await sb.from('music_stories').select('slug, title, single_name, artist, story_content, artwork_url, meta_description').eq('slug', slug).eq('is_published', true).maybeSingle();
      if (!single) return null;
      const singleTitle = `${single.artist || ''} - ${single.single_name || single.title || ''}`;
      const desc = single.meta_description || (single.story_content ? makeDescription(single.story_content) : '');
      const image = single.artwork_url || LOGO_URL;
      return {
        title: `${singleTitle} | MusicScan`, description: desc, image,
        url: `${BASE_URL}/nummer/${slug}`, type: 'music.song'
      };
    }

    default:
      return null;
  }
};

// ==================== STATIC CONTENT HANDLERS ====================

const LLMS_TXT_CONTENT = `# MusicScan - Het Complete Muziekplatform

> MusicScan is hét Nederlandse muziekplatform voor liefhebbers. Ontdek verhalen achter albums,
> scan je vinyl & CD collectie, shop unieke muziekproducten en test je kennis met de quiz.

## Content Categorieën
- /artists - Artiesten biografieën
- /singles - Singles verhalen
- /muziek-verhaal - Muziekverhalen
- /plaat-verhaal - Album verhalen
- /anekdotes - Muziek anekdotes
- /nieuws - Muzieknieuws
- /vandaag-in-de-muziekgeschiedenis - Dagelijkse muziekgeschiedenis
- /shop - Muziekproducten

## Sitemaps
- https://www.musicscan.app/sitemap.xml
- https://www.musicscan.app/sitemap-llm.xml

Last updated: 2026-03
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';

    // Strip proxy prefixes
    let cleanPath = url.pathname
      .replace(/^\/functions\/v1\/universal-ssr-proxy/, '')
      .replace(/^\/universal-ssr-proxy/, '');

    // Also check query param fallback
    if ((!cleanPath || cleanPath === '/') && url.searchParams.has('path')) {
      cleanPath = '/' + url.searchParams.get('path')!;
    }

    console.log(`[SSR] Request: ${url.pathname} -> clean: ${cleanPath}, UA: ${userAgent.substring(0, 80)}`);

    // Handle static content routes
    if (cleanPath === '/sitemap-llm.xml') {
      const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-llm-sitemap`, {
        headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` }
      });
      const body = await resp.text();
      return new Response(body, {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
    }

    if (cleanPath === '/.well-known/llms.txt' || cleanPath === '/llms.txt') {
      return new Response(LLMS_TXT_CONTENT, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
    }

    // Parse content path: /{contentType}/{slug}
    const pathParts = cleanPath.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      // Not a content page, return index.html as-is
      const indexHtml = await fetchIndexHtml();
      return new Response(indexHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' }
      });
    }

    const contentType = pathParts[0];
    const slug = normalizeSlug(pathParts.slice(1).join('/'));

    console.log(`[SSR] Content type: ${contentType}, slug: ${slug}`);

    // Initialize Supabase
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Handle canonical blog slug redirects
    if (contentType === 'plaat-verhaal') {
      const canonicalSlug = await findCanonicalBlogSlug(sb, slug);
      if (canonicalSlug && canonicalSlug !== slug) {
        return new Response(null, {
          status: 301,
          headers: { ...corsHeaders, 'Location': `${BASE_URL}/plaat-verhaal/${canonicalSlug}`, 'Cache-Control': 'public, max-age=86400' }
        });
      }
    }

    // Fetch meta data for this content
    const meta = await getMetaForContent(sb, contentType, slug);

    if (!meta) {
      console.log(`[SSR] No content found for ${contentType}/${slug}, serving plain index.html`);
      const indexHtml = await fetchIndexHtml();
      return new Response(indexHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' }
      });
    }

    // Fetch index.html and inject dynamic meta tags
    const indexHtml = await fetchIndexHtml();
    const injectedHtml = injectMetaTags(indexHtml, meta);

    console.log(`[SSR] Serving injected HTML for ${contentType}/${slug}: ${meta.title.substring(0, 60)}`);

    return new Response(injectedHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      }
    });

  } catch (error) {
    console.error('[SSR] Error:', error);
    // On error, try to serve plain index.html
    try {
      const indexHtml = await fetchIndexHtml();
      return new Response(indexHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      });
    } catch {
      return new Response('Server Error', { status: 500, headers: corsHeaders });
    }
  }
});
