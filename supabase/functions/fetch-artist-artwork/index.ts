import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName } = await req.json();
    
    if (!artistName) {
      return new Response(
        JSON.stringify({ error: 'Artist name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching artwork for artist: ${artistName}`);

    const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
    
    if (!DISCOGS_TOKEN) {
      console.error('DISCOGS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Discogs token not configured', artworkUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for artist on Discogs
    const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=artist&per_page=1`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
        'User-Agent': 'VinylVault/1.0',
      },
    });

    if (!searchResponse.ok) {
      console.error(`Discogs search failed: ${searchResponse.status}`);
      return new Response(
        JSON.stringify({ artworkUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    
    if (searchData.results && searchData.results.length > 0) {
      const artist = searchData.results[0];
      const artworkUrl = artist.cover_image || artist.thumb;
      
      console.log(`Found artwork for ${artistName}: ${artworkUrl}`);
      
      return new Response(
        JSON.stringify({ 
          artworkUrl,
          artistId: artist.id,
          artistName: artist.title
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`No artwork found for ${artistName}`);
    return new Response(
      JSON.stringify({ artworkUrl: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching artist artwork:', error);
    return new Response(
      JSON.stringify({ error: error.message, artworkUrl: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
