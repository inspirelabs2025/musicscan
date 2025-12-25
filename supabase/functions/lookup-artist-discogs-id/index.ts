import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscogsSearchResult {
  id: number;
  title: string;
  type: string;
  thumb: string;
  cover_image: string;
  resource_url: string;
}

interface DiscogsSearchResponse {
  results: DiscogsSearchResult[];
  pagination: {
    page: number;
    pages: number;
    items: number;
  };
}

// Normalize artist name for comparison
function normalizeArtistName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/i, '')
    .replace(/,\s*the$/i, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Calculate similarity score between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeArtistName(str1);
  const s2 = normalizeArtistName(str2);
  
  if (s1 === s2) return 100;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 90;
  
  // Levenshtein-like simple comparison
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 100;
  
  let matches = 0;
  const shorterWords = shorter.split(/\s+/);
  const longerWords = longer.split(/\s+/);
  
  for (const word of shorterWords) {
    if (longerWords.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }
  
  return Math.round((matches / Math.max(shorterWords.length, longerWords.length)) * 100);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName, artistId } = await req.json();
    
    if (!artistName) {
      throw new Error('artistName is required');
    }

    console.log(`[lookup-artist-discogs-id] Looking up: "${artistName}"`);

    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    if (!discogsToken) {
      throw new Error('DISCOGS_TOKEN not configured');
    }

    // Search for artist on Discogs
    const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=artist&per_page=10`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Discogs token=${discogsToken}`,
        'User-Agent': 'MusicScan/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[lookup-artist-discogs-id] Discogs API error: ${response.status} - ${errorText}`);
      throw new Error(`Discogs API error: ${response.status}`);
    }

    const data: DiscogsSearchResponse = await response.json();
    console.log(`[lookup-artist-discogs-id] Found ${data.results?.length || 0} results for "${artistName}"`);

    if (!data.results || data.results.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No artist found on Discogs',
          artistName,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find best match
    let bestMatch: DiscogsSearchResult | null = null;
    let bestScore = 0;

    for (const result of data.results) {
      const score = calculateSimilarity(artistName, result.title);
      console.log(`[lookup-artist-discogs-id] Match score for "${result.title}": ${score}`);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = result;
      }
    }

    // Require minimum 70% match
    if (!bestMatch || bestScore < 70) {
      console.log(`[lookup-artist-discogs-id] No good match found. Best score: ${bestScore}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `No good match found (best score: ${bestScore}%)`,
          artistName,
          candidates: data.results.slice(0, 5).map(r => ({
            id: r.id,
            title: r.title,
            score: calculateSimilarity(artistName, r.title),
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[lookup-artist-discogs-id] Best match: "${bestMatch.title}" (ID: ${bestMatch.id}, score: ${bestScore}%)`);

    // Update curated_artists if artistId provided
    if (artistId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from('curated_artists')
        .update({
          discogs_artist_id: bestMatch.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', artistId);

      if (updateError) {
        console.error(`[lookup-artist-discogs-id] Failed to update artist: ${updateError.message}`);
      } else {
        console.log(`[lookup-artist-discogs-id] Updated curated_artists.discogs_artist_id for ${artistId}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        artistName,
        discogsId: bestMatch.id,
        discogsName: bestMatch.title,
        matchScore: bestScore,
        thumb: bestMatch.thumb,
        coverImage: bestMatch.cover_image,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[lookup-artist-discogs-id] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
