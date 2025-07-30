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
  release_id?: string;
}

// Cache for 10 minutes
let cachedReleases: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache first
    const now = Date.now();
    if (cachedReleases && (now - cacheTime) < CACHE_DURATION) {
      console.log('Returning cached releases');
      return new Response(JSON.stringify(cachedReleases), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    if (!discogsToken) {
      throw new Error('Discogs token not configured');
    }

    console.log('Fetching trending releases from Discogs...');
    
    // Get trending releases from Discogs
    const response = await fetch('https://api.discogs.com/database/search?type=release&sort=added%2Cdesc&per_page=50', {
      headers: {
        'Authorization': `Discogs token=${discogsToken}`,
        'User-Agent': 'VinylCollector/1.0'
      }
    });

    if (!response.ok) {
      console.error(`Discogs API error: ${response.status} - ${response.statusText}`);
      throw new Error(`Discogs API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.results?.length || 0} releases from Discogs API`);
    
    // Initialize Supabase client for optional database lookups
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Filter releases - last 3 years or no year specified
    const currentYear = new Date().getFullYear();
    const filteredReleases = data.results
      .filter((release: any) => {
        return !release.year || release.year >= (currentYear - 3);
      })
      .slice(0, 20);

    // Format releases without heavy database operations
    const formattedReleases: DiscogsRelease[] = [];
    const discogsIds = filteredReleases.map((r: any) => r.id);
    
    // Single query to check which releases exist in database
    let existingReleases: any = {};
    try {
      const { data: dbReleases } = await supabase
        .from('releases')
        .select('discogs_id, id')
        .in('discogs_id', discogsIds);
      
      if (dbReleases) {
        existingReleases = dbReleases.reduce((acc: any, rel: any) => {
          acc[rel.discogs_id] = rel.id;
          return acc;
        }, {});
      }
    } catch (dbError) {
      console.log('Database lookup failed, continuing without release_ids');
    }
    
    for (const release of filteredReleases) {
      try {
        // Extract title and artist properly
        const titleParts = release.title?.split(' - ') || ['Unknown', 'Unknown'];
        const artist = titleParts.length > 1 ? titleParts[0] : (release.artist || 'Unknown Artist');
        const title = titleParts.length > 1 ? titleParts.slice(1).join(' - ') : (titleParts[0] || 'Unknown Title');
        
        const formattedRelease: DiscogsRelease = {
          id: release.id,
          title: title,
          artist: artist,
          year: release.year || new Date().getFullYear(),
          thumb: release.thumb || '',
          format: release.format || [],
          label: release.label || [],
          genre: release.genre || [],
          style: release.style || [],
          country: release.country || '',
          uri: release.uri || '',
          release_id: existingReleases[release.id] || null
        };

        formattedReleases.push(formattedRelease);
        
      } catch (error) {
        console.error(`Error processing release ${release.id}:`, error);
        // Continue with the next release even if one fails
      }
    }

    console.log(`Processed ${formattedReleases.length} recent Discogs releases`);

    const result = {
      success: true,
      releases: formattedReleases,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    cachedReleases = result;
    cacheTime = now;

    return new Response(JSON.stringify(result), {
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