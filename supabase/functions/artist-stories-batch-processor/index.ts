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

    const { action } = await req.json();
    console.log(`🎵 Artist stories batch processor - action: ${action}`);

    if (action === 'start') {
      // Get all unique artists from discogs_import_log that don't have stories yet
      const { data: importArtists, error: importError } = await supabase
        .from('discogs_import_log')
        .select('artist')
        .not('artist', 'is', null);

      if (importError) throw importError;

      // Get unique artist names
      const uniqueArtists = [...new Set(importArtists.map(item => item.artist))];
      console.log(`📊 Found ${uniqueArtists.length} unique artists in import log`);

      // Check which artists already have stories
      const { data: existingStories, error: storiesError } = await supabase
        .from('artist_stories')
        .select('artist_name');

      if (storiesError) throw storiesError;

      const existingArtistNames = new Set(existingStories.map(s => s.artist_name));
      const artistsToProcess = uniqueArtists.filter(artist => !existingArtistNames.has(artist));

      console.log(`✅ ${artistsToProcess.length} artists need stories`);

      if (artistsToProcess.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          message: 'No new artists to process'
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

      if (batchError) throw batchError;

      // Create queue items for each artist
      const queueItems = artistsToProcess.map(artist => ({
        batch_id: batch.id,
        item_id: crypto.randomUUID(),
        item_type: 'artist_story',
        status: 'pending',
        metadata: { artist_name: artist }
      }));

      const { error: queueError } = await supabase
        .from('batch_queue_items')
        .insert(queueItems);

      if (queueError) throw queueError;

      console.log(`✅ Created batch ${batch.id} with ${artistsToProcess.length} items`);

      return new Response(JSON.stringify({
        success: true,
        batch_id: batch.id,
        total: artistsToProcess.length,
        artists: artistsToProcess
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'process_next') {
      // Get active batch
      const { data: activeBatch, error: batchError } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'artist_story_generation')
        .eq('status', 'processing')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (batchError || !activeBatch) {
        console.log('❌ No active batch found');
        return new Response(JSON.stringify({
          success: false,
          message: 'No active batch'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get next pending item
      const { data: nextItem, error: itemError } = await supabase
        .from('batch_queue_items')
        .select('*')
        .eq('batch_id', activeBatch.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (itemError || !nextItem) {
        // No more items, mark batch as completed
        await supabase
          .from('batch_processing_status')
          .update({ 
            status: 'completed',
            last_heartbeat: new Date().toISOString()
          })
          .eq('id', activeBatch.id);

        console.log('✅ Batch completed - no more items');
        return new Response(JSON.stringify({
          success: true,
          message: 'Batch completed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Mark item as processing
      await supabase
        .from('batch_queue_items')
        .update({ status: 'processing' })
        .eq('id', nextItem.id);

      console.log(`🎤 Processing artist: ${nextItem.metadata.artist_name}`);

      // Call generate-artist-story function
      try {
        const { data: storyData, error: storyError } = await supabase.functions.invoke('generate-artist-story', {
          body: { artist_name: nextItem.metadata.artist_name }
        });

        if (storyError) throw storyError;

        // Mark item as completed
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', nextItem.id);

        // Update batch counters
        await supabase
          .from('batch_processing_status')
          .update({
            processed_items: activeBatch.processed_items + 1,
            successful_items: activeBatch.successful_items + 1,
            last_heartbeat: new Date().toISOString()
          })
          .eq('id', activeBatch.id);

        console.log(`✅ Successfully generated story for ${nextItem.metadata.artist_name}`);

        return new Response(JSON.stringify({
          success: true,
          artist: nextItem.metadata.artist_name,
          story_id: storyData.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error: any) {
        console.error(`❌ Failed to generate story for ${nextItem.metadata.artist_name}:`, error);

        // Mark item as failed
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'failed',
            error_message: error.message,
            processed_at: new Date().toISOString(),
            attempts: nextItem.attempts + 1
          })
          .eq('id', nextItem.id);

        // Update batch counters
        await supabase
          .from('batch_processing_status')
          .update({
            processed_items: activeBatch.processed_items + 1,
            failed_items: activeBatch.failed_items + 1,
            last_heartbeat: new Date().toISOString()
          })
          .eq('id', activeBatch.id);

        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          artist: nextItem.metadata.artist_name
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (action === 'status') {
      // Get latest batch status
      const { data: latestBatch, error: batchError } = await supabase
        .from('batch_processing_status')
        .select('*')
        .eq('process_type', 'artist_story_generation')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (batchError || !latestBatch) {
        return new Response(JSON.stringify({
          success: false,
          message: 'No batch found'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get queue statistics
      const { data: queueStats, error: statsError } = await supabase
        .from('batch_queue_items')
        .select('status')
        .eq('batch_id', latestBatch.id);

      if (statsError) throw statsError;

      const stats = {
        pending: queueStats.filter(item => item.status === 'pending').length,
        processing: queueStats.filter(item => item.status === 'processing').length,
        completed: queueStats.filter(item => item.status === 'completed').length,
        failed: queueStats.filter(item => item.status === 'failed').length
      };

      return new Response(JSON.stringify({
        ...latestBatch,
        queue_stats: stats
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in artist stories batch processor:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
