import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscogsImage {
  type: string;
  uri: string;
  width: number;
  height: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spotlightId, discogsIds } = await req.json();

    if (!spotlightId || !discogsIds || !Array.isArray(discogsIds)) {
      throw new Error('Spotlight ID and array of Discogs IDs are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Discogs credentials (support multiple env names)
    const discogsToken =
      Deno.env.get('DISCOGS_TOKEN') ||
      Deno.env.get('DISCOGS_USER_TOKEN');

    const discogsConsumerKey =
      Deno.env.get('DISCOGS_CONSUMER_KEY') ||
      Deno.env.get('DISCOGS_API_KEY');

    const discogsConsumerSecret =
      Deno.env.get('DISCOGS_CONSUMER_SECRET') ||
      Deno.env.get('DISCOGS_API_SECRET');

    console.log(
      `[discogs-auth] presence -> token:${!!discogsToken}, consumerKey:${!!discogsConsumerKey}, consumerSecret:${!!discogsConsumerSecret}`
    );

    if (!discogsToken && !(discogsConsumerKey && discogsConsumerSecret)) {
      throw new Error('Discogs credentials not configured');
    }

    // Fetch release data from Discogs
    const headers: Record<string, string> = {
      'User-Agent': 'MusicScanApp/1.0',
      'Accept': 'application/json'
    };

    // Prefer personal token over consumer key/secret
    if (discogsToken) {
      headers['Authorization'] = `Discogs token=${discogsToken}`;
    } else {
      headers['Authorization'] = `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}`;
    }

    console.log(`[fetch-discogs-images] Fetching images for ${discogsIds.length} releases`);

    const allImageRecords = [];
    
    // Fetch all releases
    for (const discogsId of discogsIds) {
      try {
        console.log(`Fetching release ${discogsId}`);
        const discogsResponse = await fetch(
          `https://api.discogs.com/releases/${discogsId}`,
          { headers }
        );

        if (!discogsResponse.ok) {
          console.error(`Failed to fetch release ${discogsId}: ${discogsResponse.status}`);
          continue;
        }

        const releaseData = await discogsResponse.json();
        const images: DiscogsImage[] = releaseData.images || [];

        console.log(`Found ${images.length} images for release ${discogsId}`);

        // Save images to spotlight_images table
        const imageRecords = images.map((img, index) => ({
          spotlight_id: spotlightId,
          image_url: img.uri,
          image_source: 'discogs',
          title: `${releaseData.artists?.[0]?.name || 'Unknown'} - ${releaseData.title}`,
          context: img.type === 'primary' ? 'Album Cover' : `Additional Image ${index}`,
          discogs_release_id: discogsId,
          display_order: allImageRecords.length + index,
          is_inserted: false,
        }));

        allImageRecords.push(...imageRecords);
        
        // Rate limiting: wait 1 second between requests
        if (discogsIds.indexOf(discogsId) < discogsIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error fetching release ${discogsId}:`, error);
      }
    }

    if (allImageRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No images found for selected releases',
          images: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: insertedImages, error: insertError } = await supabase
      .from('spotlight_images')
      .insert(allImageRecords)
      .select();

    if (insertError) {
      console.error('Error inserting images:', insertError);
      throw insertError;
    }

    console.log(`Successfully saved ${insertedImages.length} Discogs images from ${discogsIds.length} releases`);

    return new Response(
      JSON.stringify({
        success: true,
        images: insertedImages,
        count: insertedImages.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-discogs-images:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
