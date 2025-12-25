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
  format?: string;
  label?: string;
  resource_url: string;
}

interface DiscogsReleasesResponse {
  releases: DiscogsRelease[];
  pagination: {
    page: number;
    pages: number;
    items: number;
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Filter for singles only (7", 12", Single format)
function isSingle(release: DiscogsRelease): boolean {
  if (release.role !== 'Main') return false;
  
  const format = (release.format || '').toLowerCase();
  const title = release.title.toLowerCase();
  
  // Include if format indicates single
  if (format.includes('single') || format.includes('7"') || format.includes('12"')) {
    return true;
  }
  
  // Exclude obvious non-singles
  const skipPatterns = [
    'album', 'lp', 'compilation', 'best of', 'greatest hits',
    'anthology', 'collection', 'complete', 'box set'
  ];
  
  if (skipPatterns.some(p => title.includes(p) || format.includes(p))) {
    return false;
  }
  
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistId, artistName, discogsArtistId } = await req.json();
    
    if (!artistName || !discogsArtistId) {
      throw new Error('artistName and discogsArtistId are required');
    }

    console.log(`[discover-artist-singles] Starting for: "${artistName}" (Discogs ID: ${discogsArtistId})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    if (!discogsToken) {
      throw new Error('DISCOGS_TOKEN not configured');
    }

    // Fetch singles from Discogs (format=Single)
    let allReleases: DiscogsRelease[] = [];
    let page = 1;
    let totalPages = 1;

    console.log(`[discover-artist-singles] Fetching singles for artist ID: ${discogsArtistId}`);

    console.log(`[discover-artist-singles] Fetching singles for artist ID: ${discogsArtistId}`);

    // Fetch ALL singles (no page limit for singles)
    while (page <= totalPages) {
      const url = `https://api.discogs.com/artists/${discogsArtistId}/releases?format=Single&page=${page}&per_page=100&sort=year&sort_order=asc`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Discogs token=${discogsToken}`,
          'User-Agent': 'MusicScan/1.0',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`[discover-artist-singles] Rate limited, waiting 60s...`);
          await delay(60000);
          continue;
        }
        throw new Error(`Discogs API error: ${response.status}`);
      }

      const data: DiscogsReleasesResponse = await response.json();
      
      if (page === 1) {
        totalPages = data.pagination.pages;
        console.log(`[discover-artist-singles] Total singles: ${data.pagination.items} (${totalPages} pages)`);
      }

      allReleases = allReleases.concat(data.releases);
      console.log(`[discover-artist-singles] Fetched page ${page}/${totalPages}`);

      page++;
      if (page <= totalPages) {
        await delay(1000);
      }
    }

    // Also fetch 7" and 12" formats (no limit)
    for (const format of ['7"', '12"']) {
      page = 1;
      totalPages = 1;
      
      while (page <= totalPages) {
        const url = `https://api.discogs.com/artists/${discogsArtistId}/releases?format=${encodeURIComponent(format)}&page=${page}&per_page=100`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'MusicScan/1.0',
          },
        });

        if (!response.ok) {
          if (response.status === 429) {
            await delay(60000);
            continue;
          }
          break;
        }

        const data: DiscogsReleasesResponse = await response.json();
        
        if (page === 1) {
          totalPages = data.pagination.pages;
          console.log(`[discover-artist-singles] ${format} releases: ${data.pagination.items} (${totalPages} pages)`);
        }

        allReleases = allReleases.concat(data.releases);
        page++;
        if (page <= totalPages) {
          await delay(1000);
        }
      }
    }

    // Filter and deduplicate
    const filteredSingles = allReleases.filter(r => r.role === 'Main');
    const uniqueTitles = new Map<string, DiscogsRelease>();
    
    for (const single of filteredSingles) {
      const normalizedTitle = single.title.toLowerCase().trim();
      if (!uniqueTitles.has(normalizedTitle)) {
        uniqueTitles.set(normalizedTitle, single);
      }
    }

    const singles = Array.from(uniqueTitles.values());
    console.log(`[discover-artist-singles] Unique singles after dedup: ${singles.length}`);

    // Upsert singles
    let inserted = 0;
    let skipped = 0;

    for (const single of singles) {
      try {
        const singleData = {
          artist_id: artistId || null,
          artist_name: artistName,
          discogs_artist_id: discogsArtistId,
          title: single.title,
          year: single.year || null,
          discogs_release_id: single.id,
          discogs_url: `https://www.discogs.com/release/${single.id}`,
          artwork_thumb: single.thumb || null,
          artwork_large: single.thumb?.replace('/150x150/', '/500x500/') || null,
          format: single.format || 'Single',
          label: single.label || null,
          status: 'pending',
        };

        const { error } = await supabase
          .from('master_singles')
          .upsert(singleData, {
            onConflict: 'discogs_release_id',
            ignoreDuplicates: true,
          });

        if (error) {
          if (error.code === '23505') {
            skipped++;
          } else {
            console.error(`[discover-artist-singles] Error: ${error.message}`);
          }
        } else {
          inserted++;
        }
      } catch (e) {
        console.error(`[discover-artist-singles] Error processing "${single.title}":`, e);
      }
    }

    // Update artist singles count
    if (artistId) {
      await supabase
        .from('curated_artists')
        .update({
          singles_count: singles.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', artistId);
    }

    console.log(`[discover-artist-singles] Complete! Inserted: ${inserted}, Skipped: ${skipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        artistName,
        totalSingles: singles.length,
        inserted,
        skipped,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[discover-artist-singles] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
