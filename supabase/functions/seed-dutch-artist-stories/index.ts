import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Featured Dutch artists to seed
const DUTCH_ARTISTS = [
  "Within Temptation",
  "Golden Earring", 
  "André Hazes",
  "Marco Borsato",
  "Doe Maar",
  "Anouk",
  "Tiësto",
  "Armin van Buuren"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting Dutch artist stories seed...');

    // Check which artists already have stories
    const { data: existingStories, error: fetchError } = await supabase
      .from('artist_stories')
      .select('artist_name')
      .in('artist_name', DUTCH_ARTISTS);

    if (fetchError) {
      console.error('Error fetching existing stories:', fetchError);
      throw fetchError;
    }

    const existingArtistNames = new Set(
      existingStories?.map(s => s.artist_name.toLowerCase()) || []
    );

    const artistsToProcess = DUTCH_ARTISTS.filter(
      artist => !existingArtistNames.has(artist.toLowerCase())
    );

    console.log(`Found ${existingStories?.length || 0} existing stories`);
    console.log(`Processing ${artistsToProcess.length} new artists:`, artistsToProcess);

    const results: { artist: string; success: boolean; error?: string; slug?: string }[] = [];

    // Process each artist sequentially to avoid rate limits
    for (const artistName of artistsToProcess) {
      console.log(`Generating story for: ${artistName}`);
      
      try {
        // Call the generate-artist-story function
        const response = await fetch(
          `${supabaseUrl}/functions/v1/generate-artist-story`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ artistName }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to generate story for ${artistName}:`, errorText);
          results.push({ artist: artistName, success: false, error: errorText });
          continue;
        }

        const data = await response.json();
        console.log(`Successfully generated story for ${artistName}:`, data.slug);
        results.push({ artist: artistName, success: true, slug: data.slug });

        // Wait 2 seconds between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing ${artistName}:`, error);
        results.push({ 
          artist: artistName, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Completed: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: `Processed ${artistsToProcess.length} Dutch artists`,
        alreadyExisted: DUTCH_ARTISTS.length - artistsToProcess.length,
        successful,
        failed,
        results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in seed-dutch-artist-stories:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
