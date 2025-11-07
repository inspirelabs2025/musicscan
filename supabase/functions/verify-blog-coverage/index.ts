// Verify that all published blog posts appear in sitemap XMLs
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting blog coverage verification...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // 1. Fetch all published blog posts from database
    const { data: blogPosts, error: dbError } = await supabase
      .from('blog_posts')
      .select('slug, yaml_frontmatter')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (dbError) throw dbError;
    
    const dbSlugs = new Set(blogPosts?.map(p => p.slug) || []);
    console.log(`📚 Found ${dbSlugs.size} published blog posts in database`);
    
    // 2. Fetch all sitemap XMLs and extract URLs
    const sitemapUrls = [
      'https://musicscan.app/sitemaps/sitemap-blog-v3-part1.xml',
      'https://musicscan.app/sitemaps/sitemap-blog-v3-part2.xml',
      'https://musicscan.app/sitemaps/sitemap-blog-v3-part3.xml',
    ];
    
    const sitemapSlugs = new Set<string>();
    const fetchErrors: string[] = [];
    
    for (const url of sitemapUrls) {
      try {
        const response = await fetch(url + '?t=' + Date.now());
        if (!response.ok) {
          fetchErrors.push(`${url}: HTTP ${response.status}`);
          continue;
        }
        
        const xml = await response.text();
        
        // Extract all <loc> URLs and parse slugs
        const locMatches = xml.matchAll(/<loc>https:\/\/musicscan\.app\/plaat-verhaal\/([^<]+)<\/loc>/g);
        for (const match of locMatches) {
          sitemapSlugs.add(match[1]);
        }
        
        console.log(`✅ Processed ${url} - found ${sitemapSlugs.size} total slugs so far`);
      } catch (err) {
        fetchErrors.push(`${url}: ${err.message}`);
        console.error(`❌ Failed to fetch ${url}:`, err);
      }
    }
    
    console.log(`🗺️ Found ${sitemapSlugs.size} blog URLs in sitemaps`);
    
    // 3. Compare: which DB slugs are missing from sitemap?
    const missingInSitemap: string[] = [];
    const missingInSitemapDetails: Array<{slug: string, title: string, artist: string}> = [];
    
    for (const slug of dbSlugs) {
      if (!sitemapSlugs.has(slug)) {
        missingInSitemap.push(slug);
        const post = blogPosts?.find(p => p.slug === slug);
        if (post?.yaml_frontmatter) {
          const yaml = post.yaml_frontmatter as any;
          missingInSitemapDetails.push({
            slug,
            title: yaml.title || 'Unknown',
            artist: yaml.artist || 'Unknown'
          });
        }
      }
    }
    
    // 4. Compare: which sitemap slugs don't exist in DB?
    const missingInDb: string[] = [];
    for (const slug of sitemapSlugs) {
      if (!dbSlugs.has(slug)) {
        missingInDb.push(slug);
      }
    }
    
    const results = {
      summary: {
        dbTotal: dbSlugs.size,
        sitemapTotal: sitemapSlugs.size,
        missingInSitemapCount: missingInSitemap.length,
        missingInDbCount: missingInDb.length,
        coveragePercent: ((dbSlugs.size - missingInSitemap.length) / dbSlugs.size * 100).toFixed(2),
        allCovered: missingInSitemap.length === 0
      },
      missingInSitemap: missingInSitemapDetails.slice(0, 50), // First 50 missing
      missingInSitemapSample: missingInSitemap.slice(0, 20), // First 20 slugs
      missingInDbSample: missingInDb.slice(0, 20), // First 20 slugs
      fetchErrors,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Coverage verification complete:', results.summary);
    
    return new Response(
      JSON.stringify(results, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Coverage verification error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
