import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.musicscan.app';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

const generateSitemapXML = (urls: SitemapUrl[]): string => {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- LLM-Optimized Content Sitemap -->
  <!-- This sitemap contains Markdown versions of content specifically formatted for LLM crawlers -->
  ${urlEntries}
</urlset>`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Log start of execution
  let logId: string | null = null;
  try {
    const { data: logData } = await supabaseClient.rpc('log_cronjob_start', {
      p_function_name: 'generate-llm-sitemap',
      p_metadata: { triggered_at: new Date().toISOString() }
    });
    logId = logData;
    console.log('[LLM-Sitemap] Started execution, log ID:', logId);
  } catch (logError) {
    console.warn('[LLM-Sitemap] Could not log start:', logError);
  }

  try {
    console.log('[LLM-Sitemap] Generating LLM-optimized sitemap...');

    const urls: SitemapUrl[] = [];
    
    const now = new Date().toISOString();
    console.log(`[LLM-Sitemap] Generation started at: ${now}`);

    // Add llms.txt discovery file
    urls.push({
      loc: `${BASE_URL}/.well-known/llms.txt`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '1.0'
    });

    // Fetch published blog posts (plaat-verhaal)
    const { data: blogs, error: blogsError } = await supabaseClient
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (!blogsError && blogs) {
      console.log(`[LLM-Sitemap] Found ${blogs.length} blog posts`);
      blogs.forEach(blog => {
        urls.push({
          loc: `${BASE_URL}/api/llm/plaat-verhaal/${blog.slug}.md`,
          lastmod: new Date(blog.updated_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.9'
        });
      });
    }

    // Fetch published music stories (muziek-verhaal)
    const { data: stories, error: storiesError } = await supabaseClient
      .from('music_stories')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (!storiesError && stories) {
      console.log(`[LLM-Sitemap] Found ${stories.length} music stories`);
      stories.forEach(story => {
        urls.push({
          loc: `${BASE_URL}/api/llm/muziek-verhaal/${story.slug}.md`,
          lastmod: new Date(story.updated_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.9'
        });
      });
    }

    // Fetch published artist stories
    const { data: artists, error: artistsError } = await supabaseClient
      .from('artist_stories')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (!artistsError && artists) {
      console.log(`[LLM-Sitemap] Found ${artists.length} artist stories`);
      artists.forEach(artist => {
        urls.push({
          loc: `${BASE_URL}/api/llm/artists/${artist.slug}.md`,
          lastmod: new Date(artist.updated_at).toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: '0.8'
        });
      });
    }

    // Fetch published anecdotes
    const { data: anecdotes, error: anecdotesError } = await supabaseClient
      .from('music_anecdotes')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1000);

    if (!anecdotesError && anecdotes) {
      console.log(`[LLM-Sitemap] Found ${anecdotes.length} anecdotes`);
      anecdotes.forEach(anecdote => {
        urls.push({
          loc: `${BASE_URL}/api/llm/anekdotes/${anecdote.slug}.md`,
          lastmod: new Date(anecdote.updated_at).toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: '0.7'
        });
      });
    }

    console.log(`[LLM-Sitemap] Generated sitemap with ${urls.length} URLs`);
    console.log(`[LLM-Sitemap] Stats: ${blogs?.length || 0} blogs, ${stories?.length || 0} stories, ${artists?.length || 0} artists, ${anecdotes?.length || 0} anecdotes`);

    const sitemapXML = generateSitemapXML(urls);

    // Store generation timestamp for monitoring
    const generationTime = new Date().toISOString();
    const executionTimeMs = Date.now() - startTime;
    console.log(`[LLM-Sitemap] Completed at: ${generationTime} (${executionTimeMs}ms)`);

    // Log successful completion
    if (logId) {
      try {
        await supabaseClient.rpc('log_cronjob_complete', {
          p_log_id: logId,
          p_status: 'success',
          p_items_processed: urls.length,
          p_metadata: {
            blogs: blogs?.length || 0,
            stories: stories?.length || 0,
            artists: artists?.length || 0,
            anecdotes: anecdotes?.length || 0,
            total_urls: urls.length
          }
        });
        console.log('[LLM-Sitemap] Logged successful completion');
      } catch (logError) {
        console.warn('[LLM-Sitemap] Could not log completion:', logError);
      }
    }

    return new Response(sitemapXML, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Generated-At': generationTime,
        'X-Total-URLs': urls.length.toString()
      }
    });

  } catch (error) {
    console.error('[LLM-Sitemap] Error:', error);
    
    // Log error
    if (logId) {
      try {
        await supabaseClient.rpc('log_cronjob_complete', {
          p_log_id: logId,
          p_status: 'error',
          p_items_processed: 0,
          p_error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        console.warn('[LLM-Sitemap] Could not log error:', logError);
      }
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
