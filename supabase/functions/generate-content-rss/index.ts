import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://www.musicscan.app';

function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/^---[\s\S]*?---\n?/m, '') // Remove YAML frontmatter
    .replace(/#{1,6}\s?/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/>\s?/g, '') // Blockquotes
    .replace(/`([^`]+)`/g, '$1') // Code
    .replace(/\n{2,}/g, ' ') // Multiple newlines
    .trim()
    .substring(0, 500);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'blog_posts';
    const limitParam = parseInt(url.searchParams.get('limit') || '50');
    const limit = Math.min(Math.max(limitParam, 1), 100);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let items: any[] = [];
    let channelTitle = 'MusicScan';
    let channelDescription = 'Muziek content van MusicScan';
    let channelLink = SITE_URL;

    if (type === 'blog_posts') {
      channelTitle = 'MusicScan - Plaat Verhalen';
      channelDescription = 'De nieuwste album verhalen en recensies van MusicScan - Hét Muziekplatform voor verzamelaars';
      channelLink = `${SITE_URL}/plaat-verhalen`;

      const { data: blogs, error } = await supabase
        .from('blog_posts')
        .select('id, slug, album_cover_url, published_at, yaml_frontmatter, markdown_content')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
      }

      items = (blogs || []).map((blog: any) => {
        const frontmatter = blog.yaml_frontmatter || {};
        const artist = frontmatter.artist || 'Onbekend';
        const album = frontmatter.album || frontmatter.title || 'Onbekend';
        const title = `${artist} - ${album}`;
        const description = frontmatter.meta_description || stripMarkdown(blog.markdown_content);
        const genres = frontmatter.genre ? [frontmatter.genre] : [];
        const styles = frontmatter.styles || [];
        const categories = [...genres, ...styles].filter(Boolean).slice(0, 5);
        
        return {
          id: `blog_posts_${blog.id}`,
          title,
          link: `${SITE_URL}/plaat-verhaal/${blog.slug}`,
          description,
          pubDate: new Date(blog.published_at || Date.now()).toUTCString(),
          imageUrl: blog.album_cover_url,
          categories,
        };
      });
    }

    // Generate RSS XML
    const feedUrl = `${supabaseUrl}/functions/v1/generate-content-rss?type=${type}&limit=${limit}`;
    const lastBuildDate = new Date().toUTCString();

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>nl</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/og-image.png</url>
      <title>${escapeXml(channelTitle)}</title>
      <link>${escapeXml(channelLink)}</link>
    </image>
${items.map(item => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="false">${escapeXml(item.id)}</guid>
${item.categories.map((cat: string) => `      <category>${escapeXml(cat)}</category>`).join('\n')}
${item.imageUrl ? `      <media:content url="${escapeXml(item.imageUrl)}" medium="image" type="image/jpeg"/>
      <enclosure url="${escapeXml(item.imageUrl)}" length="0" type="image/jpeg"/>` : ''}
    </item>`).join('\n')}
  </channel>
</rss>`;

    console.log(`Generated RSS feed for ${type} with ${items.length} items`);

    return new Response(rssXml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
