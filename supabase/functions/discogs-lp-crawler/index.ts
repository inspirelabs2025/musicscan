import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting Discogs LP Crawler...');

    if (!DISCOGS_TOKEN) {
      throw new Error('DISCOGS_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch active artists (prioritize those never crawled or oldest crawl)
    const { data: artists, error: artistsError } = await supabase
      .from('curated_artists')
      .select('id, artist_name, last_crawled_at')
      .eq('is_active', true)
      .order('last_crawled_at', { ascending: true, nullsFirst: true })
      .limit(20);

    if (artistsError) {
      throw new Error(`Failed to fetch artists: ${artistsError.message}`);
    }

    if (!artists || artists.length === 0) {
      console.log('No active artists found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active artists to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${artists.length} artists...`);

    const foundReleases: any[] = [];
    let totalSearched = 0;
    let apiErrors = 0;

    // 2. For each artist: fetch random LP releases
    for (const artist of artists) {
      try {
        console.log(`Searching for ${artist.artist_name}...`);

        // Search Discogs for vinyl LP releases
        const searchParams = new URLSearchParams({
          artist: artist.artist_name,
          type: 'release',
          format: 'Vinyl',
          per_page: '50',
        });

        const searchUrl = `https://api.discogs.com/database/search?${searchParams}`;
        const searchResponse = await fetch(searchUrl, {
          headers: {
            'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
            'User-Agent': 'VinylScanner/2.0',
          },
        });

        if (!searchResponse.ok) {
          console.error(`Discogs search failed for ${artist.artist_name}: ${searchResponse.status}`);
          apiErrors++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        const searchData = await searchResponse.json();
        totalSearched++;

        if (!searchData.results || searchData.results.length === 0) {
          console.log(`No releases found for ${artist.artist_name}`);
          await supabase
            .from('curated_artists')
            .update({ last_crawled_at: new Date().toISOString() })
            .eq('id', artist.id);
          continue;
        }

        // Filter for LP format only (exclude 7", 12", EP, Single)
        const lpReleases = searchData.results.filter((release: any) => {
          const formats = release.format || [];
          const formatStr = formats.join(' ').toLowerCase();
          // Must include LP or Album, exclude singles/EPs
          return (formatStr.includes('lp') || formatStr.includes('album')) &&
                 !formatStr.includes('single') &&
                 !formatStr.includes(' ep') &&
                 !formatStr.includes('7"') &&
                 !formatStr.includes('12"');
        });

        if (lpReleases.length === 0) {
          console.log(`No LP releases found for ${artist.artist_name}`);
          await supabase
            .from('curated_artists')
            .update({ last_crawled_at: new Date().toISOString() })
            .eq('id', artist.id);
          continue;
        }

        // Pick 1 random LP
        const randomRelease = lpReleases[Math.floor(Math.random() * lpReleases.length)];
        console.log(`Found random LP: ${randomRelease.title} (${randomRelease.id})`);

        // ✅ CRITICAL: Ensure we have Release ID (not Master ID)
        let releaseId: number | null = null;
        let masterId: number | null = null;

        if (randomRelease.type === 'release') {
          releaseId = randomRelease.id;
        } else if (randomRelease.type === 'master') {
          // Convert Master to Release ID
          console.log(`Converting Master ${randomRelease.id} to Release ID...`);
          const masterUrl = `https://api.discogs.com/masters/${randomRelease.id}`;
          const masterResponse = await fetch(masterUrl, {
            headers: {
              'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
              'User-Agent': 'VinylScanner/2.0',
            },
          });

          if (masterResponse.ok) {
            const masterData = await masterResponse.json();
            releaseId = masterData.main_release;
            masterId = randomRelease.id;
            console.log(`Converted to Release ID: ${releaseId}`);
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!releaseId) {
          console.log(`Could not determine Release ID for ${randomRelease.title}`);
          continue;
        }

        // Fetch full release details
        const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;
        const releaseResponse = await fetch(releaseUrl, {
          headers: {
            'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
            'User-Agent': 'VinylScanner/2.0',
          },
        });

        if (!releaseResponse.ok) {
          console.error(`Failed to fetch release ${releaseId}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        const releaseData = await releaseResponse.json();

        foundReleases.push({
          discogs_release_id: releaseId,
          master_id: masterId || releaseData.master_id || null,
          artist: releaseData.artists?.[0]?.name || artist.artist_name,
          title: releaseData.title,
          year: releaseData.year,
          format: releaseData.formats?.map((f: any) => f.name).join(', '),
          label: releaseData.labels?.[0]?.name,
          country: releaseData.country,
          catalog_number: releaseData.labels?.[0]?.catno,
        });

        // Update artist's last_crawled_at
        await supabase
          .from('curated_artists')
          .update({ 
            last_crawled_at: new Date().toISOString(),
            releases_found_count: (artist as any).releases_found_count + 1
          })
          .eq('id', artist.id);

        // Rate limiting: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing artist ${artist.artist_name}:`, error);
        apiErrors++;
      }
    }

    console.log(`Found ${foundReleases.length} releases from ${totalSearched} artists searched`);

    if (foundReleases.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new releases found',
          artists_processed: totalSearched,
          api_errors: apiErrors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Duplicate detection
    const releaseIds = foundReleases.map(r => r.discogs_release_id);

    // Check against existing products
    const { data: existingProducts } = await supabase
      .from('platform_products')
      .select('discogs_id')
      .eq('media_type', 'art')
      .in('discogs_id', releaseIds);

    const existingProductIds = new Set(existingProducts?.map(p => p.discogs_id) || []);

    // Check against existing queue items
    const { data: existingQueue } = await supabase
      .from('discogs_import_log')
      .select('discogs_release_id')
      .in('discogs_release_id', releaseIds);

    const queuedIds = new Set(existingQueue?.map(q => q.discogs_release_id) || []);

    // Filter out duplicates
    const newReleases = foundReleases.filter(r => 
      !existingProductIds.has(r.discogs_release_id) && 
      !queuedIds.has(r.discogs_release_id)
    );

    console.log(`${newReleases.length} new releases after duplicate filter (skipped ${foundReleases.length - newReleases.length})`);

    // 4. Queue top 10 items
    const toQueue = newReleases.slice(0, 10);

    if (toQueue.length > 0) {
      const { error: insertError } = await supabase
        .from('discogs_import_log')
        .insert(
          toQueue.map(r => ({
            discogs_release_id: r.discogs_release_id,
            master_id: r.master_id,
            artist: r.artist,
            title: r.title,
            year: r.year,
            format: r.format,
            label: r.label,
            country: r.country,
            catalog_number: r.catalog_number,
            status: 'pending',
          }))
        );

      if (insertError) {
        console.error('Failed to insert queue items:', insertError);
        throw insertError;
      }

      console.log(`✅ Queued ${toQueue.length} releases for processing`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        artists_processed: totalSearched,
        releases_found: foundReleases.length,
        new_releases: newReleases.length,
        queued: toQueue.length,
        skipped_duplicates: foundReleases.length - newReleases.length,
        api_errors: apiErrors,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in discogs-lp-crawler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
