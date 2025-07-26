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
  release_id?: string; // Added for database release ID
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

    console.log('Fetching trending releases from Discogs...');
    
    // Get trending releases from Discogs
    const response = await fetch('https://api.discogs.com/database/search?type=release&sort=added%2Cdesc&per_page=100', {
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
    
    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Filter and format the releases - relaxed year filter
    const currentYear = new Date().getFullYear();
    const filteredReleases = data.results
      .filter((release: any) => {
        // More relaxed filtering - last 5 years or no year specified
        return !release.year || release.year >= (currentYear - 5);
      })
      .slice(0, 20);

    // Process each release and create database records
    const formattedReleases: DiscogsRelease[] = [];
    
    for (const release of filteredReleases) {
      try {
        // Extract title and artist properly
        const titleParts = release.title?.split(' - ') || ['Unknown', 'Unknown'];
        const artist = titleParts.length > 1 ? titleParts[0] : (release.artist || 'Unknown Artist');
        const title = titleParts.length > 1 ? titleParts.slice(1).join(' - ') : (titleParts[0] || 'Unknown Title');
        
        // Call find-or-create-release to ensure the release exists in database
        const { data: releaseData, error: releaseError } = await supabase.functions.invoke('find-or-create-release', {
          body: {
            discogs_id: release.id,
            artist: artist,
            title: title,
            label: release.label?.[0] || null,
            catalog_number: release.catno || null,
            year: release.year || null,
            format: release.format?.[0] || null,
            genre: release.genre?.[0] || null,
            country: release.country || null,
            style: release.style || [],
            discogs_url: `https://www.discogs.com${release.uri}`,
            master_id: release.master_id || null
          }
        });

        if (releaseError) {
          console.error(`Error creating release ${release.id}:`, releaseError);
        }

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
          release_id: releaseData?.release_id || null
        };

        formattedReleases.push(formattedRelease);
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing release ${release.id}:`, error);
        // Continue with the next release even if one fails
      }
    }

    console.log(`Processed ${formattedReleases.length} recent Discogs releases with database records`);

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