import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.musicscan.app';
const MIN_CONTENT_LENGTH = 500;
const BATCH_SIZE = 50;

interface SeoIssue {
  url: string;
  content_type: string;
  item_id: string;
  issues: string[];
  content_length: number;
  has_image: boolean;
  has_meta: boolean;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[SEO Scanner] Starting automatic SEO quality scan...');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const issues: SeoIssue[] = [];
    const urlsToReindex: string[] = [];
    let totalScanned = 0;

    // 1. Scan blog_posts (plaat-verhaal)
    console.log('[SEO Scanner] Scanning blog_posts...');
    const { data: blogs } = await supabase
      .from('blog_posts')
      .select('id, slug, markdown_content, album_cover_url, yaml_frontmatter, is_published, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(500);

    if (blogs) {
      for (const blog of blogs) {
        totalScanned++;
        const url = `${BASE_URL}/plaat-verhaal/${blog.slug}`;
        const contentLength = blog.markdown_content?.length || 0;
        const hasImage = !!blog.album_cover_url;
        const hasMeta = !!(blog.yaml_frontmatter as any)?.description;
        const itemIssues: string[] = [];

        if (contentLength < MIN_CONTENT_LENGTH) itemIssues.push('thin_content');
        if (!hasImage) itemIssues.push('no_image');
        if (!hasMeta) itemIssues.push('no_meta_description');

        if (itemIssues.length > 0) {
          issues.push({
            url,
            content_type: 'blog_post',
            item_id: blog.id,
            issues: itemIssues,
            content_length: contentLength,
            has_image: hasImage,
            has_meta: hasMeta,
            created_at: blog.created_at
          });
        }
        
        // Add all published blogs to reindex queue
        urlsToReindex.push(url);
      }
    }

    // 2. Scan platform_products
    console.log('[SEO Scanner] Scanning platform_products...');
    const { data: products } = await supabase
      .from('platform_products')
      .select('id, slug, description, image_url, meta_description, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(500);

    if (products) {
      for (const product of products) {
        totalScanned++;
        const url = `${BASE_URL}/product/${product.slug}`;
        const contentLength = product.description?.length || 0;
        const hasImage = !!product.image_url;
        const hasMeta = !!product.meta_description;
        const itemIssues: string[] = [];

        if (contentLength < 100) itemIssues.push('thin_content');
        if (!hasImage) itemIssues.push('no_image');
        if (!hasMeta) itemIssues.push('no_meta_description');

        if (itemIssues.length > 0) {
          issues.push({
            url,
            content_type: 'product',
            item_id: product.id,
            issues: itemIssues,
            content_length: contentLength,
            has_image: hasImage,
            has_meta: hasMeta,
            created_at: product.created_at
          });
        }
        
        urlsToReindex.push(url);
      }
    }

    // 3. Scan artist_stories
    console.log('[SEO Scanner] Scanning artist_stories...');
    const { data: artists } = await supabase
      .from('artist_stories')
      .select('id, slug, story_content, artwork_url, meta_description, is_published, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(500);

    if (artists) {
      for (const artist of artists) {
        totalScanned++;
        const url = `${BASE_URL}/artists/${artist.slug}`;
        const contentLength = artist.story_content?.length || 0;
        const hasImage = !!artist.artwork_url;
        const hasMeta = !!artist.meta_description;
        const itemIssues: string[] = [];

        if (contentLength < MIN_CONTENT_LENGTH) itemIssues.push('thin_content');
        if (!hasImage) itemIssues.push('no_image');
        if (!hasMeta) itemIssues.push('no_meta_description');

        if (itemIssues.length > 0) {
          issues.push({
            url,
            content_type: 'artist_story',
            item_id: artist.id,
            issues: itemIssues,
            content_length: contentLength,
            has_image: hasImage,
            has_meta: hasMeta,
            created_at: artist.created_at
          });
        }
        
        urlsToReindex.push(url);
      }
    }

    // 4. Scan music_stories (singles)
    console.log('[SEO Scanner] Scanning music_stories (singles)...');
    const { data: singles } = await supabase
      .from('music_stories')
      .select('id, slug, content, artwork_url, meta_description, is_published, created_at')
      .eq('is_published', true)
      .not('single_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (singles) {
      for (const single of singles) {
        totalScanned++;
        const url = `${BASE_URL}/singles/${single.slug}`;
        const contentLength = single.content?.length || 0;
        const hasImage = !!single.artwork_url;
        const hasMeta = !!single.meta_description;
        const itemIssues: string[] = [];

        if (contentLength < MIN_CONTENT_LENGTH) itemIssues.push('thin_content');
        if (!hasImage) itemIssues.push('no_image');
        if (!hasMeta) itemIssues.push('no_meta_description');

        if (itemIssues.length > 0) {
          issues.push({
            url,
            content_type: 'single',
            item_id: single.id,
            issues: itemIssues,
            content_length: contentLength,
            has_image: hasImage,
            has_meta: hasMeta,
            created_at: single.created_at
          });
        }
        
        urlsToReindex.push(url);
      }
    }

    // 5. Scan music_anecdotes
    console.log('[SEO Scanner] Scanning music_anecdotes...');
    const { data: anecdotes } = await supabase
      .from('music_anecdotes')
      .select('id, slug, content, image_url, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(500);

    if (anecdotes) {
      for (const anecdote of anecdotes) {
        totalScanned++;
        const url = `${BASE_URL}/anekdotes/${anecdote.slug}`;
        const contentLength = anecdote.content?.length || 0;
        const hasImage = !!anecdote.image_url;
        const itemIssues: string[] = [];

        if (contentLength < 200) itemIssues.push('thin_content');
        if (!hasImage) itemIssues.push('no_image');

        if (itemIssues.length > 0) {
          issues.push({
            url,
            content_type: 'anecdote',
            item_id: anecdote.id,
            issues: itemIssues,
            content_length: contentLength,
            has_image: hasImage,
            has_meta: true,
            created_at: anecdote.created_at
          });
        }
        
        urlsToReindex.push(url);
      }
    }

    console.log(`[SEO Scanner] Scanned ${totalScanned} items, found ${issues.length} with issues`);

    // Store issues in database for tracking
    if (issues.length > 0) {
      // Upsert issues to seo_quality_issues table
      const { error: upsertError } = await supabase
        .from('seo_quality_issues')
        .upsert(
          issues.map(issue => ({
            url: issue.url,
            content_type: issue.content_type,
            item_id: issue.item_id,
            issues: issue.issues,
            content_length: issue.content_length,
            has_image: issue.has_image,
            has_meta: issue.has_meta,
            scanned_at: new Date().toISOString()
          })),
          { onConflict: 'url' }
        );

      if (upsertError) {
        console.error('[SEO Scanner] Error storing issues:', upsertError);
      }
    }

    // Submit URLs to IndexNow in batches
    console.log(`[SEO Scanner] Submitting ${urlsToReindex.length} URLs to IndexNow...`);
    let submittedCount = 0;

    for (let i = 0; i < urlsToReindex.length; i += BATCH_SIZE) {
      const batch = urlsToReindex.slice(i, i + BATCH_SIZE);
      
      try {
        const { error } = await supabase.functions.invoke('indexnow-submit', {
          body: { urls: batch, contentType: 'auto-seo-scan' }
        });
        
        if (!error) {
          submittedCount += batch.length;
        } else {
          console.error(`[SEO Scanner] IndexNow batch error:`, error);
        }
        
        // Small delay between batches to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[SEO Scanner] IndexNow submission error:`, err);
      }
    }

    // Log execution
    const executionTime = Date.now() - startTime;
    await supabase.from('cronjob_execution_log').insert({
      function_name: 'auto-seo-quality-scanner',
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      items_processed: totalScanned,
      metadata: {
        issues_found: issues.length,
        urls_submitted: submittedCount,
        issue_breakdown: {
          thin_content: issues.filter(i => i.issues.includes('thin_content')).length,
          no_image: issues.filter(i => i.issues.includes('no_image')).length,
          no_meta: issues.filter(i => i.issues.includes('no_meta_description')).length
        }
      }
    });

    console.log(`[SEO Scanner] ✅ Completed in ${executionTime}ms`);
    console.log(`[SEO Scanner] - Scanned: ${totalScanned}`);
    console.log(`[SEO Scanner] - Issues found: ${issues.length}`);
    console.log(`[SEO Scanner] - URLs submitted to IndexNow: ${submittedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        scanned: totalScanned,
        issues_found: issues.length,
        urls_submitted: submittedCount,
        execution_time_ms: executionTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SEO Scanner] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
