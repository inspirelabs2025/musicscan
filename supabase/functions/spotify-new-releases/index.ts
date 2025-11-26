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
  external_urls: {
    spotify: string;
  };
}

interface SpotifyNewReleasesResponse {
  albums: {
    items: SpotifyAlbum[];
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

async function getSpotifyNewReleases(accessToken: string, country: string = 'NL', limit: number = 12) {
  const url = `https://api.spotify.com/v1/browse/new-releases?country=${country}&limit=${limit}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch new releases: ${response.statusText}`);
  }

  const data: SpotifyNewReleasesResponse = await response.json();
  return data.albums.items;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Spotify new releases...');
    
    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    console.log('Successfully obtained Spotify access token');

    // Get new releases
    const albums = await getSpotifyNewReleases(accessToken);
    console.log(`Found ${albums.length} new releases`);

    // Format the response
    const formattedAlbums = albums.map(album => ({
      id: album.id,
      name: album.name,
      artist: album.artists.map(a => a.name).join(', '),
      image_url: album.images[0]?.url || null,
      spotify_url: album.external_urls.spotify,
      release_date: album.release_date,
    }));

    return new Response(
      JSON.stringify({ albums: formattedAlbums }),
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
