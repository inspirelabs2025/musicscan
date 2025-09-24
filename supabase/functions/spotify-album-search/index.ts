import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifySearchResponse {
  albums: {
    items: SpotifyAlbum[];
  };
  artists: {
    items: SpotifyArtist[];
  };
}

async function getSpotifyAccessToken(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured');
  }

  const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify token: ${response.status}`);
  }

  const data: SpotifyTokenResponse = await response.json();
  return data.access_token;
}

async function searchSpotifyAlbum(artist: string, album: string, accessToken: string): Promise<string | null> {
  // Clean up artist and album names for better matching
  const cleanArtist = artist.replace(/[^\w\s]/g, '').trim();
  const cleanAlbum = album.replace(/[^\w\s]/g, '').trim();
  
  const query = `artist:"${cleanArtist}" album:"${cleanAlbum}"`;
  const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10`;

  console.log(`Searching Spotify for: ${query}`);

  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error(`Spotify search failed: ${response.status}`);
    return null;
  }

  const data: SpotifySearchResponse = await response.json();
  
  if (data.albums.items.length === 0) {
    console.log('No albums found');
    return null;
  }

  // Find the best match by comparing artist and album names
  for (const spotifyAlbum of data.albums.items) {
    const spotifyArtist = spotifyAlbum.artists[0]?.name.toLowerCase();
    const spotifyAlbumName = spotifyAlbum.name.toLowerCase();
    
    // Check for exact or close matches
    if (spotifyArtist?.includes(cleanArtist.toLowerCase()) || cleanArtist.toLowerCase().includes(spotifyArtist || '')) {
      if (spotifyAlbumName?.includes(cleanAlbum.toLowerCase()) || cleanAlbum.toLowerCase().includes(spotifyAlbumName || '')) {
        console.log(`Found match: ${spotifyAlbum.name} by ${spotifyAlbum.artists[0]?.name}`);
        return spotifyAlbum.external_urls.spotify;
      }
    }
  }

  // If no perfect match, return the first result as fallback
  const firstResult = data.albums.items[0];
  console.log(`Using first result as fallback: ${firstResult.name} by ${firstResult.artists[0]?.name}`);
  return firstResult.external_urls.spotify;
}

async function searchSpotifyArtist(artist: string, accessToken: string): Promise<string | null> {
  // Clean up artist name for better matching
  const cleanArtist = artist.replace(/[^\w\s]/g, '').trim();
  
  const query = `artist:"${cleanArtist}"`;
  const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`;

  console.log(`Searching Spotify for artist: ${query}`);

  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error(`Spotify artist search failed: ${response.status}`);
    return null;
  }

  const data: SpotifySearchResponse = await response.json();
  
  if (data.artists.items.length === 0) {
    console.log('No artists found');
    return null;
  }

  // Find the best match by comparing artist names
  for (const spotifyArtist of data.artists.items) {
    const spotifyArtistName = spotifyArtist.name.toLowerCase();
    
    // Check for exact or close matches
    if (spotifyArtistName?.includes(cleanArtist.toLowerCase()) || cleanArtist.toLowerCase().includes(spotifyArtistName || '')) {
      console.log(`Found artist match: ${spotifyArtist.name}`);
      return spotifyArtist.external_urls.spotify;
    }
  }

  // If no perfect match, return the first result as fallback
  const firstResult = data.artists.items[0];
  console.log(`Using first artist result as fallback: ${firstResult.name}`);
  return firstResult.external_urls.spotify;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artist, album } = await req.json();

    if (!artist || !album) {
      return new Response(
        JSON.stringify({ error: 'Artist and album are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Searching for album: "${album}" by "${artist}"`);

    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    
    // Search for the album first
    const albumUrl = await searchSpotifyAlbum(artist, album, accessToken);
    
    // If no album found, search for artist as fallback
    let artistUrl = null;
    if (!albumUrl) {
      artistUrl = await searchSpotifyArtist(artist, accessToken);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        albumUrl: albumUrl,
        artistUrl: artistUrl,
        artist,
        album 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in spotify-album-search:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});