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

    // Fetch all published blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (blogError) {
      throw new Error(`Failed to fetch blog posts: ${blogError.message}`);
    }

    // Fetch all published music stories
    const { data: musicStories, error: storiesError } = await supabase
      .from('music_stories')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (storiesError) {
      throw new Error(`Failed to fetch music stories: ${storiesError.message}`);
    }

    console.log(`Found ${blogPosts?.length || 0} blog posts and ${musicStories?.length || 0} music stories`);

    // Generate blog sitemap XML
    const blogSitemapXml = generateSitemapXml(
      blogPosts || [],
      'https://www.musicscan.app/plaat-verhaal'
    );

    // Generate music stories sitemap XML
    const storiesSitemapXml = generateSitemapXml(
      musicStories || [],
      'https://www.musicscan.app/muziek-verhaal'
    );

    // Upload blog sitemap to storage
    const blogUpload = await supabase.storage
      .from('sitemaps')
      .upload('sitemap-blog.xml', new Blob([blogSitemapXml], { type: 'application/xml' }), {
        contentType: 'application/xml',
        upsert: true,
      });

    if (blogUpload.error) {
      console.error('Blog sitemap upload error:', blogUpload.error);
      throw new Error(`Failed to upload blog sitemap: ${blogUpload.error.message}`);
    }

    // Upload music stories sitemap to storage
    const storiesUpload = await supabase.storage
      .from('sitemaps')
      .upload('sitemap-music-stories.xml', new Blob([storiesSitemapXml], { type: 'application/xml' }), {
        contentType: 'application/xml',
        upsert: true,
      });

    if (storiesUpload.error) {
      console.error('Music stories sitemap upload error:', storiesUpload.error);
      throw new Error(`Failed to upload music stories sitemap: ${storiesUpload.error.message}`);
    }

    console.log('Sitemaps uploaded successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Static sitemaps generated successfully',
        stats: {
          blogPosts: blogPosts?.length || 0,
          musicStories: musicStories?.length || 0,
          blogSitemapUrl: `${supabaseUrl}/storage/v1/object/public/sitemaps/sitemap-blog.xml`,
          storiesSitemapUrl: `${supabaseUrl}/storage/v1/object/public/sitemaps/sitemap-music-stories.xml`,
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
