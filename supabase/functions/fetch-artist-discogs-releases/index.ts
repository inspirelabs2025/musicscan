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
    const { artistId, artistName } = await req.json();
    
    if (!artistId && !artistName) {
      throw new Error('Artist ID or artistName is required');
    }

    console.log(`[fetch-artist-releases] Fetching releases for artist: id=${artistId} name=${artistName}`);

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
      'User-Agent': 'MusicScanApp/1.0 (+https://www.musicscan.app)',
      'Accept': 'application/json'
    };

    if (discogsToken) {
      headers['Authorization'] = `Discogs token=${discogsToken}`;
    } else {
      headers['Authorization'] = `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}`;
    }

    let releases: Array<{ id: number; title: string; year: number; thumb: string; coverImage?: string; type: string }>;    
    let usedFallback = false;

    if (artistId) {
      const url = `https://api.discogs.com/artists/${artistId}/releases?per_page=50&sort=year&sort_order=desc`;
      console.log(`[fetch-artist-releases] Fetching from: ${url}`);

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        releases = (data.releases || [])
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
          .slice(0, 30);
      } else if (response.status === 404 && artistName) {
        console.warn(`[fetch-artist-releases] Artist ${artistId} not found, falling back to search by name: ${artistName}`);
        usedFallback = true;
      } else {
        throw new Error(`Discogs API error: ${response.status} ${response.statusText}`);
      }
    }

    if (!releases || releases.length === 0) {
      // Fallback: search by artist name
      if (!artistName) {
        throw new Error('No releases found and no artistName provided for fallback search');
      }
      const searchUrl = `https://api.discogs.com/database/search?type=release&artist=${encodeURIComponent(artistName)}&per_page=50&sort=year&sort_order=desc`;
      console.log(`[fetch-artist-releases] Fallback search: ${searchUrl}`);
      const searchResp = await fetch(searchUrl, { headers });
      if (!searchResp.ok) {
        throw new Error(`Discogs search error: ${searchResp.status} ${searchResp.statusText}`);
      }
      const searchData = await searchResp.json();
      releases = (searchData.results || [])
        .filter((r: any) => r.type === 'release')
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          year: r.year,
          thumb: r.thumb,
          type: r.type
        }))
        .slice(0, 30);
    }

    console.log(`[fetch-artist-releases] Found ${releases.length} releases${usedFallback ? ' (fallback)' : ''}`);

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
