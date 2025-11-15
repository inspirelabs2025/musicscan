import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscogsRelease {
  id: number;
  title: string;
  year: number;
  thumb: string;
  cover_image: string;
  resource_url: string;
  type: string;
  role: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistId } = await req.json();
    
    if (!artistId) {
      throw new Error('Artist ID is required');
    }

    console.log(`[fetch-artist-releases] Fetching releases for artist: ${artistId}`);

    // Get Discogs credentials
    const discogsToken =
      Deno.env.get('DISCOGS_TOKEN') ||
      Deno.env.get('DISCOGS_USER_TOKEN');

    const discogsConsumerKey =
      Deno.env.get('DISCOGS_CONSUMER_KEY') ||
      Deno.env.get('DISCOGS_API_KEY');

    const discogsConsumerSecret =
      Deno.env.get('DISCOGS_CONSUMER_SECRET') ||
      Deno.env.get('DISCOGS_API_SECRET');

    if (!discogsToken && !(discogsConsumerKey && discogsConsumerSecret)) {
      throw new Error('Discogs credentials not configured');
    }

    // Fetch artist releases from Discogs
    const headers: Record<string, string> = {
      'User-Agent': 'MusicScanApp/1.0',
      'Accept': 'application/json'
    };

    if (discogsToken) {
      headers['Authorization'] = `Discogs token=${discogsToken}`;
    } else {
      headers['Authorization'] = `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}`;
    }

    const url = `https://api.discogs.com/artists/${artistId}/releases?per_page=50&sort=year&sort_order=desc`;
    console.log(`[fetch-artist-releases] Fetching from: ${url}`);

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter and format releases (only albums/EPs, not compilations/appearances)
    const releases = (data.releases || [])
      .filter((release: DiscogsRelease) => 
        release.type === 'master' || 
        (release.role === 'Main' && release.type === 'release')
      )
      .map((release: DiscogsRelease) => ({
        id: release.id,
        title: release.title,
        year: release.year,
        thumb: release.thumb,
        coverImage: release.cover_image,
        type: release.type
      }))
      .slice(0, 30); // Limit to 30 most recent releases

    console.log(`[fetch-artist-releases] Found ${releases.length} releases`);

    return new Response(
      JSON.stringify({
        success: true,
        releases,
        total: releases.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[fetch-artist-releases] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
