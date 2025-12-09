import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const discogsToken = Deno.env.get('DISCOGS_TOKEN');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper function to validate meaningful names
function isMeaningfulName(v?: string): boolean {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  if (!s) return false;
  const bad = ['unknown', 'unknown artist', 'unknown album', 'onbekend', 'onbekende', 'untitled', '—', '-'];
  return !bad.includes(s);
}

// Parse year from various formats
function parseYear(value?: string | number): number | null {
  if (!value) return null;
  const str = String(value);
  const match = str.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

// Fetch Discogs data from URL
async function getDiscogsFromUrl(url: string): Promise<any> {
  if (!discogsToken) return null;
  
  const releaseMatch = url.match(/release\/(\d+)/);
  const masterMatch = url.match(/master\/(\d+)/);
  
  let endpoint = '';
  let type = '';
  
  if (releaseMatch) {
    endpoint = `https://api.discogs.com/releases/${releaseMatch[1]}`;
    type = 'release';
  } else if (masterMatch) {
    endpoint = `https://api.discogs.com/masters/${masterMatch[1]}`;
    type = 'master';
  } else {
    return null;
  }
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Discogs token=${discogsToken}`,
        'User-Agent': 'PlaatjesPrijsApp/1.0'
      }
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return { data, type };
  } catch (error) {
    console.error(`Failed to fetch Discogs data from ${url}:`, error);
    return null;
  }
}

// Extract year from Discogs data
function getDiscogsYear(discogsResponse: any): number | null {
  if (!discogsResponse) return null;
  
  const { data, type } = discogsResponse;
  
  if (type === 'master') {
    return parseYear(data.year);
  } else if (type === 'release') {
    return parseYear(data.year) || parseYear(data.released) || parseYear(data.released_formatted);
  }
  
  return null;
}

// Search Discogs by artist and title
async function findDiscogsByArtistTitle(artist: string, title: string): Promise<{ year: number | null, url: string | null } | null> {
  if (!discogsToken) return null;
  
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const response = await fetch(`https://api.discogs.com/database/search?q=${query}&type=release`, {
      headers: {
        'Authorization': `Discogs token=${discogsToken}`,
        'User-Agent': 'PlaatjesPrijsApp/1.0'
      }
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      return {
        year: parseYear(firstResult.year),
        url: firstResult.resource_url || firstResult.uri
      };
    }
  } catch (error) {
    console.error(`Discogs search failed for ${artist} - ${title}:`, error);
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { only_unknown_year = false, target_slug = null, limit = null } = body;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Starting blog slug fix process...');

    // Get all blog posts with yaml_frontmatter
    let query = supabase
      .from('blog_posts')
      .select('id, slug, album_type, album_id, yaml_frontmatter')
      .order('created_at', { ascending: false });
    
    if (target_slug) {
      query = query.eq('slug', target_slug);
    }

    const { data: allBlogPosts, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    // Filter for unknown year if requested
    let blogPosts = allBlogPosts || [];
    if (only_unknown_year && !target_slug) {
      blogPosts = blogPosts.filter(b => b.slug?.endsWith('-unknown'));
    }
    
    // Apply limit
    if (limit && limit > 0) {
      blogPosts = blogPosts.slice(0, limit);
    }

    console.log(`📋 Processing ${blogPosts.length} blog posts`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const sources = { albumData: 0, discogs: 0, yaml: 0, parsed: 0 };
    const samples: any[] = [];

    for (const blog of blogPosts) {
      try {
        console.log(`\n🔍 Processing blog: ${blog.id} (${blog.album_type})`);

        // Fetch album data based on type
        let albumData;
        let actualTableUsed = '';

        if (blog.album_type === 'cd') {
          const { data } = await supabase
            .from('cd_scan')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'cd_scan';
          }
        } else if (blog.album_type === 'vinyl') {
          const { data } = await supabase
            .from('vinyl2_scan')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'vinyl2_scan';
          }
        } else if (blog.album_type === 'ai') {
          const { data } = await supabase
            .from('ai_scan_results')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'ai_scan_results';
          }
        } else if (blog.album_type === 'release') {
          const { data } = await supabase
            .from('releases')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'releases';
          }
        } else if (blog.album_type === 'product') {
          const { data } = await supabase
            .from('platform_products')
            .select('*')
            .eq('id', blog.album_id)
            .maybeSingle();
          if (data) {
            albumData = data;
            actualTableUsed = 'platform_products';
          }
        }

        if (!albumData) {
          console.log(`⚠️ Album data not found for blog ${blog.id}`);
          skipped++;
          continue;
        }

        // Extract YAML frontmatter values as fallback
        const yamlYear = parseYear(blog.yaml_frontmatter?.year);
        const yamlArtist = blog.yaml_frontmatter?.artist;
        const yamlTitle = blog.yaml_frontmatter?.album || blog.yaml_frontmatter?.single_name;

        // Determine effective artist, title, and year
        let discogsArtist: string | null = null;
        let discogsTitle: string | null = null;
        let discogsYear: number | null = null;
        let yearSource = '';

        // For platform_products, try to parse artist/title from product title if no discogs_url
        if (actualTableUsed === 'platform_products' && !albumData.discogs_url && albumData.title) {
          const titleMatch = albumData.title.match(/^(.+?)\s*-\s*(.+?)(?:\s*\[.*\])?$/);
          if (titleMatch) {
            discogsArtist = titleMatch[1].trim();
            discogsTitle = titleMatch[2].trim();
            sources.parsed++;
          }
        }

        // Try to fetch year from Discogs for ALL types if discogs_url exists
        if (albumData.discogs_url) {
          const discogsResponse = await getDiscogsFromUrl(albumData.discogs_url);
          discogsYear = getDiscogsYear(discogsResponse);
          if (discogsYear) {
            yearSource = 'discogs';
            sources.discogs++;
          }
          
          // For platform products, also fetch artist/title from Discogs
          if (actualTableUsed === 'platform_products' && discogsResponse) {
            const discogsData = discogsResponse.data;
            discogsArtist = discogsData.artists?.[0]?.name || discogsData.artists_sort || discogsArtist;
            discogsTitle = discogsData.title || discogsTitle;
          }
        }

        const effectiveArtist = actualTableUsed === 'platform_products' 
          ? (discogsArtist || yamlArtist)
          : (albumData.artist || yamlArtist);
        
        const effectiveTitle = actualTableUsed === 'platform_products' 
          ? (discogsTitle || yamlTitle)
          : (albumData.title || yamlTitle);

        // Determine year with priority: albumData > discogs > yaml > search > unknown
        let effectiveYear: string | number = 'unknown';

        if (albumData.year || albumData.release_year) {
          effectiveYear = albumData.year || albumData.release_year;
          yearSource = 'albumData';
          sources.albumData++;
        } else if (discogsYear) {
          effectiveYear = discogsYear;
        } else if (yamlYear) {
          effectiveYear = yamlYear;
          yearSource = 'yaml';
          sources.yaml++;
        } else if (effectiveArtist && effectiveTitle && actualTableUsed === 'platform_products') {
          // Last resort: search Discogs by artist/title
          const searchResult = await findDiscogsByArtistTitle(effectiveArtist, effectiveTitle);
          if (searchResult?.year) {
            effectiveYear = searchResult.year;
            discogsYear = searchResult.year;
            yearSource = 'discogs-search';
            sources.discogs++;
          }
        }

        // Skip only if artist or title are not meaningful (year can be unknown)
        if (!isMeaningfulName(effectiveArtist) || !isMeaningfulName(effectiveTitle)) {
          console.log(`⏭️ Skipping blog ${blog.id}: incomplete artist/title (artist: ${effectiveArtist}, title: ${effectiveTitle})`);
          skipped++;
          continue;
        }

        // Generate new slug
        const newSlug = [effectiveArtist, effectiveTitle, effectiveYear]
          .map(part => 
            String(part)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
          )
          .join('-');

        // Check if slug changed
        if (newSlug === blog.slug) {
          console.log(`✓ Slug already correct: ${newSlug}`);
          skipped++;
          continue;
        }

        console.log(`🔄 Updating slug: "${blog.slug}" → "${newSlug}" (year from: ${yearSource || 'unknown'})`);

        // Build update payload including frontmatter fixes
        const updateData: any = { slug: newSlug };
        const currentFm: any = { ...(blog.yaml_frontmatter || {}) };
        let fmChanged = false;

        // Year
        if (discogsYear && (!currentFm.year || String(currentFm.year).toLowerCase() === 'unknown')) {
          currentFm.year = discogsYear;
          fmChanged = true;
        }
        // Artist
        if (isMeaningfulName(String(effectiveArtist)) && !isMeaningfulName(currentFm.artist)) {
          currentFm.artist = String(effectiveArtist);
          fmChanged = true;
        }
        // Album (title of release)
        if (isMeaningfulName(String(effectiveTitle)) && !isMeaningfulName(currentFm.album)) {
          currentFm.album = String(effectiveTitle);
          fmChanged = true;
        }
        // Title for the blog card
        if (!isMeaningfulName(currentFm.title) && isMeaningfulName(String(effectiveArtist)) && isMeaningfulName(String(effectiveTitle))) {
          currentFm.title = `${effectiveArtist} - ${effectiveTitle}`;
          fmChanged = true;
        }

        if (fmChanged) {
          updateData.yaml_frontmatter = currentFm;
        }

        // Update blog post
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(updateData)
          .eq('id', blog.id);

        if (updateError) {
          console.error('❌ Error updating blog:', updateError);
          errors++;
        } else {
          console.log(`✅ Updated blog ${blog.id}`);
          updated++;
          
          if (samples.length < 10) {
            samples.push({
              old: blog.slug,
              new: newSlug,
              yearSource: yearSource || 'unknown'
            });
          }
        }

      } catch (error) {
        console.error(`❌ Error processing blog ${blog.id}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        skipped,
        errors,
        total: blogPosts.length,
        sources,
        samples
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in fix-blog-slugs function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
