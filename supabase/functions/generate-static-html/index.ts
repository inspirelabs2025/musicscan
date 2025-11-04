import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateHTMLRequest {
  contentType: 'blog_post' | 'music_story' | 'product';
  slug: string;
  forceRegenerate?: boolean;
}

// Generate complete SEO-optimized HTML for a piece of content
function generateFullHTML(data: any, contentType: string): string {
  let title = '';
  let description = '';
  let image = '';
  let url = '';
  let content = '';
  let structuredData: any = {};

  if (contentType === 'blog_post') {
    const frontmatter = data.yaml_frontmatter || {};
    title = `${frontmatter.artist || 'Unknown Artist'} - ${frontmatter.album || data.slug} | MusicScan Plaatverhaal`;
    description = frontmatter.description || `Ontdek het verhaal achter ${frontmatter.album || 'dit album'} van ${frontmatter.artist || 'deze artiest'}.`;
    image = data.album_cover_url || frontmatter.image || 'https://www.musicscan.app/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png';
    url = `https://www.musicscan.app/plaat-verhaal/${data.slug}`;
    content = data.markdown_content || '';

    structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": image,
      "datePublished": data.published_at || data.created_at,
      "dateModified": data.updated_at || data.published_at || data.created_at,
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
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url
      }
    };

    if (frontmatter.artist && frontmatter.album) {
      structuredData["about"] = {
        "@type": "MusicAlbum",
        "name": frontmatter.album,
        "byArtist": {
          "@type": "MusicGroup",
          "name": frontmatter.artist
        }
      };
    }
  } else if (contentType === 'music_story') {
    title = `${data.title || data.slug} | MusicScan Muziekverhaal`;
    description = data.meta_description || data.story_content?.substring(0, 160) || 'Ontdek het verhaal achter deze muziek.';
    image = data.artwork_url || 'https://www.musicscan.app/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png';
    url = `https://www.musicscan.app/muziek-verhaal/${data.slug}`;
    content = data.story_content || '';

    structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": image,
      "datePublished": data.created_at,
      "dateModified": data.updated_at || data.created_at,
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
      }
    };
  } else if (contentType === 'product') {
    title = `${data.title} | MusicScan Shop`;
    description = data.description?.substring(0, 160) || `Koop ${data.title} bij MusicScan.`;
    image = data.primary_image || 'https://www.musicscan.app/lovable-uploads/cc6756c3-36dd-4665-a1c6-3acd9d23370e.png';
    url = `https://www.musicscan.app/product/${data.slug}`;
    content = data.description || '';

    structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": data.title,
      "description": description,
      "image": image,
      "offers": {
        "@type": "Offer",
        "price": data.price,
        "priceCurrency": "EUR",
        "availability": data.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    };
  }

  // Generate clean HTML content preview (first 500 chars)
  const contentPreview = content
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/\n+/g, ' ') // Replace newlines
    .trim()
    .substring(0, 500);

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  
  <!-- Canonical -->
  <link rel="canonical" href="${url}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="MusicScan">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
  </script>
  
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px;
      line-height: 1.6;
    }
    img { 
      max-width: 100%; 
      height: auto; 
      border-radius: 8px;
    }
    .content { 
      margin-top: 2rem;
    }
    .meta {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <article>
    <header>
      <h1>${title.split('|')[0].trim()}</h1>
      ${image ? `<img src="${image}" alt="${title.split('|')[0].trim()}" loading="eager">` : ''}
    </header>
    <div class="content">
      <p>${contentPreview}...</p>
    </div>
  </article>
  
  <!-- For browsers with JavaScript: redirect to full SPA -->
  <noscript>
    <p><a href="${url}">Klik hier voor de volledige ervaring</a></p>
  </noscript>
  
  <script>
    // Only redirect for browsers (not crawlers)
    if (navigator.userAgent.toLowerCase().indexOf('bot') === -1 &&
        navigator.userAgent.toLowerCase().indexOf('crawler') === -1 &&
        navigator.userAgent.toLowerCase().indexOf('spider') === -1) {
      window.location.href = "${url}";
    }
  </script>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, slug, forceRegenerate = false }: GenerateHTMLRequest = await req.json();

    console.log(`📄 Generating static HTML for ${contentType}: ${slug}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch content from appropriate table
    let data;
    let error;

    if (contentType === 'blog_post') {
      const result = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      data = result.data;
      error = result.error;
    } else if (contentType === 'music_story') {
      const result = await supabase
        .from('music_stories')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      data = result.data;
      error = result.error;
    } else if (contentType === 'product') {
      const result = await supabase
        .from('platform_products')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;
    if (!data) {
      return new Response(JSON.stringify({ error: 'Content not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate HTML
    const html = generateFullHTML(data, contentType);

    // Store HTML in storage bucket
    const fileName = `${contentType}/${slug}.html`;
    const { error: uploadError } = await supabase.storage
      .from('sitemaps')
      .upload(fileName, html, {
        contentType: 'text/html',
        upsert: true,
        cacheControl: '3600', // 1 hour cache
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log(`✅ Static HTML generated and stored: ${fileName}`);

    // Submit to IndexNow
    try {
      await supabase.rpc('submit_to_indexnow', {
        p_url: `/${contentType === 'blog_post' ? 'plaat-verhaal' : contentType === 'music_story' ? 'muziek-verhaal' : 'product'}/${slug}`,
        p_content_type: contentType,
      });
      console.log('📡 Submitted to IndexNow');
    } catch (indexNowError) {
      console.error('IndexNow submission failed (non-critical):', indexNowError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        url: `https://www.musicscan.app/${contentType === 'blog_post' ? 'plaat-verhaal' : contentType === 'music_story' ? 'muziek-verhaal' : 'product'}/${slug}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating static HTML:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
