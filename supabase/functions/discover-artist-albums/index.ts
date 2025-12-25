import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlbumFromAI {
  title: string;
  year: number | null;
  label: string | null;
}

interface DiscogsSearchResult {
  id: number;
  master_id?: number;
  title: string;
  year?: string;
  thumb?: string;
  cover_image?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Ask AI for official studio albums
async function getOfficialAlbumsFromAI(artistName: string, apiKey: string): Promise<AlbumFromAI[]> {
  console.log(`[discover-artist-albums] Asking AI for official albums of "${artistName}"...`);
  
  const prompt = `List ALL official studio albums by "${artistName}" as a solo artist or band leader.

IMPORTANT RULES:
- Only OFFICIAL STUDIO ALBUMS (no live albums, compilations, greatest hits, bootlegs, EPs, singles)
- Only albums where ${artistName} is the MAIN artist (not guest appearances, collaborations where they're not the leader)
- Include the album title, release year, and record label
- Order chronologically by release year

Return ONLY a JSON array with this exact format, no other text:
[
  {"title": "Album Name", "year": 1970, "label": "Record Label"},
  ...
]

If you're unsure about an album, don't include it. Quality over quantity.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a music expert with encyclopedic knowledge of discographies. Return only valid JSON arrays.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[discover-artist-albums] AI error: ${response.status} - ${errorText}`);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  } else {
    // Try to find array directly
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }
  }
  
  try {
    const albums = JSON.parse(jsonStr);
    if (!Array.isArray(albums)) {
      throw new Error('Response is not an array');
    }
    console.log(`[discover-artist-albums] AI returned ${albums.length} official albums`);
    return albums;
  } catch (e) {
    console.error(`[discover-artist-albums] Failed to parse AI response: ${content}`);
    throw new Error('Failed to parse AI album list');
  }
}

// Search Discogs for album artwork and master ID
async function findAlbumOnDiscogs(
  artistName: string, 
  albumTitle: string, 
  year: number | null,
  discogsToken: string
): Promise<{ masterId: number | null; thumb: string | null; large: string | null }> {
  const query = encodeURIComponent(`${artistName} ${albumTitle}`);
  const url = `https://api.discogs.com/database/search?q=${query}&type=master&per_page=5`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Discogs token=${discogsToken}`,
        'User-Agent': 'MusicScan/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        await delay(60000);
        return { masterId: null, thumb: null, large: null };
      }
      return { masterId: null, thumb: null, large: null };
    }

    const data = await response.json();
    const results: DiscogsSearchResult[] = data.results || [];
    
    // Find best match - prefer exact title match with year
    for (const result of results) {
      const resultTitle = result.title.toLowerCase();
      const searchTitle = `${artistName} - ${albumTitle}`.toLowerCase();
      
      // Check if title matches
      if (resultTitle.includes(albumTitle.toLowerCase()) || 
          resultTitle.includes(artistName.toLowerCase())) {
        const masterId = result.master_id || result.id;
        const thumb = result.thumb || null;
        const large = result.cover_image || thumb?.replace('/150x150/', '/500x500/') || null;
        
        return { masterId, thumb, large };
      }
    }
    
    // Return first result if no exact match
    if (results.length > 0) {
      const first = results[0];
      return {
        masterId: first.master_id || first.id,
        thumb: first.thumb || null,
        large: first.cover_image || null,
      };
    }
    
    return { masterId: null, thumb: null, large: null };
  } catch (e) {
    console.error(`[discover-artist-albums] Discogs search error for "${albumTitle}":`, e);
    return { masterId: null, thumb: null, large: null };
  }
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
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }
    
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    if (!discogsToken) {
      throw new Error('DISCOGS_TOKEN not configured');
    }

    // Step 1: Get Discogs Artist ID if not provided (for updating curated_artists)
    let finalDiscogsId = discogsArtistId;
    if (!finalDiscogsId) {
      console.log(`[discover-artist-albums] Looking up Discogs ID...`);
      const lookupResponse = await supabase.functions.invoke('lookup-artist-discogs-id', {
        body: { artistName, artistId },
      });
      if (lookupResponse.data?.success) {
        finalDiscogsId = lookupResponse.data.discogsId;
        console.log(`[discover-artist-albums] Found Discogs ID: ${finalDiscogsId}`);
      }
    }

    // Step 2: Ask AI for official studio albums
    const officialAlbums = await getOfficialAlbumsFromAI(artistName, lovableApiKey);
    
    if (officialAlbums.length === 0) {
      console.log(`[discover-artist-albums] No albums found by AI`);
      return new Response(
        JSON.stringify({ success: true, artistName, mainAlbums: 0, inserted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: For each album, find artwork on Discogs and insert
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const album of officialAlbums) {
      try {
        console.log(`[discover-artist-albums] Processing: "${album.title}" (${album.year || 'unknown year'})`);
        
        // Search Discogs for artwork
        const discogs = await findAlbumOnDiscogs(artistName, album.title, album.year, discogsToken);
        await delay(1000); // Rate limiting
        
        const albumData = {
          artist_id: artistId || null,
          artist_name: artistName,
          title: album.title,
          year: album.year || null,
          label: album.label || null,
          discogs_master_id: discogs.masterId,
          discogs_url: discogs.masterId ? `https://www.discogs.com/master/${discogs.masterId}` : null,
          artwork_thumb: discogs.thumb,
          artwork_large: discogs.large,
          format: 'LP',
          status: 'pending',
        };

        const { error: upsertError } = await supabase
          .from('master_albums')
          .upsert(albumData, {
            onConflict: 'artist_name,title',
            ignoreDuplicates: true,
          });

        if (upsertError) {
          if (upsertError.code === '23505') {
            skipped++;
          } else {
            console.error(`[discover-artist-albums] Upsert error: ${upsertError.message}`);
            errors++;
          }
        } else {
          inserted++;
        }
      } catch (albumError) {
        console.error(`[discover-artist-albums] Error processing "${album.title}":`, albumError);
        errors++;
      }
    }

    // Step 4: Update curated_artists
    if (artistId) {
      await supabase
        .from('curated_artists')
        .update({
          albums_count: officialAlbums.length,
          discogs_artist_id: finalDiscogsId,
          last_crawled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', artistId);
    }

    console.log(`[discover-artist-albums] Complete! ${officialAlbums.length} albums, inserted: ${inserted}, skipped: ${skipped}, errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        artistName,
        discogsArtistId: finalDiscogsId,
        mainAlbums: officialAlbums.length,
        inserted,
        skipped,
        errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[discover-artist-albums] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
