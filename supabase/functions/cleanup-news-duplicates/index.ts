import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  id: string;
  slug: string;
  yaml_frontmatter: any;
  views_count: number;
  created_at: string;
  is_published: boolean;
}

interface DuplicateGroup {
  source_url?: string;
  keyword_signature: string;
  articles: NewsArticle[];
}

interface CleanupReport {
  total_articles: number;
  duplicate_groups: number;
  duplicates_found: number;
  duplicates_deleted: number;
  kept_articles: string[];
  deleted_articles: string[];
  errors: string[];
}

// Extract keywords from text
function extractKeywords(text: string): string[] {
  const commonWords = ['het', 'de', 'een', 'van', 'in', 'op', 'voor', 'met', 'door', 'aan', 'naar', 'over', 'bij', 'uit', 'als', 'zijn', 'dat', 'die', 'dit', 'en', 'of', 'maar', 'om', 'jaar', 'nieuwe', 'new'];
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !commonWords.includes(word));
  
  return [...new Set(words)].sort();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting news duplicate cleanup...');

    // Fetch all news articles
    const { data: articles, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, slug, yaml_frontmatter, views_count, created_at, is_published')
      .eq('album_type', 'news')
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'Geen nieuwsartikelen gevonden',
        report: {
          total_articles: 0,
          duplicate_groups: 0,
          duplicates_found: 0,
          duplicates_deleted: 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${articles.length} news articles`);

    const report: CleanupReport = {
      total_articles: articles.length,
      duplicate_groups: 0,
      duplicates_found: 0,
      duplicates_deleted: 0,
      kept_articles: [],
      deleted_articles: [],
      errors: []
    };

    // Group by source_url first
    const urlGroups = new Map<string, NewsArticle[]>();
    const noUrlArticles: NewsArticle[] = [];

    for (const article of articles) {
      const sourceUrl = article.yaml_frontmatter?.source_url;
      if (sourceUrl) {
        if (!urlGroups.has(sourceUrl)) {
          urlGroups.set(sourceUrl, []);
        }
        urlGroups.get(sourceUrl)!.push(article);
      } else {
        noUrlArticles.push(article);
      }
    }

    console.log(`Found ${urlGroups.size} unique source URLs and ${noUrlArticles.length} articles without URL`);

    // Process URL-based duplicates
    for (const [url, group] of urlGroups.entries()) {
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicates for URL: ${url}`);
        report.duplicate_groups++;
        report.duplicates_found += group.length - 1;

        // Sort: published first, then by views, then by oldest
        const sorted = group.sort((a, b) => {
          if (a.is_published !== b.is_published) return a.is_published ? -1 : 1;
          if (a.views_count !== b.views_count) return b.views_count - a.views_count;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const keep = sorted[0];
        const toDelete = sorted.slice(1);

        report.kept_articles.push(keep.slug);
        console.log(`Keeping: ${keep.slug} (published: ${keep.is_published}, views: ${keep.views_count})`);

        // Delete duplicates
        for (const article of toDelete) {
          try {
            const { error: deleteError } = await supabase
              .from('blog_posts')
              .delete()
              .eq('id', article.id);

            if (deleteError) {
              console.error(`Error deleting ${article.slug}:`, deleteError);
              report.errors.push(`Failed to delete ${article.slug}: ${deleteError.message}`);
            } else {
              report.deleted_articles.push(article.slug);
              report.duplicates_deleted++;
              console.log(`Deleted: ${article.slug}`);
            }
          } catch (error) {
            report.errors.push(`Exception deleting ${article.slug}: ${error.message}`);
          }
        }
      }
    }

    // Process keyword-based duplicates (voor artikelen zonder source_url)
    const keywordGroups = new Map<string, NewsArticle[]>();

    for (const article of noUrlArticles) {
      const title = article.yaml_frontmatter?.title || article.yaml_frontmatter?.original_title || '';
      const keywords = extractKeywords(title);
      
      if (keywords.length >= 2) {
        // Gebruik ALLE keywords (gesorteerd) als signature zodat varianten
        // met dezelfde woorden maar andere volgorde ook samenkomen
        const signature = keywords.join('|');
        
        if (!keywordGroups.has(signature)) {
          keywordGroups.set(signature, []);
        }
        keywordGroups.get(signature)!.push(article);
      }
    }

    console.log(`Found ${keywordGroups.size} potential keyword-based duplicate groups`);

    // Process keyword-based duplicates
    for (const [signature, group] of keywordGroups.entries()) {
      if (group.length > 1) {
        console.log(`Checking keyword group (${group.length} artikelen) signature: ${signature}`);
        
        // Verifieer dat er echt voldoende overlap is in keywords
        const baseKeywords = extractKeywords(group[0].yaml_frontmatter?.title || group[0].yaml_frontmatter?.original_title || '');
        const realDuplicates = group.filter(article => {
          const titleWords = extractKeywords(article.yaml_frontmatter?.title || article.yaml_frontmatter?.original_title || '');
          const matchCount = baseKeywords.filter(word => titleWords.includes(word)).length;
          return matchCount >= 2; // minimaal 2 gedeelde keywords
        });

        if (realDuplicates.length > 1) {
          console.log(`Found ${realDuplicates.length} keyword-based duplicates with signature: ${signature}`);
          report.duplicate_groups++;
          report.duplicates_found += realDuplicates.length - 1;

          // Sort: published first, then by views, then by oldest
          const sorted = realDuplicates.sort((a, b) => {
            if (a.is_published !== b.is_published) return a.is_published ? -1 : 1;
            if (a.views_count !== b.views_count) return b.views_count - a.views_count;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          const keep = sorted[0];
          const toDelete = sorted.slice(1);

          report.kept_articles.push(keep.slug);
          console.log(`Keeping: ${keep.slug}`);

          // Delete duplicates
          for (const article of toDelete) {
            try {
              const { error: deleteError } = await supabase
                .from('blog_posts')
                .delete()
                .eq('id', article.id);

              if (deleteError) {
                report.errors.push(`Failed to delete ${article.slug}: ${deleteError.message}`);
              } else {
                report.deleted_articles.push(article.slug);
                report.duplicates_deleted++;
                console.log(`Deleted: ${article.slug}`);
              }
            } catch (error) {
              report.errors.push(`Exception deleting ${article.slug}: ${error.message}`);
            }
          }
        }
      }
    }

    console.log('Cleanup completed:', report);

    return new Response(JSON.stringify({
      success: true,
      message: `Cleanup voltooid: ${report.duplicates_deleted} duplicaten verwijderd uit ${report.duplicate_groups} groepen`,
      report
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in cleanup-news-duplicates:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
