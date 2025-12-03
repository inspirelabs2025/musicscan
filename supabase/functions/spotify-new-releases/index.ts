import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  album_type: string;
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyNewReleasesResponse {
  albums: {
    items: SpotifyAlbum[];
    total: number;
    next: string | null;
  };
}

async function getSpotifyAccessToken(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify access token: ${response.statusText}`);
  }

  const data: SpotifyTokenResponse = await response.json();
  return data.access_token;
}

async function getSpotifyNewReleasesPage(
  accessToken: string, 
  country: string = 'NL', 
  limit: number = 50,
  offset: number = 0
): Promise<{ items: SpotifyAlbum[]; total: number; hasMore: boolean }> {
  const url = `https://api.spotify.com/v1/browse/new-releases?country=${country}&limit=${limit}&offset=${offset}`;
  
  console.log(`Fetching releases: offset=${offset}, limit=${limit}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch new releases: ${response.statusText}`);
  }

  const data: SpotifyNewReleasesResponse = await response.json();
  return {
    items: data.albums.items,
    total: data.albums.total,
    hasMore: data.albums.next !== null
  };
}

async function getAllSpotifyNewReleases(
  accessToken: string, 
  country: string = 'NL',
  maxReleases: number = 200
): Promise<SpotifyAlbum[]> {
  const allAlbums: SpotifyAlbum[] = [];
  const pageSize = 50; // Spotify max per request
  let offset = 0;
  let hasMore = true;
  
  while (hasMore && allAlbums.length < maxReleases) {
    const { items, total, hasMore: more } = await getSpotifyNewReleasesPage(
      accessToken, 
      country, 
      pageSize, 
      offset
    );
    
    allAlbums.push(...items);
    offset += pageSize;
    hasMore = more && offset < total;
    
    console.log(`Fetched ${allAlbums.length}/${total} releases (max: ${maxReleases})`);
    
    // Small delay between requests to be nice to Spotify API
    if (hasMore && allAlbums.length < maxReleases) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Deduplicate by album ID (in case of overlapping results)
  const uniqueAlbums = Array.from(
    new Map(allAlbums.map(album => [album.id, album])).values()
  );
  
  return uniqueAlbums.slice(0, maxReleases);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Spotify new releases with pagination...');
    
    // Parse request body for optional parameters
    let maxReleases = 200;
    let country = 'NL';
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        maxReleases = body.maxReleases || 200;
        country = body.country || 'NL';
      } catch {
        // Use defaults if body parsing fails
      }
    }
    
    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    console.log('Successfully obtained Spotify access token');

    // Get new releases with pagination
    const albums = await getAllSpotifyNewReleases(accessToken, country, maxReleases);
    console.log(`Found ${albums.length} total new releases`);

    // Format the response with additional fields
    const formattedAlbums = albums.map(album => ({
      id: album.id,
      name: album.name,
      artist: album.artists.map(a => a.name).join(', '),
      artist_ids: album.artists.map(a => a.id),
      image_url: album.images[0]?.url || null,
      spotify_url: album.external_urls.spotify,
      release_date: album.release_date,
      album_type: album.album_type,
      total_tracks: album.total_tracks,
    }));

    return new Response(
      JSON.stringify({ 
        albums: formattedAlbums,
        total: formattedAlbums.length,
        country,
        fetched_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fetching Spotify new releases:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch new releases',
        albums: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
