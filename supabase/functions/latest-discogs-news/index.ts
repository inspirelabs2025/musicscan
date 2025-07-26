import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscogsRelease {
  id: number;
  title: string;
  artist: string;
  year: number;
  thumb: string;
  format: string[];
  label: string[];
  genre: string[];
  style: string[];
  country: string;
  uri: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    if (!discogsToken) {
      throw new Error('Discogs token not configured');
    }

    // Get trending releases from Discogs
    const response = await fetch('https://api.discogs.com/database/search?type=release&sort=added%2Cdesc&per_page=20', {
      headers: {
        'Authorization': `Discogs token=${discogsToken}`,
        'User-Agent': 'VinylCollector/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter and format the releases
    const formattedReleases = data.results
      .filter((release: any) => release.year >= 2024) // Only recent releases
      .slice(0, 6)
      .map((release: any): DiscogsRelease => ({
        id: release.id,
        title: release.title,
        artist: release.artist || 'Unknown Artist',
        year: release.year || new Date().getFullYear(),
        thumb: release.thumb || '',
        format: release.format || [],
        label: release.label || [],
        genre: release.genre || [],
        style: release.style || [],
        country: release.country || '',
        uri: release.uri || ''
      }));

    console.log(`Fetched ${formattedReleases.length} recent Discogs releases`);

    return new Response(JSON.stringify({
      success: true,
      releases: formattedReleases,
      lastUpdated: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching Discogs news:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      releases: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});