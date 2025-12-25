import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[singles-discovery-processor] Starting singles discovery...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse batch size
    let batchSize = 2;
    try {
      const body = await req.json();
      if (body?.batchSize) {
        batchSize = Math.min(Math.max(1, body.batchSize), 5);
      }
    } catch {
      // No body
    }

    // Get artists with discogs_artist_id but no singles discovered yet
    const { data: artists, error: fetchError } = await supabase
      .from('curated_artists')
      .select('id, artist_name, discogs_artist_id, singles_count')
      .eq('is_active', true)
      .not('discogs_artist_id', 'is', null)
      .or('singles_count.is.null,singles_count.eq.0')
      .order('priority', { ascending: false })
      .order('albums_count', { ascending: false, nullsFirst: false })
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch artists: ${fetchError.message}`);
    }

    if (!artists || artists.length === 0) {
      console.log('[singles-discovery-processor] No artists need singles discovery');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No artists need singles discovery',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[singles-discovery-processor] Processing ${artists.length} artist(s)...`);

    const results: Array<{
      artistName: string;
      success: boolean;
      singlesFound?: number;
      error?: string;
    }> = [];

    for (const artist of artists) {
      console.log(`[singles-discovery-processor] Discovering singles for: ${artist.artist_name}`);

      try {
        // Call discover-artist-singles function
        const { data, error } = await supabase.functions.invoke('discover-artist-singles', {
          body: {
            artistId: artist.id,
            artistName: artist.artist_name,
            discogsArtistId: artist.discogs_artist_id,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        results.push({
          artistName: artist.artist_name,
          success: true,
          singlesFound: data?.totalSingles || 0,
        });

        console.log(`[singles-discovery-processor] Found ${data?.totalSingles || 0} singles for ${artist.artist_name}`);

      } catch (processError) {
        console.error(`[singles-discovery-processor] Error for ${artist.artist_name}:`, processError);
        results.push({
          artistName: artist.artist_name,
          success: false,
          error: processError.message,
        });
      }

      // Rate limiting between artists
      if (artists.indexOf(artist) < artists.length - 1) {
        await delay(5000);
      }
    }

    const executionTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalSingles = results.reduce((sum, r) => sum + (r.singlesFound || 0), 0);

    // Log execution
    await supabase.from('cronjob_execution_log').insert({
      function_name: 'singles-discovery-processor',
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      items_processed: successCount,
      metadata: {
        total_artists: artists.length,
        successful: successCount,
        total_singles_found: totalSingles,
        results,
      },
    });

    console.log(`[singles-discovery-processor] Complete! ${successCount}/${artists.length} artists, ${totalSingles} singles found, took ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: artists.length,
        successful: successCount,
        totalSinglesFound: totalSingles,
        executionTimeMs: executionTime,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[singles-discovery-processor] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
