import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get count parameter from body or default to 20
    let targetCount = 20;
    try {
      const body = await req.json();
      targetCount = body.count || 20;
    } catch {
      console.log('⏰ Cron job triggered - using default count of 20');
    }

    console.log(`🎵 Daily Artist Stories Generator - target: ${targetCount} artists`);

    // Get artists with stories already
    const { data: existingStories, error: storiesError } = await supabase
      .from('artist_stories')
      .select('artist_name');

    if (storiesError) {
      console.error('❌ Error fetching existing stories:', storiesError);
      throw storiesError;
    }

    const existingArtistNames = new Set(existingStories.map(s => s.artist_name));
    console.log(`📊 Found ${existingArtistNames.size} artists with existing stories`);

    // Get curated artists that need stories, prioritize by:
    // 1. Artists with releases found
    // 2. High priority artists first
    // 3. Recently crawled (more likely to have good data)
    const { data: curatedArtists, error: artistsError } = await supabase
      .from('curated_artists')
      .select('artist_name, priority, releases_found_count, last_crawled_at')
      .eq('is_active', true)
      .not('artist_name', 'is', null)
      .order('releases_found_count', { ascending: false, nullsFirst: false })
      .order('priority', { ascending: false })
      .order('last_crawled_at', { ascending: false, nullsFirst: false })
      .limit(500); // Get more than we need to have options

    if (artistsError) {
      console.error('❌ Error fetching curated artists:', artistsError);
      throw artistsError;
    }

    // Filter out artists that already have stories and limit to target count
    const artistsToProcess = curatedArtists
      .filter(artist => 
        artist.artist_name && 
        artist.artist_name.trim().length >= 2 &&
        !existingArtistNames.has(artist.artist_name)
      )
      .slice(0, targetCount)
      .map(a => a.artist_name);

    console.log(`✅ Selected ${artistsToProcess.length} curated artists for processing`);

    if (artistsToProcess.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No new curated artists need stories',
        existing_stories: existingArtistNames.size,
        total_curated: curatedArtists.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if there's already an active batch
    const { data: activeBatch } = await supabase
      .from('batch_processing_status')
      .select('*')
      .eq('process_type', 'artist_story_generation')
      .eq('status', 'processing')
      .maybeSingle();

    if (activeBatch) {
      console.log('⚠️ Active batch already exists, skipping creation');
      return new Response(JSON.stringify({
        success: false,
        message: 'Active batch already in progress',
        batch_id: activeBatch.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create batch processing status
    const { data: batch, error: batchError } = await supabase
      .from('batch_processing_status')
      .insert({
        process_type: 'artist_story_generation',
        status: 'processing',
        total_items: artistsToProcess.length,
        processed_items: 0,
        successful_items: 0,
        failed_items: 0,
        started_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString()
      })
      .select()
      .single();

    if (batchError) {
      console.error('❌ Error creating batch:', batchError);
      throw batchError;
    }

    // Create queue items for each artist
    const queueItems = artistsToProcess.map(artist => ({
      batch_id: batch.id,
      item_id: crypto.randomUUID(),
      item_type: 'artist_story',
      status: 'pending',
      max_attempts: 3,
      metadata: { artist_name: artist }
    }));

    const { error: queueError } = await supabase
      .from('batch_queue_items')
      .insert(queueItems);

    if (queueError) {
      console.error('❌ Error creating queue items:', queueError);
      throw queueError;
    }

    console.log(`✅ Created batch ${batch.id} with ${artistsToProcess.length} items`);
    console.log(`🎤 Artists to process: ${artistsToProcess.slice(0, 5).join(', ')}...`);

    return new Response(JSON.stringify({
      success: true,
      batch_id: batch.id,
      total: artistsToProcess.length,
      sample_artists: artistsToProcess.slice(0, 10)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in daily-artist-stories-generator:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
