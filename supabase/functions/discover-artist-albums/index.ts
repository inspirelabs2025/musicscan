import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscogsRelease {
  id: number;
  title: string;
  year: number;
  thumb: string;
  role: string;
  type: string;
  main_release?: number;
  resource_url: string;
  artist: string;
  format?: string;
  label?: string;
}

interface DiscogsReleasesResponse {
  releases: DiscogsRelease[];
  pagination: {
    page: number;
    pages: number;
    items: number;
    per_page: number;
  };
}

// Delay helper for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Filter function: only keep main albums (not singles, compilations, etc.)
function isMainAlbum(release: DiscogsRelease): boolean {
  // Only "Main" role (not Appearance, Remix, etc.)
  if (release.role !== 'Main') return false;
  
  // Type should be "master" for unique albums
  if (release.type !== 'master') return false;
  
  // Skip if title contains typical compilation indicators
  const lowerTitle = release.title.toLowerCase();
  const skipPatterns = [
    'greatest hits',
    'best of',
    'compilation',
    'collection',
    'anthology',
    'complete',
    'essential',
    'ultimate',
    'singles',
    'remixes',
    'remix album',
    'live at',
    'live in',
    'bootleg',
    'unofficial',
    'tribute',
    'covers',
  ];
  
  if (skipPatterns.some(pattern => lowerTitle.includes(pattern))) {
    return false;
  }
  
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistId, artistName, discogsArtistId } = await req.json();
    
    if (!artistName) {
      throw new Error('artistName is required');
    }

    console.log(`[discover-artist-albums] Starting discovery for: "${artistName}"`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    if (!discogsToken) {
      throw new Error('DISCOGS_TOKEN not configured');
    }

    let finalDiscogsId = discogsArtistId;

    // Step 1: If no Discogs ID, look it up
    if (!finalDiscogsId) {
      console.log(`[discover-artist-albums] No Discogs ID provided, looking up...`);
      
      const lookupResponse = await supabase.functions.invoke('lookup-artist-discogs-id', {
        body: { artistName, artistId },
      });

      if (lookupResponse.error || !lookupResponse.data?.success) {
        throw new Error(lookupResponse.data?.error || 'Failed to find artist on Discogs');
      }

      finalDiscogsId = lookupResponse.data.discogsId;
      console.log(`[discover-artist-albums] Found Discogs ID: ${finalDiscogsId}`);
    }

    // Step 2: Fetch ALL releases with pagination
    let allReleases: DiscogsRelease[] = [];
    let page = 1;
    let totalPages = 1;
    const perPage = 100;

    console.log(`[discover-artist-albums] Fetching releases for artist ID: ${finalDiscogsId}`);

    while (page <= totalPages) {
      const releasesUrl = `https://api.discogs.com/artists/${finalDiscogsId}/releases?page=${page}&per_page=${perPage}&sort=year&sort_order=asc`;
      
      const response = await fetch(releasesUrl, {
        headers: {
          'Authorization': `Discogs token=${discogsToken}`,
          'User-Agent': 'MusicScan/1.0',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`[discover-artist-albums] Rate limited, waiting 60 seconds...`);
          await delay(60000);
          continue;
        }
        throw new Error(`Discogs API error: ${response.status}`);
      }

      const data: DiscogsReleasesResponse = await response.json();
      
      if (page === 1) {
        totalPages = data.pagination.pages;
        console.log(`[discover-artist-albums] Total pages: ${totalPages}, total items: ${data.pagination.items}`);
      }

      allReleases = allReleases.concat(data.releases);
      console.log(`[discover-artist-albums] Fetched page ${page}/${totalPages} (${data.releases.length} releases)`);

      page++;
      
      // Rate limiting: 1 request per second
      if (page <= totalPages) {
        await delay(1000);
      }
    }

    console.log(`[discover-artist-albums] Total releases fetched: ${allReleases.length}`);

    // Step 3: Filter to main albums only
    const mainAlbums = allReleases.filter(isMainAlbum);
    console.log(`[discover-artist-albums] Main albums after filtering: ${mainAlbums.length}`);

    // Step 4: Upsert albums into master_albums
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const album of mainAlbums) {
      try {
        // Fetch album artwork from master release
        let artworkThumb = album.thumb;
        let artworkLarge = album.thumb?.replace('/150x150/', '/500x500/') || null;
        
        // Try to get better artwork from master release
        if (album.main_release || album.id) {
          try {
            const masterUrl = `https://api.discogs.com/masters/${album.id}`;
            const masterResponse = await fetch(masterUrl, {
              headers: {
                'Authorization': `Discogs token=${discogsToken}`,
                'User-Agent': 'MusicScan/1.0',
              },
            });
            
            if (masterResponse.ok) {
              const masterData = await masterResponse.json();
              if (masterData.images && masterData.images.length > 0) {
                artworkThumb = masterData.images[0].uri150 || artworkThumb;
                artworkLarge = masterData.images[0].uri || artworkLarge;
              }
            }
            await delay(500); // Rate limiting
          } catch (e) {
            // Ignore artwork fetch errors
          }
        }

        const albumData = {
          artist_id: artistId || null,
          artist_name: artistName,
          title: album.title,
          year: album.year || null,
          discogs_master_id: album.id,
          discogs_url: `https://www.discogs.com/master/${album.id}`,
          artwork_thumb: artworkThumb || null,
          artwork_large: artworkLarge || null,
          format: 'LP',
          status: 'pending',
        };

        const { error: upsertError } = await supabase
          .from('master_albums')
          .upsert(albumData, {
            onConflict: 'discogs_master_id',
            ignoreDuplicates: true,
          });

        if (upsertError) {
          // Check if it's a duplicate constraint error
          if (upsertError.code === '23505') {
            skipped++;
          } else {
            console.error(`[discover-artist-albums] Error upserting album "${album.title}": ${upsertError.message}`);
            errors++;
          }
        } else {
          inserted++;
        }
      } catch (albumError) {
        console.error(`[discover-artist-albums] Error processing album "${album.title}":`, albumError);
        errors++;
      }
    }

    // Step 5: Update curated_artists with album count
    if (artistId) {
      const { error: updateError } = await supabase
        .from('curated_artists')
        .update({
          albums_count: mainAlbums.length,
          discogs_artist_id: finalDiscogsId,
          last_crawled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', artistId);

      if (updateError) {
        console.error(`[discover-artist-albums] Error updating artist: ${updateError.message}`);
      }
    }

    console.log(`[discover-artist-albums] Complete! Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        artistName,
        discogsArtistId: finalDiscogsId,
        totalReleases: allReleases.length,
        mainAlbums: mainAlbums.length,
        inserted,
        skipped,
        errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[discover-artist-albums] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
